import { GeminiApiKeyItem, GeminiKeyStatus, RotationLogEntry } from "@/types";
import { maskApiKey } from "@/lib/math";

export interface KeyRotationResult {
  selectedKey: GeminiApiKeyItem | null;
  activeIndex: number;
  updatedKeys: GeminiApiKeyItem[];
  logEntry?: RotationLogEntry;
  poolExhausted: boolean;
}

/**
 * Default seed pool for A.V Moni Gemini API Key Rotator.
 * Raw secret values are isolated server-side via GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3.
 */
export const DEFAULT_GEMINI_KEY_POOL: GeminiApiKeyItem[] = [
  {
    id: "gem-key-1",
    alias: "Primary Scraper Node #1 (Lagos-West)",
    key: "ENV:GEMINI_KEY_1",
    maskedKey: "AQ.Ab8...UX0w",
    status: "Active",
    priority: 1,
    lastUsed: "Just now",
    requestCount: 1428,
    errorCount: 0,
    latencyMs: 138,
  },
  {
    id: "gem-key-2",
    alias: "Secondary Odds Parser #2 (London-EU)",
    key: "ENV:GEMINI_KEY_2",
    maskedKey: "AQ.Ab8...DYBw",
    status: "Active",
    priority: 2,
    lastUsed: "2m ago",
    requestCount: 894,
    errorCount: 0,
    latencyMs: 154,
  },
  {
    id: "gem-key-3",
    alias: "Burst Arbitrage Worker #3 (Frankfurt)",
    key: "ENV:GEMINI_KEY_3",
    maskedKey: "AQ.Ab8..._gIQ",
    status: "Active",
    priority: 3,
    lastUsed: "5m ago",
    requestCount: 612,
    errorCount: 0,
    latencyMs: 162,
  },
];

/**
 * Resolves the actual raw Gemini API key on the server from environment variables
 * without exposing raw secrets in source code or client bundles.
 */
export function resolveServerRawKey(item: GeminiApiKeyItem): string {
  if (typeof window !== "undefined") {
    return item.maskedKey;
  }
  if (item.key === "ENV:GEMINI_KEY_1" || item.id === "gem-key-1") {
    return process.env.GEMINI_KEY_1?.trim() || "";
  }
  if (item.key === "ENV:GEMINI_KEY_2" || item.id === "gem-key-2") {
    return process.env.GEMINI_KEY_2?.trim() || "";
  }
  if (item.key === "ENV:GEMINI_KEY_3" || item.id === "gem-key-3") {
    return process.env.GEMINI_KEY_3?.trim() || "";
  }
  return item.key;
}

// Module-level pointer for round-robin / failover rotation across server calls
let currentRotationPointer = 0;

/**
 * Core Utility Function: `getValidGeminiKey`
 *
 * Selects a valid Active Gemini API key from the key pool and automatically rotates
 * to the next available key index upon encountering HTTP 429 (Rate Limit) or
 * HTTP 403 (Quota Exhausted / Forbidden) errors.
 */
export function getValidGeminiKey(
  keys: GeminiApiKeyItem[] = DEFAULT_GEMINI_KEY_POOL,
  errorStatus?: number,
  failedKeyId?: string
): KeyRotationResult {
  const clonedKeys: GeminiApiKeyItem[] = keys.map((k) => ({
    ...k,
    maskedKey: k.maskedKey || maskApiKey(k.key),
  }));

  clonedKeys.sort((a, b) => a.priority - b.priority);

  let logEntry: RotationLogEntry | undefined;
  const nowStr = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Step 1: If an HTTP 429 or 403 error occurred, mark the offending key and advance pointer
  if (errorStatus === 429 || errorStatus === 403) {
    const targetIdx = failedKeyId
      ? clonedKeys.findIndex((k) => k.id === failedKeyId)
      : currentRotationPointer % Math.max(1, clonedKeys.length);

    if (targetIdx !== -1 && clonedKeys[targetIdx]) {
      const failedKey = clonedKeys[targetIdx];
      const newStatus: GeminiKeyStatus =
        errorStatus === 429 ? "Rate Limited" : "Quota Exhausted";

      clonedKeys[targetIdx] = {
        ...failedKey,
        status: newStatus,
        errorCount: failedKey.errorCount + 1,
        lastUsed: nowStr,
      };

      currentRotationPointer = (targetIdx + 1) % clonedKeys.length;

      logEntry = {
        id: `rot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowStr,
        action: errorStatus === 429 ? "ROTATE_429" : "ROTATE_403",
        keyAlias: failedKey.alias,
        maskedKey: failedKey.maskedKey,
        statusCode: errorStatus,
        detail:
          errorStatus === 429
            ? `HTTP 429 Rate Limit hit on "${failedKey.alias}". Marked Rate Limited & rotated index -> #${currentRotationPointer + 1}.`
            : `HTTP 403 Quota Exhausted on "${failedKey.alias}". Marked Quota Exhausted & rotated index -> #${currentRotationPointer + 1}.`,
      };
    }
  }

  // Step 2: Scan circularly from currentRotationPointer to find the next "Active" key
  const total = clonedKeys.length;
  if (total === 0) {
    return {
      selectedKey: null,
      activeIndex: -1,
      updatedKeys: clonedKeys,
      logEntry,
      poolExhausted: true,
    };
  }

  for (let offset = 0; offset < total; offset++) {
    const candidateIndex = (currentRotationPointer + offset) % total;
    const candidate = clonedKeys[candidateIndex];

    if (candidate.status === "Active") {
      currentRotationPointer = candidateIndex;
      clonedKeys[candidateIndex] = {
        ...candidate,
        lastUsed: "Just now",
        requestCount: candidate.requestCount + 1,
      };

      if (!logEntry) {
        logEntry = {
          id: `rot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: nowStr,
          action: "SUCCESS",
          keyAlias: candidate.alias,
          maskedKey: candidate.maskedKey,
          statusCode: 200,
          detail: `Dispatched request via "${candidate.alias}" (${candidate.maskedKey}) [Priority #${candidate.priority}].`,
        };
      } else {
        logEntry.detail += ` Failover succeeded -> "${candidate.alias}" (${candidate.maskedKey}).`;
      }

      return {
        selectedKey: clonedKeys[candidateIndex],
        activeIndex: candidateIndex,
        updatedKeys: clonedKeys,
        logEntry,
        poolExhausted: false,
      };
    }
  }

  return {
    selectedKey: null,
    activeIndex: -1,
    updatedKeys: clonedKeys,
    logEntry:
      logEntry || {
        id: `rot-${Date.now()}`,
        timestamp: nowStr,
        action: "ROTATE_429",
        keyAlias: "Pool Exhausted",
        maskedKey: "N/A",
        statusCode: 503,
        detail:
          "All Gemini API keys in pool are currently Rate Limited or Quota Exhausted.",
      },
    poolExhausted: true,
  };
}

/**
 * Executes an async operation with automatic retry & key failover across the pool
 * when HTTP 429 or 403 errors are thrown.
 */
export async function executeWithGeminiRotation<T>(
  keys: GeminiApiKeyItem[],
  operation: (activeKey: GeminiApiKeyItem) => Promise<T>
): Promise<{
  result?: T;
  usedKey: GeminiApiKeyItem | null;
  updatedKeys: GeminiApiKeyItem[];
  logs: RotationLogEntry[];
}> {
  let workingKeys = [...keys];
  const logs: RotationLogEntry[] = [];
  let lastErrorStatus: number | undefined = undefined;
  let lastFailedKeyId: string | undefined = undefined;

  for (let attempt = 0; attempt < Math.max(1, workingKeys.length); attempt++) {
    const rotation = getValidGeminiKey(
      workingKeys,
      lastErrorStatus,
      lastFailedKeyId
    );
    workingKeys = rotation.updatedKeys;
    if (rotation.logEntry) {
      logs.push(rotation.logEntry);
    }

    if (!rotation.selectedKey || rotation.poolExhausted) {
      break;
    }

    try {
      const result = await operation(rotation.selectedKey);
      return {
        result,
        usedKey: rotation.selectedKey,
        updatedKeys: workingKeys,
        logs,
      };
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: number }).status)
          : 429;
      lastErrorStatus = status === 403 ? 403 : 429;
      lastFailedKeyId = rotation.selectedKey.id;
    }
  }

  return {
    usedKey: null,
    updatedKeys: workingKeys,
    logs,
  };
}
