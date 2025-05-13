"use client";
import React from "react";

export default function GithubUrl() {
  const openWindow = () => {
    window.open("https://github.com/stevo2105/first-button-press", "_blank");
  };
  return (
    <button
      onClick={openWindow}
      className="text-blue-500 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      View Whop App source code on GitHub
    </button>
  );
}
