/**
 * Runtime Environment Validator & Server-Side Secret Guard (`lib/env.ts`)
 *
 * Ensures GEMINI_KEY_1, GEMINI_KEY_2, and GEMINI_KEY_3 are strictly isolated on
 * the server via environment variables and never exposed to client bundles or Git.
 */

export interface ServerEnvConfig {
  GEMINI_KEY_1: string;
  GEMINI_KEY_2: string;
  GEMINI_KEY_3: string;
  NODE_ENV: "development" | "production" | "test";
  NEXT_PUBLIC_APP_URL: string;
}

export function validateServerEnv(options?: { strict?: boolean }): ServerEnvConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Security Violation] validateServerEnv() must only be called on the server. Never expose GEMINI_KEY_* to client bundles."
    );
  }

  const key1 = process.env.GEMINI_KEY_1?.trim() || "";
  const key2 = process.env.GEMINI_KEY_2?.trim() || "";
  const key3 = process.env.GEMINI_KEY_3?.trim() || "";

  const missing: string[] = [];
  if (!key1) missing.push("GEMINI_KEY_1");
  if (!key2) missing.push("GEMINI_KEY_2");
  if (!key3) missing.push("GEMINI_KEY_3");

  if (options?.strict && process.env.NODE_ENV === "production" && missing.length > 0) {
    throw new Error(
      `[A.V Moni Startup Error] Missing required server environment variables in production: ${missing.join(
        ", "
      )}. Configure them in Vercel Project Settings -> Environment Variables.`
    );
  }

  const rawNodeEnv = process.env.NODE_ENV || "development";
  const nodeEnv =
    rawNodeEnv === "production" || rawNodeEnv === "test"
      ? rawNodeEnv
      : "development";

  return {
    GEMINI_KEY_1: key1,
    GEMINI_KEY_2: key2,
    GEMINI_KEY_3: key3,
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://av-moni.vercel.app",
  };
}

export function getServerGeminiKeysArray(): [string, string, string] {
  const env = validateServerEnv();
  return [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3];
}
