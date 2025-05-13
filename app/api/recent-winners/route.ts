import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Define an interface for the shape of the challenge object returned by Prisma
interface ChallengeWithWinnerData {
  id: string;
  winAmount: number;
  winnerUserId: string | null; // It will not be null based on the where clause, but keep for consistency
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
      },
      orderBy: {
        // Assuming you have a field like `updatedAt` or `claimedAt` on Challenge
        // that gets set when a winner is declared. If not, `createdAt` of the challenge
        // might be the next best thing, though it reflects creation time, not win time.
        // For this example, I'll assume `createdAt` of the challenge (desc) is good enough.
        // Or, if you have a `Winner` table with a timestamp, query that instead and join.
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true, // challenge ID
        winAmount: true,
        winnerUserId: true,
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
    const winners = recentChallengesWithWinners.map((challenge) => ({
      id: challenge.id, // Challenge ID
      winAmount: challenge.winAmount,
      winnerUserId: challenge.winnerUserId,
      username: challenge.winnerUser?.username || "Unknown User", // Fallback for username
      profilePicture: challenge.winnerUser?.profilePicture || null, // Fallback for profile picture
    }));

    return NextResponse.json({ success: true, winners: winners });
  } catch (error) {
    console.error("Error fetching recent winners:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recent winners." },
      { status: 500 }
    );
  }
}
