"use server";

import prisma from "@/lib/prisma";

// Define the state shape that the action will return and useFormState will manage
interface FormState {
  message: string | null;
  error: string | null;
  success: boolean;
}

// Server action now takes previousState as its first argument
export async function createChallenge(
  prevState: FormState,
  headers: Headers,
  formData: FormData
): Promise<FormState> {
  // Ensure return type matches FormState

  console.log(headers);
  // const { userId: whopUserId } = await validateToken({
  //   headers,
  // });

  // const adminUser = whopUserId === process.env.OWNER_USER_ID;

  // if (!adminUser) {
  //   return {
  //     error: "You are not authorized to create a challenge.",
  //     message: null,
  //     success: false,
  //   };
  // }
  const rawFormData = {
    winAmount: formData.get("winAmount"),
    promotionalHtml: formData.get("promotionalHtml"),
  };

  // Basic validation and type conversion
  const winAmountFloat = parseFloat(rawFormData.winAmount as string);
  const promotionalHtmlString = rawFormData.promotionalHtml as string;

  if (isNaN(winAmountFloat) || winAmountFloat <= 0) {
    return {
      error: "Invalid win amount. Please enter a positive number.",
      message: null,
      success: false,
    };
  }

  if (!promotionalHtmlString || promotionalHtmlString.trim() === "") {
    // Allow empty HTML for now, but could add validation
    // return { error: 'Promotional HTML cannot be empty.' };
  }

  try {
    const newChallenge = await prisma.challenge.create({
      data: {
        winAmount: winAmountFloat,
        promotionalHtml: promotionalHtmlString,
        // winnerUserId is null by default (as defined in schema)
      },
    });
    console.log("Created new challenge:", newChallenge.id);

    // Revalidate the home page path to show the new state

    return {
      success: true,
      message: `Challenge ${newChallenge.id} created!`,
      error: null,
    };
  } catch (error) {
    console.error("Failed to create challenge:", error);
    return {
      error: "Database error: Failed to create challenge.",
      message: null,
      success: false,
    };
  }
}
