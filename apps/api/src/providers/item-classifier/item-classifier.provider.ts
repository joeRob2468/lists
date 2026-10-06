// Contract for item classification backends. The item-classifier plugin handles caching, rate limits and thresholds;
// a provider only answers questions.
export interface ItemClassifierUsage {
  inputTokens: number;
  outputTokens: number;
  cost?: number;
}

export interface ItemClassifierProvider {
  /** `choice` should be an ItemCategory key; anything else is treated as "other". */
  categorize: (
    name: string,
    timeoutMs?: number,
  ) => Promise<{ choice: string; confidence: number; usage?: ItemClassifierUsage } | null>;
  /** Resolves to the index of the matching candidate, or null for no match. */
  findDuplicate: (
    name: string,
    candidates: string[],
  ) => Promise<{ index: number | null; confidence: number; usage?: ItemClassifierUsage } | null>;
}

/** Thrown for account-level failures (invalid key, out of credits); the plugin pauses calls instead of retrying. */
export class ItemClassifierUnavailableError extends Error {}
