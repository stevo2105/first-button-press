"use client";
import Image from "next/image";
import React, { useState } from "react";

// Interface for the data passed from the page
interface ChallengeData {
  id: string;
  promotionalHtml: string;
  winAmount: number;
}

// Props for the Button component - Added userId
interface ButtonProps {
  initialChallengeData: ChallengeData;
  userId: string; // Added user ID prop
}

// Internal state interface for the button
interface ButtonInteractionState {
  isLoading: boolean; // Loading state for the submit action
  message: string | null; // Message after submit action
  isButtonPressed: boolean;
  hasWon: boolean;
  isChallengeOver: boolean;
}

// Helper function to play a sound
const playSound = (src: string, volume: number = 1.0) => {
  // Check if running in a browser environment
  if (typeof window !== "undefined") {
    const audio = new Audio(src);
    audio.volume = volume;
    audio
      .play()
      .catch((error) => console.error(`Error playing sound ${src}:`, error));
    // No need to clean up short sounds usually, they stop on their own
  }
};

export default function Button({ initialChallengeData, userId }: ButtonProps) {
  // Initialize state based on props and initial assumptions
  const [state, setState] = useState<ButtonInteractionState>({
    isLoading: false, // Not loading initially
    message: null, // No result message initially
    isButtonPressed: false,
    hasWon: false,
    isChallengeOver: false, // Assume challenge is active initially
  });

  // --- Button Press Handlers ---
  const handlePress = () => {
    // Only allow press if the challenge isn't over and not currently submitting
    if (!state.isLoading && !state.isChallengeOver) {
      playSound("/press.m4a"); // Play press sound
      setState((prev) => ({ ...prev, isButtonPressed: true }));
    }
  };

  const handleRelease = async () => {
    if (!state.isButtonPressed) return;

    setState((prev) => ({ ...prev, isButtonPressed: false }));

    // Only submit if challenge is not already over
    if (!state.isChallengeOver) {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        message: "Submitting...",
      }));

      try {
        const response = await fetch("/api/submit-press", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Send challengeId AND userId
          body: JSON.stringify({
            challengeId: initialChallengeData.id,
            userId: userId,
          }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          playSound("/win.m4a"); // Play win sound
          setState((prev) => ({
            ...prev,
            isLoading: false,
            message: data.message,
            hasWon: true,
            isChallengeOver: true,
          }));
        } else {
          playSound("/lose.m4a"); // Play lose sound
          setState((prev) => ({
            ...prev,
            isLoading: false,
            message: data.message || "Failed to submit press.",
            hasWon: false,
            isChallengeOver: response.status === 409 || prev.isChallengeOver,
          }));
        }
      } catch (error) {
        playSound("/lose.m4a"); // Also play lose sound on fetch error
        console.error("Failed to submit press:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          message: "Error submitting press.",
        }));
      }
    }
  };

  // Keyboard handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      (event.key === " " || event.key === "Enter") &&
      !state.isButtonPressed
    ) {
      event.preventDefault();
      handlePress();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleRelease();
    }
  };

  // --- Render Logic Helpers ---
  // Now assume challenge is available if this component is rendered
  const getButtonImageSrc = () => {
    // If challenge is over, show result GIF
    if (state.isChallengeOver) {
      return state.hasWon ? "/winner.gif" : "/loser.gif";
    }
    // Otherwise, show button state
    return state.isButtonPressed ? "/button_pressed.png" : "/button.png";
  };

  const getButtonAltText = () => {
    if (state.isChallengeOver)
      return state.hasWon ? "Challenge Won!" : "Challenge Over";
    return "Press Me First!";
  };

  const getButtonContainerClassName = () => {
    let baseClasses = "cursor-pointer focus:outline-none rounded-full";
    // Disable look if challenge is over or currently submitting
    if (state.isChallengeOver || state.isLoading) {
      baseClasses =
        "cursor-not-allowed focus:outline-none rounded-full opacity-60";
    }
    return baseClasses;
  };

  const getImageClassName = () => {
    // Keep scale effect, remove grayscale as it might look weird on GIFs
    return `select-none transition-transform duration-100 ease-in-out \
            ${
              state.isButtonPressed && !state.isChallengeOver
                ? "scale-95"
                : "scale-100"
            }`;
  };

  // --- Render Component ---
  return (
    <div className="flex flex-col items-center text-center">
      {/* Render details from props */}
      <h1 className="text-4xl font-bold mb-4">Press the Button!</h1>
      <div
        className="mb-8 p-4 bg-gray-200 dark:bg-gray-700 rounded shadow min-w-[300px] max-w-md"
        dangerouslySetInnerHTML={{
          __html: initialChallengeData.promotionalHtml || "",
        }}
      ></div>
      <p className="mb-4 text-lg">
        Win Amount: ${initialChallengeData.winAmount}
      </p>

      {/* The Button itself */}
      <div
        role={state.isChallengeOver ? undefined : "button"}
        tabIndex={state.isChallengeOver || state.isLoading ? -1 : 0}
        aria-pressed={state.isChallengeOver ? undefined : state.isButtonPressed}
        aria-label={getButtonAltText()}
        onMouseDown={
          !state.isChallengeOver && !state.isLoading ? handlePress : undefined
        }
        onMouseUp={
          !state.isChallengeOver && !state.isLoading ? handleRelease : undefined
        }
        onMouseLeave={
          !state.isChallengeOver && !state.isLoading ? handleRelease : undefined
        }
        onTouchStart={
          !state.isChallengeOver && !state.isLoading ? handlePress : undefined
        }
        onTouchEnd={
          !state.isChallengeOver && !state.isLoading ? handleRelease : undefined
        }
        onKeyDown={
          !state.isChallengeOver && !state.isLoading ? handleKeyDown : undefined
        }
        onKeyUp={
          !state.isChallengeOver && !state.isLoading ? handleKeyUp : undefined
        }
        className={getButtonContainerClassName()}
      >
        <Image
          src={getButtonImageSrc()}
          alt={getButtonAltText()}
          width={200}
          height={200}
          priority
          unoptimized
          draggable="false"
          className={getImageClassName()}
        />
      </div>

      {/* Result Messages based on internal state */}
      {state.message && state.isChallengeOver && (
        <p
          className={`mt-6 text-xl font-semibold ${
            state.hasWon ? "text-green-500" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}
      {state.isLoading && state.message && !state.isChallengeOver && (
        <p className="mt-6 text-xl">{state.message}</p>
      )}
    </div>
  );
}
