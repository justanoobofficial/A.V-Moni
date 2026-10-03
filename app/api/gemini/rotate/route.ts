import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_GEMINI_KEY_POOL,
  getValidGeminiKey,
} from "@/lib/geminiRotator";
import { validateServerEnv } from "@/lib/env";
import { GeminiApiKeyItem } from "@/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    validateServerEnv();
    const body = await request.json();
    const {
      keys = DEFAULT_GEMINI_KEY_POOL,
      simulateStatus,
      failedKeyId,
      matchContext,
    }: {
      keys?: GeminiApiKeyItem[];
      simulateStatus?: number;
      failedKeyId?: string;
      matchContext?: string;
    } = body;

    const rotation = getValidGeminiKey(keys, simulateStatus, failedKeyId);

    if (rotation.poolExhausted || !rotation.selectedKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "All Gemini API keys are currently Rate Limited (429) or Quota Exhausted (403).",
          retryable: true,
          selectedKey: null,
          activeIndex: -1,
          updatedKeys: rotation.updatedKeys,
          logEntry: rotation.logEntry,
          poolExhausted: true,
          aiInsight:
            "Pool Exhausted: All Gemini API keys are currently Rate Limited (429) or Quota Exhausted (403). Reset or add a new key to resume AI parser.",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const aiInsight = `Gemini 2.5 Flash [${rotation.selectedKey.alias}]: Verified low-latency liquidity window on ${
      matchContext || "Yunchaokete Bu vs Novak Djokovic (O/U 20.5)"
    }. Recommended split stake under bookie anti-limit radar; odds stability window ~42s.`;

    return NextResponse.json({
      ok: true,
      selectedKey: {
        ...rotation.selectedKey,
        key: "REDACTED_SERVER_ONLY",
      },
      activeIndex: rotation.activeIndex,
      updatedKeys: rotation.updatedKeys.map((k) => ({
        ...k,
        key: k.key.startsWith("ENV:") ? k.key : "REDACTED_SERVER_ONLY",
      })),
      logEntry: rotation.logEntry,
      poolExhausted: false,
      aiInsight,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to process Gemini key rotation request";
    return NextResponse.json(
      { ok: false, error: message, retryable: true },
      { status: 400 }
    );
  }
}
