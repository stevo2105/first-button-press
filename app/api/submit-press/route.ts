import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { payWinner } from "@/app/whop-api-init";

// Helper function to check if an error has a specific code (like P2025)
function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code === code
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, userId } = body;

    if (!challengeId || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing challenge ID or user ID." },
        { status: 400 }
      );
    }

    let winningAmountFromChallenge: number | null = null;
    let winnerUsername: string = "Unknown User"; // Default username, ensure it's always a string

    // --- Atomic Update Attempt ---
    // We will use a transaction to ensure atomicity, although a single update
    // with a where clause checking for null winner is often sufficient.
    // A transaction is slightly more explicit about the read-then-write intent.

    try {
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Find the challenge, ensuring it hasn't been won *yet*
          const challenge = await tx.challenge.findUnique({
            where: {
              id: challengeId,
              winnerUserId: null, // Crucial: Only match if no winner
            },
            select: { id: true, winAmount: true }, // Select winAmount to use it in the success message
          });

          // 2. If challenge exists and is not won, update it
          if (challenge) {
            winningAmountFromChallenge = challenge.winAmount; // Store the amount won
            await tx.challenge.update({
              where: {
                id: challengeId,
                // Optional: Add winnerUserId: null here again for extra safety,
                // though the initial findUnique should suffice within the transaction.
              },
              data: {
                winnerUserId: userId,
              },
            });

            // Fetch the username of the winner
            const winnerDetails = await tx.user.findUnique({
              where: { id: userId },
              select: { username: true },
            });
            if (winnerDetails && winnerDetails.username) {
              winnerUsername = winnerDetails.username;
            }

            return { won: true };
          } else {
            // Challenge was not found OR it already had a winner when we checked
            return { won: false };
          }
        }
      );

      // 3. Return response based on transaction outcome
      if (result.won) {
        if (typeof winningAmountFromChallenge === "number") {
          await payWinner(userId, winningAmountFromChallenge);

          return NextResponse.json({
            success: true,
            message: `Congratulations ${winnerUsername}, you won $${winningAmountFromChallenge}
            )}!`,
          });
        } else {
          // This case should ideally not be reached if result.won is true
          // because winningAmountFromChallenge would have been set.
          console.error("Winning amount was not a number after a win.");
          return NextResponse.json({
            success: true,
            message: `Congratulations ${winnerUsername}, you were first! (Amount not determined)`,
          });
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Too slow! Someone else claimed the win.",
          },
          { status: 409 } // 409 Conflict
        );
      }
    } catch (e: unknown) {
      // This could catch errors during the transaction itself (e.g., DB connection issue)
      // It might also catch concurrency issues if not handled perfectly by the DB,
      // though Prisma/Postgres transactions are generally robust.
      console.error("Transaction failed:", e);
      // Use the helper function to check for the P2025 code
      if (isPrismaErrorWithCode(e, "P2025")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Too slow! Someone else claimed the win (or challenge ended).",
          },
          { status: 409 } // 409 Conflict
        );
      }
      // Handle other potential transaction errors
      return NextResponse.json(
        {
          success: false,
          message: "Failed to submit press due to a server error.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle errors like invalid JSON body
    console.error("Error processing press submission:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred processing your request." },
      { status: 500 }
    );
  }
}
