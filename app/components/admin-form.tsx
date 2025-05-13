"use client";

import React, { useState } from "react";
// No longer importing createChallenge from '@/app/actions'

// Interface for the component's local state
interface FormComponentState {
  isLoading: boolean;
  message: string | null;
  error: string | null;
  success: boolean;
}

// SubmitButton is now simpler, just uses isLoading from local state
function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <button
      type="submit"
      aria-disabled={isLoading}
      disabled={isLoading}
      className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? "Creating..." : "Create Challenge"}
    </button>
  );
}

export default function AdminChallengeForm() {
  const [formState, setFormState] = useState<FormComponentState>({
    isLoading: false,
    message: null,
    error: null,
    success: false,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState({
      isLoading: true,
      message: null,
      error: null,
      success: false,
    });

    const formData = new FormData(event.currentTarget);
    const winAmount = formData.get("winAmount");
    const promotionalHtml = formData.get("promotionalHtml");

    // Basic client-side validation (can be enhanced)
    if (!winAmount || !promotionalHtml) {
      setFormState({
        isLoading: false,
        message: null,
        error: "Both fields are required.",
        success: false,
      });
      return;
    }

    try {
      const response = await fetch("/api/create-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: Headers for token validation are handled by the API route itself
          // using next/headers() because it's a new request to the API.
        },
        body: JSON.stringify({
          winAmount: winAmount,
          promotionalHtml: promotionalHtml,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormState({
          isLoading: false,
          message: data.message || "Challenge created successfully!",
          error: null,
          success: true,
        });
        // Optionally reset form fields here
        // event.currentTarget.reset();
        // To see the new challenge, the page might need a refresh or re-fetch logic.
        // Consider using router.refresh() if you want to re-run server components.
        // import { useRouter } from 'next/navigation'; (then const router = useRouter())
        // router.refresh();
      } else {
        setFormState({
          isLoading: false,
          message: null,
          error: data.message || "Failed to create challenge.",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormState({
        isLoading: false,
        message: null,
        error: "An unexpected error occurred.",
        success: false,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 items-center w-full max-w-md p-6 border rounded-lg bg-white dark:bg-gray-800 shadow"
    >
      <h2 className="text-2xl font-semibold mb-4">Create New Challenge</h2>

      <div className="w-full">
        <label
          htmlFor="winAmount"
          className="block text-sm font-medium mb-1 text-left"
        >
          Win Amount:
        </label>
        <input
          type="number"
          id="winAmount"
          name="winAmount"
          required
          step="any"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="e.g., 10.50"
          disabled={formState.isLoading} // Disable input while loading
        />
      </div>
      <div className="w-full">
        <label
          htmlFor="promotionalHtml"
          className="block text-sm font-medium mb-1 text-left"
        >
          Promotional HTML:
        </label>
        <textarea
          id="promotionalHtml"
          name="promotionalHtml"
          rows={4}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="<p>Be the <b>first</b> to click!</p>"
          disabled={formState.isLoading} // Disable input while loading
        />
      </div>

      <SubmitButton isLoading={formState.isLoading} />

      {formState.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Error: {formState.error}
        </p>
      )}
      {formState.success && formState.message && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          {formState.message}
        </p>
      )}
    </form>
  );
}
