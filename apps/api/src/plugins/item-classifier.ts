import { itemCategories } from '@/db/schema';
import {
  type ItemClassifierProvider,
  type ItemClassifierUsage,
  ItemClassifierUnavailableError,
} from '@/providers/item-classifier/item-classifier.provider';
import { createJevProvider } from '@/providers/item-classifier/jev.provider';
import { type ItemCategory, ItemCategorySchema, isLikelyTypo, normalizeItemName } from '@repo/common';
import { env } from '@repo/env';
import { eq } from 'drizzle-orm';
import fp from 'fastify-plugin';

const TIMEOUT_MS = 5000;
export const INLINE_CATEGORY_TIMEOUT_MS = 1000;

const MIN_CATEGORY_CONFIDENCE = 0.5;
const MIN_DUPLICATE_CONFIDENCE = 0.8;
const MAX_DUPLICATE_CANDIDATES = 20;
const MAX_CALLS_PER_USER_PER_DAY = 200;
const MAX_CALLS_PER_DAY = 2000;
// Pause after account-level failures (invalid key, out of credits) instead of retrying on every add.
const UNAVAILABLE_PAUSE_MS = 10 * 60 * 1000;

export interface CategorizeItemInput {
  userId: string;
  name: string;
  timeoutMs?: number;
  /** Lists without autoCategorize: read the cache only, never spend tokens. */
  cacheOnly?: boolean;
}

export interface ClassifyItemInput {
  userId: string;
  name: string;
  /** Known category; skips the lookup. */
  category?: ItemCategory | null;
  /** Other active items on the list, newest first. */
  candidates: { id: string; name: string; category: ItemCategory | null }[];
}

export interface ClassifyItemResult {
  category: ItemCategory | null;
  possibleDuplicateOfId: string | null;
}

export default fp(async (app) => {
  // Swap the classification backend here.
  const provider: ItemClassifierProvider | null = env.OPENROUTER_API_KEY
    ? createJevProvider({ apiKey: env.OPENROUTER_API_KEY, timeoutMs: TIMEOUT_MS })
    : null;

  if (!provider) {
    app.log.warn('OPENROUTER_API_KEY not set - item classification limited to cache and local typo checks');
  }

  // In-memory daily caps; reset on restart, which is fine for a cost guard.
  let usageDay = '';
  let callsToday = 0;
  const callsByUser = new Map<string, number>();
  let pausedUntil = 0;

  const reserveCall = (userId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== usageDay) {
      usageDay = today;
      callsToday = 0;
      callsByUser.clear();
    }
    const userCalls = callsByUser.get(userId) ?? 0;
    if (userCalls >= MAX_CALLS_PER_USER_PER_DAY || callsToday >= MAX_CALLS_PER_DAY) {
      app.log.warn({ userId, userCalls, callsToday }, 'Daily item classification cap reached');
      return false;
    }
    callsByUser.set(userId, userCalls + 1);
    callsToday += 1;
    return true;
  };

  const callProvider = async <T extends { usage?: ItemClassifierUsage } | null>(
    userId: string,
    kind: 'categorize' | 'duplicate',
    call: (provider: ItemClassifierProvider) => Promise<T>,
  ) => {
    if (!provider || Date.now() < pausedUntil || !reserveCall(userId)) return null;
    try {
      const result = await call(provider);
      if (result?.usage) {
        app.log.info({ userId, kind, ...result.usage }, 'Item classification usage');
      }
      return result;
    } catch (err) {
      if (err instanceof ItemClassifierUnavailableError) {
        pausedUntil = Date.now() + UNAVAILABLE_PAUSE_MS;
        app.log.error(err, 'Item classification unavailable, pausing calls');
      } else {
        app.log.error(err, 'Item classification request failed');
      }
      return null;
    }
  };

  const lookupCategory = async (userId: string, name: string, timeoutMs = TIMEOUT_MS, cacheOnly = false) => {
    const normalizedName = normalizeItemName(name);
    const cached = await app.db.query.itemCategories.findFirst({
      where: eq(itemCategories.normalizedName, normalizedName),
    });
    if (cached) return cached.category;
    if (cacheOnly) return null;

    const answer = await callProvider(userId, 'categorize', (p) => p.categorize(name, timeoutMs));
    if (!answer) return null;

    // Unsure answers are cached as "other" too, so a name is never asked twice.
    const parsed = ItemCategorySchema.safeParse(answer.choice);
    const category = parsed.success && answer.confidence >= MIN_CATEGORY_CONFIDENCE ? parsed.data : 'other';

    await app.db
      .insert(itemCategories)
      .values({ normalizedName, category, confidence: answer.confidence })
      .onConflictDoNothing();
    return category;
  };

  app.decorate('categorizeItem', ({ userId, name, timeoutMs, cacheOnly }: CategorizeItemInput) =>
    lookupCategory(userId, name, timeoutMs, cacheOnly),
  );

  app.decorate('classifyItem', async ({ userId, name, category: knownCategory, candidates }: ClassifyItemInput) => {
    const category = knownCategory ?? (await lookupCategory(userId, name));

    // Synonyms and typos share a category, so only same-category items are checked ("beer" is never a typo of "beef").
    const related = category ? candidates.filter((candidate) => candidate.category === category) : [];
    if (related.length === 0) return { category, possibleDuplicateOfId: null };

    const typo = related.find((candidate) => isLikelyTypo(name, candidate.name));
    if (typo) return { category, possibleDuplicateOfId: typo.id };

    const checked = related.slice(0, MAX_DUPLICATE_CANDIDATES);
    const answer = await callProvider(userId, 'duplicate', (p) =>
      p.findDuplicate(
        name,
        checked.map((candidate) => candidate.name),
      ),
    );
    const possibleDuplicateOfId =
      answer?.index != null && answer.confidence >= MIN_DUPLICATE_CONFIDENCE
        ? (checked[answer.index]?.id ?? null)
        : null;

    return { category, possibleDuplicateOfId };
  });
});
