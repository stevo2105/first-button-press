// app/page.tsx - Server Component
import prisma from "@/lib/prisma";
import Button from "./components/button";
import AdminChallengeForm from "./components/admin-form";
import NoActiveChallenges from "./components/no-active-challenges";
import { fetchUser } from "./whop-api-init";
import { validateToken } from "@whop-apps/sdk";
import { headers } from "next/headers";

interface ChallengeData {
  id: string;
  promotionalHtml: string;
  winAmount: number;
}

// Helper function to fetch challenge status (or use prisma directly in Page)
async function getChallengeStatus(): Promise<{
  challengeAvailable: boolean;
  challengeData: ChallengeData | null;
  message: string | null;
}> {
  try {
    const availableChallenge = await prisma.challenge.findFirst({
      where: { winnerUserId: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, promotionalHtml: true, winAmount: true },
    });
    if (availableChallenge) {
      return {
        challengeAvailable: true,
        challengeData: availableChallenge,
        message: null,
      };
    } else {
      return {
        challengeAvailable: false,
        challengeData: null,
        message: "No active challenges available right now.",
      };
    }
  } catch (error) {
    console.error("Error fetching challenge status in Page:", error);
    return {
      challengeAvailable: false,
      challengeData: null,
      message: "Error loading challenge.",
    };
  }
}

// Finds or creates a user, and updates/sets username and profilePicture
async function findOrCreateUser(userId: string): Promise<{
  id: string;
  username?: string | null;
  profilePicture?: string | null;
} | null> {
  if (!userId) return null;

  let username: string | null = null;
  let profilePictureUrl: string | null = null;

  try {
    // const publicUserResponse = await whopApi.PublicUser({ userId: userId });
    const publicUserResponse = await fetchUser(userId);
    username = publicUserResponse?.publicUser?.username || null;

    // Check if profilePicture is an ImageAttachment and get sourceUrl
    const whopProfilePic = publicUserResponse?.publicUser?.profilePicture;
    if (whopProfilePic && whopProfilePic.__typename === "ImageAttachment") {
      profilePictureUrl = whopProfilePic.sourceUrl || null;
    } else if (typeof whopProfilePic === "string") {
      // Fallback if it's just a string URL (older API version?)
      profilePictureUrl = whopProfilePic;
    }
  } catch (whopError) {
    console.warn(`Could not fetch Whop user details for ${userId}:`, whopError);
    // Continue without Whop details, or handle error as critical if needed
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: username, // Update with latest from Whop API
        profilePicture: profilePictureUrl,
      },
      create: {
        id: userId,
        username: username,
        profilePicture: profilePictureUrl,
        // createdAt is handled by @default(now())
      },
      select: { id: true, username: true, profilePicture: true }, // Select all relevant fields
    });

    console.log(
      `User ${user.id} processed. Username: ${user.username}, Pic: ${user.profilePicture}`
    );
    return user;
  } catch (dbError) {
    console.error(`Database error for user ${userId}:`, dbError);
    // If Whop details were fetched but DB failed, we lose them for this request.
    // Depending on requirements, you might try to fetch just the user ID if upsert fails
    // or return a more specific error.
    return null;
  }
}

export default async function Page() {
  const {
    challengeAvailable,
    challengeData,
    message: challengeStatusMessage,
  } = await getChallengeStatus();
  const headersList = await headers();

  const { userId: whopUserId } = await validateToken({
    headers: headersList,
  });

  const user = await findOrCreateUser(whopUserId);

  const adminUser = whopUserId === process.env.OWNER_USER_ID; // Let's set this to false to test user flow

  let content;

  // always check first for challenge to let the admin play

  if (challengeAvailable && challengeData && user) {
    content = <Button initialChallengeData={challengeData} userId={user.id} />;
  } else if (adminUser) {
    content = <AdminChallengeForm />;
  } else if (!user) {
    // Handle case where user ID couldn't be determined or created

    content = (
      <p className="text-xl mb-8 text-red-500">
        Error: Could not identify or process user.
      </p>
    );
  } else {
    // Pass the challenge status message to NoActiveChallenges component
    content = (
      <NoActiveChallenges
        initialMessage={
          challengeStatusMessage ||
          "No active challenges available at the moment."
        }
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="flex flex-col items-center text-center">{content}</main>
    </div>
  );
}
