"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { createChallenge } from "@/app/actions"; // Adjust path if actions.ts is in app/

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? "Creating..." : "Create Challenge"}
    </button>
  );
}

export default function AdminChallengeForm() {
  // useFormState takes the action and an initial state
  // const [state, formAction] = useFormState(createChallenge, initialState);

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- don't do it
      action={createChallenge as any}
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
        />
      </div>

      <SubmitButton />
    </form>
  );
}
