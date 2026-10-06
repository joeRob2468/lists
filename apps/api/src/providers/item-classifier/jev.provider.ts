import { OpenRouter } from '@openrouter/sdk';
import type { DecisionsChoiceAnswer } from '@openrouter/sdk/models';
import { OpenRouterError } from '@openrouter/sdk/models/errors';
import { ITEM_CATEGORIES, type ItemCategory } from '@repo/common';
import { type ItemClassifierProvider, ItemClassifierUnavailableError } from './item-classifier.provider';

// Jev: classifier-only model via OpenRouter's Decisions API.
const MODEL = 'typesafe/jev-1.13';
// Invalid key, out of credits, forbidden.
const ACCOUNT_ERROR_STATUSES = [401, 402, 403];

const CATEGORY_INSTRUCTIONS = 'Which category does this list item belong to?';

const CATEGORY_CRITERIA = Object.fromEntries(
  ITEM_CATEGORIES.map((category) => [category.key, `${category.label}: ${category.description}`]),
) as Record<ItemCategory, string>;

const DUPLICATE_INSTRUCTIONS =
  'Is the new item the same thing as an item already on the list ' +
  '(a synonym, regional name, abbreviation, spelling variant or typo)? A different variety, version or ' +
  'related item (e.g. almond milk vs milk, phone charger vs phone) is NOT the same thing.';

const buildDuplicateCriteria = (candidateNames: string[]) => {
  const criteria: Record<string, string> = { none: 'Not the same thing as any item already on the list' };
  candidateNames.forEach((name, index) => (criteria[`item_${index}`] = `The same thing as "${name}"`));
  return criteria;
};

export const createJevProvider = ({
  apiKey,
  timeoutMs,
}: {
  apiKey: string;
  timeoutMs: number;
}): ItemClassifierProvider => {
  const openRouter = new OpenRouter({ apiKey, timeoutMs });

  const askChoice = async (
    name: string,
    instructions: string,
    criteria: Record<string, string>,
    requestTimeoutMs?: number,
  ) => {
    try {
      const { answers, usage } = await openRouter.alpha.decisions.create(
        {
          decisionsRequest: {
            model: MODEL,
            state: name,
            questions: { q: { type: 'choice', instructions, criteria } },
          },
        },
        { timeoutMs: requestTimeoutMs },
      );
      const answer = answers.q?.type === 'choice' ? (answers.q as DecisionsChoiceAnswer) : null;
      return { answer, usage };
    } catch (err) {
      if (err instanceof OpenRouterError && ACCOUNT_ERROR_STATUSES.includes(err.statusCode)) {
        throw new ItemClassifierUnavailableError(`OpenRouter ${err.statusCode}: ${err.message}`);
      }
      throw err;
    }
  };

  return {
    categorize: async (name, requestTimeoutMs) => {
      const { answer, usage } = await askChoice(name, CATEGORY_INSTRUCTIONS, CATEGORY_CRITERIA, requestTimeoutMs);
      return answer ? { choice: answer.choice, confidence: answer.confidence ?? 0, usage } : null;
    },
    findDuplicate: async (name, candidates) => {
      const { answer, usage } = await askChoice(name, DUPLICATE_INSTRUCTIONS, buildDuplicateCriteria(candidates));
      if (!answer) return null;
      const index = answer.choice.match(/^item_(\d+)$/)?.[1];
      return { index: index === undefined ? null : Number(index), confidence: answer.confidence ?? 0, usage };
    },
  };
};
