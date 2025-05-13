"use client";

import { useEffect, useRef } from "react";

export default function BackgroundAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create audio element only once
      if (!audioRef.current) {
        audioRef.current = new Audio("/background.m4a");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5; // 50% volume
      }

      // Attempt to play. Browsers might block autoplay until user interaction.
      audioRef.current.play().catch((error) => {
        console.warn(
          "Background audio autoplay failed. User interaction might be needed first.",
          error
        );
        // Optionally, add a listener for the first user interaction on the document
        // to try playing again if autoplay is blocked.
        const playOnFirstInteraction = () => {
          audioRef.current
            ?.play()
            .catch((err) => console.warn("Retry play failed:", err));
          document.removeEventListener("click", playOnFirstInteraction);
          document.removeEventListener("keydown", playOnFirstInteraction);
        };
        document.addEventListener("click", playOnFirstInteraction);
        document.addEventListener("keydown", playOnFirstInteraction);
      });

      // Cleanup function to stop audio when component unmounts
      return () => {
        audioRef.current?.pause();
        // document.removeEventListener('click', playOnFirstInteraction); // Might be already removed
        // document.removeEventListener('keydown', playOnFirstInteraction); // Might be already removed
      };
    }
  }, []); // Empty array ensures this runs only on mount and unmount

  return null; // This component does not render anything visible
}
