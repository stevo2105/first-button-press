import { WhopApi } from "@whop/api";
import prisma from "@/lib/prisma";

export const whopApi = WhopApi({
  appApiKey: process.env.WHOP_API_KEY!,
  onBehalfOfUserId: process.env.OWNER_USER_ID!,
});

export async function payWinner(whopUserId: string, amount: number) {
  const realAmount = amount * 0.9;
  try {
    const response = await fetch("https://api.whop.com/public-graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        "x-on-behalf-of": "user_nrxHyu5XRFjkS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation TransferFunds($input: TransferFundsInput!) {
            transferFunds(input: $input)
          }
        `,
        variables: {
          input: {
            amount: realAmount,
            currency: "usd",
            destinationId: whopUserId,
            feedId: "chat_feed_1CNxeUNiTLrtNcvBZMW2hp",
            feedType: "chat_feed",
            transferFee: realAmount * 100 * 0.03,
            idempotenceKey: `payout-${whopUserId}-${Date.now()}`,
            ledgerAccountId: "ldgr_czXFOJHH4Ih14",
            reason: "creator_to_user",
          },
        },
      }),
    });

    console.log("Response:", amount);

    if (!response.ok) {
      throw new Error(
        `GraphQL Error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error("Erro calling gql");
    }

    const user = await prisma.user.findUnique({
      where: { id: whopUserId },
    });
    if (!user) {
      console.log("User not found in database.");
      return;
    }
    const userDetails = await whopApi.PublicUser({ userId: whopUserId });
    const userName = userDetails.publicUser.username;
    const message = `@${userName} was paid $${amount.toFixed(
      2
    )} automatically for winning the game!`;
    await sendWhopWebhook(message);
  } catch (error) {
    console.error("Failed to pay winner:", error);
    throw error;
  }
}

export async function sendWhopWebhook(content: string) {
  const webhookUrl =
    "https://data.whop.com/api/v5/feed/webhooks/eyJfcmFpbHMiOnsiZGF0YSI6WzEwMTA5NF0sInB1ciI6IkZlZWQ6OldlYmhvb2tcbmV4ZWN1dGVfd2ViaG9va1xuIn19--ac716882d1c92ac9d3ba12410d6a76e6069eecb1/execute";

  const payload = {
    content, // For simple display if the webhook supports it (Discord-style)
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(
        `Webhook to Whop failed with status ${
          response.status
        }: ${responseBody}. Payload: ${JSON.stringify(payload)}`
      );
    } else {
      console.log("Whop webhook sent successfully.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error sending Whop webhook: ${errorMessage}. Payload: ${JSON.stringify(
        payload
      )}`
    );
  }
}
