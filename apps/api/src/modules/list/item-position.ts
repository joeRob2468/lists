import { shoppingItems } from '@/db/schema';
import { getItemCategoryRank, type ItemCategory } from '@repo/common';
import { and, eq, gte, ne, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

type Transaction = Parameters<Parameters<FastifyInstance['db']['transaction']>[0]>[0];

// After the last active item in its category, else before the first active item of a later category, else at the end.
export const getInsertPosition = (
  items: { position: number; isChecked: boolean; category: ItemCategory | null }[],
  category: ItemCategory | null,
) => {
  const end = Math.max(-1, ...items.map((item) => item.position)) + 1;
  if (!category) return end;

  const activeItems = items.filter((item) => !item.isChecked);
  const sameCategory = activeItems.filter((item) => item.category === category);
  if (sameCategory.length > 0) return Math.max(...sameCategory.map((item) => item.position)) + 1;

  const rank = getItemCategoryRank(category);
  const laterCategories = activeItems.filter((item) => getItemCategoryRank(item.category) > rank);
  if (laterCategories.length > 0) return Math.min(...laterCategories.map((item) => item.position));

  return end;
};

// Shifts items at or after `position` down by one to make room.
export const makeRoomAt = (tx: Transaction, listId: string, position: number, excludeId?: string) =>
  tx
    .update(shoppingItems)
    .set({ position: sql`${shoppingItems.position} + 1` })
    .where(
      and(
        eq(shoppingItems.listId, listId),
        gte(shoppingItems.position, position),
        excludeId ? ne(shoppingItems.id, excludeId) : undefined,
      ),
    );
