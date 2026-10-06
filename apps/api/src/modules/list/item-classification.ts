import { shoppingItems, shoppingLists } from '@/db/schema';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

// AI category + duplicate hint for lists with autoCategorize; runs after the response is sent.
export const classifyItemInBackground = async (
  app: FastifyInstance,
  item: typeof shoppingItems.$inferSelect,
  userId: string,
  { keepCategory }: { keepCategory: boolean },
) => {
  try {
    const list = await app.db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, item.listId),
      columns: { autoCategorize: true },
    });
    if (!list?.autoCategorize) return;

    const candidates = await app.db.query.shoppingItems.findMany({
      where: and(
        eq(shoppingItems.listId, item.listId),
        eq(shoppingItems.isChecked, false),
        ne(shoppingItems.id, item.id),
      ),
      columns: { id: true, name: true, category: true },
      orderBy: desc(shoppingItems.createdAt),
    });

    const result = await app.classifyItem({
      userId,
      name: item.name,
      category: keepCategory ? item.category : null,
      candidates,
    });
    if (result.category === item.category && result.possibleDuplicateOfId === item.possibleDuplicateOfId) return;

    const [updated] = await app.db
      .update(shoppingItems)
      .set({
        category: result.category,
        possibleDuplicateOfId: result.possibleDuplicateOfId,
      })
      // Skip stale results if the item was renamed meanwhile.
      .where(and(eq(shoppingItems.id, item.id), eq(shoppingItems.name, item.name)))
      .returning({ id: shoppingItems.id });

    if (updated) {
      app.broadcastToList(item.listId, 'list_updated');
    }
  } catch (err) {
    app.log.error(err, 'Background item classification failed');
  }
};

// Backfill when autoCategorize is turned on. Only uncategorized items; nothing is moved.
export const categorizeExistingItemsInBackground = async (app: FastifyInstance, listId: string, userId: string) => {
  try {
    const uncategorized = await app.db.query.shoppingItems.findMany({
      where: and(eq(shoppingItems.listId, listId), isNull(shoppingItems.category)),
      columns: { id: true, name: true },
    });

    let changed = 0;
    for (const item of uncategorized) {
      const category = await app.categorizeItem({ userId, name: item.name });
      if (!category) continue;

      // Skip items categorized by hand meanwhile.
      const updated = await app.db
        .update(shoppingItems)
        .set({ category })
        .where(and(eq(shoppingItems.id, item.id), isNull(shoppingItems.category)))
        .returning({ id: shoppingItems.id });
      changed += updated.length;
    }

    if (changed > 0) {
      app.broadcastToList(listId, 'list_updated');
    }
  } catch (err) {
    app.log.error(err, 'Background categorization of existing items failed');
  }
};
