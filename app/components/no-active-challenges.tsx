"use client";

import React, { useState } from "react";
import Image from "next/image"; // Import Next/Image for profile pictures

interface Winner {
  id: string; // Challenge ID
  winAmount: number;
  winnerUserId: string | null;
  username: string; // Expect username to be present
  profilePicture: string | null; // Profile picture URL can be null
  // Add other relevant fields like a timestamp if available
}

interface NoActiveChallengesProps {
  initialMessage: string;
}

export default function NoActiveChallenges({
  initialMessage,
}: NoActiveChallengesProps) {
  const [showWinners, setShowWinners] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleViewWinnersClick = async () => {
    setIsLoadingWinners(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/recent-winners");
      const data = await response.json();
      if (response.ok && data.success) {
        setWinners(data.winners || []);
        setShowWinners(true);
      } else {
        setFetchError(data.message || "Failed to load winners.");
      }
    } catch (error) {
      console.error("Error fetching recent winners:", error);
      setFetchError("An error occurred while fetching winners.");
    }
    setIsLoadingWinners(false);
  };

  const handleBackClick = () => {
    setShowWinners(false);
    setWinners([]); // Clear winners
    setFetchError(null); // Clear error
  };

  if (showWinners) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-6">Recent Winners</h2>
        {isLoadingWinners && <p>Loading winners...</p>}
        {fetchError && <p className="text-red-500">{fetchError}</p>}
        {!isLoadingWinners && !fetchError && winners.length > 0 && (
          <ul className="space-y-4 list-none p-0 max-w-md mx-auto">
            {winners.map((winner) => (
              <li
                key={winner.id}
                className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md shadow gap-4"
              >
                {winner.profilePicture ? (
                  <Image
                    src={winner.profilePicture}
                    alt={`${winner.username || "Winner"}'s profile picture`}
                    width={50}
                    height={50}
                    className="rounded-full"
                    unoptimized // If profile pictures are external and already optimized
                  />
                ) : (
                  <div className="w-[50px] h-[50px] bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm">
                    No Pic
                  </div>
                )}
                <div>
                  <p className="font-semibold text-left">
                    {winner.username || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                    Won:{" "}
                    <span className="font-semibold">
                      ${winner.winAmount.toFixed(2)}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isLoadingWinners && !fetchError && winners.length === 0 && (
          <p>No winners to display yet.</p>
        )}
        <button
          onClick={handleBackClick}
          className="mt-8 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  // Initial view: Message and hyperlink
  return (
    <div className="text-center p-8">
      <p className="text-xl mb-4">{initialMessage}</p>
      <button
        onClick={handleViewWinnersClick}
        disabled={isLoadingWinners}
        className="text-blue-500 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoadingWinners ? "Loading..." : "View Recent Winners"}
      </button>
      {fetchError && <p className="mt-2 text-sm text-red-500">{fetchError}</p>}{" "}
      {/* Show fetch error here too if any */}
    </div>
  );
}
