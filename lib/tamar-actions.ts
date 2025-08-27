"use server";

import type { CallValueRequest, CallValueResponse } from "@/lib/duales";

export async function getTamarCallValueAction(
  request: CallValueRequest,
): Promise<CallValueResponse | { error: string }> {
  const apiKey = process.env.BACKEND_API_KEY;

  if (!apiKey) {
    console.error(
      "TAMAR API key (BACKEND_API_KEY) not configured on the server.",
    );
    return { error: "Server configuration error: API key missing." };
  }

  try {
    const response = await fetch(
      "https://tmalamud.pythonanywhere.com/api/tamar-calculation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(request),
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `API request failed: ${response.status} ${response.statusText}`,
        errorBody,
      );
      return {
        error: `API request failed: ${response.status} ${response.statusText}. ${errorBody}`,
      };
    }

    try {
      return await response.json();
    } catch (error) {
      console.error("Error parsing TAMAR JSON response:", error);
      if (error instanceof Error) {
        return { error: `Network or unexpected error: ${error.message}` };
      }
      return { error: "An unknown error occurred while fetching call value." };
    }
  } catch (error) {
    console.error("Error fetching call value in server action:", error);
    if (error instanceof Error) {
      return { error: `Network or unexpected error: ${error.message}` };
    }
    return { error: "An unknown error occurred while fetching call value." };
  }
}

export async function getTamarCallValueData(
  request: CallValueRequest,
): Promise<CallValueResponse | null> {
  const apiKey = process.env.BACKEND_API_KEY;

  if (!apiKey) {
    console.error(
      "TAMAR API key (BACKEND_API_KEY) not configured on the server.",
    );
    return null;
  }

  try {
    const response = await fetch(
      "https://tmalamud.pythonanywhere.com/api/tamar-calculation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(request),
        cache: "force-cache",
      },
    );

    if (!response.ok) {
      console.error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    try {
      return await response.json();
    } catch (error) {
      console.error("Error parsing TAMAR JSON response:", error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching call value data:", error);
    return null;
  }
}
