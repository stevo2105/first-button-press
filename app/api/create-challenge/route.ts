import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateToken } from "@whop-apps/sdk";
import { headers as getNextHeaders } from "next/headers"; // To get headers in API route
import { sendWhopWebhook } from "@/app/whop-api-init";

export async function POST(request: Request) {
  // Get headers for token validation
  const headersList = getNextHeaders();
  let whopUserId: string | undefined;

  try {
    const tokenData = await validateToken({ headers: headersList });
    whopUserId = tokenData.userId;
  } catch (e) {
    console.error("Token validation failed in /api/create-challenge:", e);
    // return NextResponse.json(
    //   { success: false, message: "Authentication failed. Please try again." },
    //   { status: 401 } // Unauthorized
    // );
  }

  if (!whopUserId) {
    // return NextResponse.json(
    //   { success: false, message: "Could not verify user." },
    //   { status: 401 }
    // );
  }

  // Check if the authenticated user is the admin/owner
  const adminUser = whopUserId === process.env.OWNER_USER_ID;
  if (!adminUser) {
    // return NextResponse.json(
    //   {
    //     success: false,
    //     message: "You are not authorized to create a challenge.",
    //   },
    //   { status: 403 } // Forbidden
    // );
  }

  // Proceed to get form data from the request body
  try {
    const formData = await request.json(); // Assuming JSON body from client
    const { winAmount, promotionalHtml } = formData;

    const winAmountFloat = parseFloat(winAmount as string);
    const promotionalHtmlString = promotionalHtml as string;

    if (isNaN(winAmountFloat) || winAmountFloat <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid win amount. Please enter a positive number.",
        },
        { status: 400 } // Bad Request
      );
    }
    // promotionalHtmlString can be empty based on previous logic

    const newChallenge = await prisma.challenge.create({
      data: {
        winAmount: winAmountFloat,
        promotionalHtml: promotionalHtmlString,
      },
    });

    sendWhopWebhook(
      `New challenge created! Win amount of $${winAmountFloat}! Play here https://whop.com/steven/press-the-button-6X1q13F3jT6Bs3/app/`
    );

    // Note: revalidatePath cannot be called directly from an API route in the same way as a Server Action.
    // The client will need to handle UI updates or page refresh/re-fetch if immediate reflection is needed.
    // For now, we just return success.

    return NextResponse.json(
      {
        success: true,
        message: `Challenge ${newChallenge.id} created!`,
        challengeId: newChallenge.id,
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error("Failed to create challenge via API:", error);
    // Check if it's a data validation error from JSON parsing or prisma error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }
    // Add more specific error handling for Prisma if needed
    return NextResponse.json(
      { success: false, message: "Database error or internal server error." },
      { status: 500 }
    );
  }
}
