import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Use the utility

export async function GET() {
  try {
    const availableChallenge = await prisma.challenge.findFirst({
      where: {
        winnerUserId: null, // Find a challenge that hasn't been won yet
      },
      orderBy: {
        createdAt: "asc", // Optionally, pick the oldest available challenge
      },
      select: {
        id: true,
        promotionalHtml: true,
        winAmount: true,
      },
    });

    if (availableChallenge) {
      return NextResponse.json({
        challengeAvailable: true,
        challenge: availableChallenge,
      });
    } else {
      return NextResponse.json({
        challengeAvailable: false,
        message: "No active challenges available right now. Check back later!",
      });
    }
  } catch (error) {
    console.error("Error fetching challenge status:", error);
    return NextResponse.json(
      {
        challengeAvailable: false,
        message: "An error occurred while checking for challenges.",
      },
      { status: 500 }
    );
  }
}
