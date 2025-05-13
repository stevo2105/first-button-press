import { NextResponse } from "next/server";

// Simple in-memory flag to simulate database check
let hasWinner = false;
let winnerUserId: string | null = null; // Store the winner's ID (simulated)

// Simulate a default challenge
const challenge = {
  id: "chal_123",
  reward: "Eternal Glory",
  marketing_text: "Be the first to click!",
};

export async function POST(request: Request) {
  // Simulate checking for the winner in the "database"
  if (!hasWinner) {
    // No winner yet, claim victory!
    hasWinner = true;
    winnerUserId = "user_placeholder_id"; // Assign a placeholder ID

    // Here you would normally create a Winner record in your database
    // associated with the challenge and the user.
    // e.g., db.winner.create({ data: { userId: winnerUserId, challengeId: challenge.id } });

    console.log(
      `Winner claimed by ${winnerUserId} for challenge ${challenge.id}`
    );

    return NextResponse.json({
      success: true,
      message: `Congratulations! You (${winnerUserId}) are the first to click!`,
      challenge: {
        ...challenge,
        winner_user_id: winnerUserId, // Add winner ID to the challenge info returned
      },
    });
  } else {
    // Winner already exists
    console.log(
      `Attempt to claim already won challenge ${challenge.id}. Current winner: ${winnerUserId}`
    );
    return NextResponse.json(
      {
        success: false,
        message: "Someone else was faster! Try again next time.",
        challenge: {
          ...challenge,
          winner_user_id: winnerUserId, // Show the existing winner
        },
      },
      { status: 409 }
    ); // 409 Conflict is appropriate here
  }
}

// Optional: GET handler to check the status without trying to claim
export async function GET(request: Request) {
  return NextResponse.json({
    hasWinner: hasWinner,
    winnerUserId: winnerUserId,
    challenge: challenge,
  });
}
