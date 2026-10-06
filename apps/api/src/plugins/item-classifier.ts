import { itemCategories } from '@/db/schema';
import type { ItemClassifierProvider } from '@/providers/item-classifier/item-classifier.provider';
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

  // In-memory daily cap per user; resets on restart, which is fine for a cost guard.
  let usageDay = '';
  const callsByUser = new Map<string, number>();

  const reserveCall = (userId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== usageDay) {
      usageDay = today;
      callsByUser.clear();
    }
    const calls = callsByUser.get(userId) ?? 0;
    if (calls >= MAX_CALLS_PER_USER_PER_DAY) {
      app.log.warn({ userId }, 'Daily item classification cap reached');
      return false;
    }
    callsByUser.set(userId, calls + 1);
    return true;
  };

  const callProvider = async <T>(userId: string, call: (provider: ItemClassifierProvider) => Promise<T>) => {
    if (!provider || !reserveCall(userId)) return null;
    try {
      return await call(provider);
    } catch (err) {
      app.log.error(err, 'Item classification request failed');
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

    const answer = await callProvider(userId, (p) => p.categorize(name, timeoutMs));
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
    const answer = await callProvider(userId, (p) =>
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
