// app/page.tsx - Server Component
import prisma from "@/lib/prisma";
import Button from "./components/button";
import AdminChallengeForm from "./components/admin-form";

// Define ChallengeData interface - can also be in a shared types file
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

// Finds or creates a user based on their ID (e.g., Whop User ID)
async function findOrCreateUser(
  userId: string
): Promise<{ id: string } | null> {
  if (!userId) return null; // Do nothing if no user ID provided

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }, // Only select needed fields
    });

    if (user) {
      return user; // User found
    }

    // User not found, create them
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        // createdAt is handled by @default(now())
      },
      select: { id: true },
    });
    console.log(`Created new user: ${newUser.id}`);
    return newUser;
  } catch (error) {
    console.error(`Error finding or creating user ${userId}:`, error);
    return null; // Return null on error
  }
}

export default async function Page() {
  const { challengeAvailable, challengeData, message } =
    await getChallengeStatus();

  // const { userId: whopUserId } = await validateToken({
  //   headers: headersList,
  // });
  const whopUserId = "user_" + Math.random().toString(36).substring(7); // Example user ID
  const user = await findOrCreateUser(whopUserId);

  const adminUser = false; // Let's set this to false to test user flow

  let content;
  if (adminUser) {
    content = <AdminChallengeForm />;
  } else if (challengeAvailable && challengeData && user) {
    // Pass both challenge data AND the user ID to the Button
    content = <Button initialChallengeData={challengeData} userId={user.id} />;
  } else if (!user) {
    // Handle case where user ID couldn't be determined or created
    content = (
      <p className="text-xl mb-8 text-red-500">
        Error: Could not identify user.
      </p>
    );
  } else {
    // No challenge available for a valid user
    content = (
      <p className="text-xl mb-8">
        {message || "No active challenges available."}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="flex flex-col items-center text-center">{content}</main>
    </div>
  );
}
