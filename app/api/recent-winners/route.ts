import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Define an interface for the shape of the challenge object returned by Prisma
interface ChallengeWithWinnerData {
  id: string;
  winAmount: number;
  winnerUserId: string | null; // It will not be null based on the where clause, but keep for consistency
  createdAt: Date | null; // Added for completion time calculation
  challengeEndedAt: Date | null; // Added challengeEndedAt for sorting
  winnerUser: {
    username: string | null;
    profilePicture: string | null;
  } | null; // winnerUser can be null if relation is optional, though our query implies it exists
}

export async function GET() {
  try {
    // Cast the result of findMany to our defined interface if confident in the shape
    const recentChallengesWithWinners = (await prisma.challenge.findMany({
      where: {
        winnerUserId: { not: null }, // Only challenges that have a winner
        challengeEndedAt: { not: null }, // Ensure we only get challenges that have properly ended
      },
      orderBy: {
        challengeEndedAt: "desc", // Sort by when the challenge ended
      },
      take: 5,
      select: {
        id: true, // challenge ID
        winAmount: true,
        winnerUserId: true,
        createdAt: true, // Select the start field
        challengeEndedAt: true, // Select the end field
        // Include winnerUser details
        winnerUser: {
          // This assumes you have a relation named 'winnerUser' in your Challenge model
          select: {
            username: true,
            profilePicture: true,
          },
        },
      },
    })) as ChallengeWithWinnerData[]; // Added type assertion

    // Transform the data to a more convenient structure for the frontend if needed
    const winners = recentChallengesWithWinners.map((challenge) => {
      let completionTimeMs: number | undefined = undefined;
      if (challenge.createdAt && challenge.challengeEndedAt) {
        completionTimeMs =
          challenge.challengeEndedAt.getTime() - challenge.createdAt.getTime();
      }

      return {
        id: challenge.id, // Challenge ID
        winAmount: challenge.winAmount,
        winnerUserId: challenge.winnerUserId,
        username: challenge.winnerUser?.username || "Unknown User", // Fallback for username
        profilePicture: challenge.winnerUser?.profilePicture || null, // Fallback for profile picture
        completionTimeMs: completionTimeMs,
        // You could also include challengeEndedAt in the response if the frontend needs it
        // challengeEndedAt: challenge.challengeEndedAt,
      };
    });

    return NextResponse.json({ success: true, winners: winners });
  } catch (error) {
    console.error("Error fetching recent winners:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recent winners." },
      { status: 500 }
    );
  }
}
