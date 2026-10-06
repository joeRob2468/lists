import {
  isSimilarItemName,
  normalizeItemName,
  type ItemCategory,
  type ItemHistoryEntrySchema,
  type ShoppingItemSchema,
} from '@repo/common';
import { useMemo } from 'react';
import { z } from 'zod';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type ItemHistoryEntry = z.infer<typeof ItemHistoryEntrySchema>;

export interface ItemSuggestion {
  /** Set when the suggestion is already on this list. */
  item?: ShoppingItem;
  /** Last category from history, reused to skip the lookup. */
  category?: ItemCategory | null;
}

const MAX_SUGGESTIONS = 5;
const MIN_QUERY_LENGTH = 2;

/** Add-form suggestions keyed by name: matches on this list first, then from the user's history. */
export function useItemSuggestions(query: string, items: ShoppingItem[], history: ItemHistoryEntry[]) {
  return useMemo(() => {
    const suggestions = new Map<string, ItemSuggestion>();
    if (query.trim().length < MIN_QUERY_LENGTH) return suggestions;

    const onList = new Set(items.map((item) => normalizeItemName(item.name)));
    const listMatches = items
      .filter((item) => isSimilarItemName(query, item.name))
      .map((item) => [item.name, { item }] as const);
    const historyMatches = history
      .filter((entry) => !onList.has(normalizeItemName(entry.name)) && isSimilarItemName(query, entry.name))
      .map((entry) => [entry.name, { category: entry.category }] as const);

    for (const [name, suggestion] of [...listMatches, ...historyMatches].slice(0, MAX_SUGGESTIONS)) {
      suggestions.set(name, suggestion);
    }
    return suggestions;
  }, [query, items, history]);
}
