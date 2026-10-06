import { shoppingItems, shoppingLists } from '@/db/schema';
import { INLINE_CATEGORY_TIMEOUT_MS } from '@/plugins/item-classifier';
import {
  ApiError,
  ApiErrorResponseSchema,
  CreateShoppingItemSchema,
  ItemHistoryEntrySchema,
  ReorderShoppingItemsSchema,
  ShoppingItemSchema,
  UpdateShoppingItemSchema,
  normalizeItemName,
} from '@repo/common';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { classifyItemInBackground } from './item-classification';
import { getInsertPosition, makeRoomAt } from './item-position';

const MAX_ITEM_HISTORY_ROWS = 2000;

export const itemModule: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/item-history',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      summary: "Distinct item names (with their last category) from the current user's own lists, newest first",
      response: {
        200: z.array(ItemHistoryEntrySchema),
      },
    },
    handler: async (req) => {
      const rows = await app.db
        .select({ name: shoppingItems.name, category: shoppingItems.category })
        .from(shoppingItems)
        .innerJoin(shoppingLists, eq(shoppingItems.listId, shoppingLists.id))
        .where(eq(shoppingLists.ownerId, req.user.id))
        .orderBy(desc(shoppingItems.updatedAt))
        .limit(MAX_ITEM_HISTORY_ROWS);

      const seen = new Set<string>();
      return rows.filter((row) => {
        const key = normalizeItemName(row.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/:id/items',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      params: z.object({ id: z.uuid() }),
      summary:
        'Add item. If an item with the same normalized name exists, it is un-completed or its quantity bumped instead.',
      body: CreateShoppingItemSchema,
      response: {
        200: ShoppingItemSchema,
        201: ShoppingItemSchema,
      },
    },
    handler: async (req, res) => {
      const list = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, req.params.id),
          or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true)),
        ),
      });

      if (!list) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      const existingItems = await app.db.query.shoppingItems.findMany({
        where: eq(shoppingItems.listId, list.id),
        columns: { id: true, name: true, isChecked: true, quantity: true, position: true, category: true },
      });

      const normalizedName = normalizeItemName(req.body.name);
      const duplicate = existingItems.find((item) => normalizeItemName(item.name) === normalizedName);

      if (duplicate) {
        // Completed duplicate comes back into its category spot; active duplicate gets its quantity bumped.
        const [updated] = await app.db.transaction(async (tx) => {
          if (!duplicate.isChecked) {
            return tx
              .update(shoppingItems)
              .set({ quantity: duplicate.quantity + req.body.quantity })
              .where(eq(shoppingItems.id, duplicate.id))
              .returning();
          }

          const otherItems = existingItems.filter((item) => item.id !== duplicate.id);
          const position = getInsertPosition(otherItems, duplicate.category);
          await makeRoomAt(tx, list.id, position, duplicate.id);
          return tx
            .update(shoppingItems)
            .set({ isChecked: false, quantity: req.body.quantity, position })
            .where(eq(shoppingItems.id, duplicate.id))
            .returning();
        });

        await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, list.id));

        app.broadcastToList(req.params.id, 'list_updated');
        res.status(200);
        return updated;
      }

      // Brief wait for the category (usually cached) so the item lands in its spot; lists without autoCategorize only
      // read the cache.
      const category =
        req.body.category ??
        (await app.categorizeItem({
          userId: req.user.id,
          name: req.body.name,
          timeoutMs: INLINE_CATEGORY_TIMEOUT_MS,
          cacheOnly: !list.autoCategorize,
        }));
      const position = getInsertPosition(existingItems, category);

      const [item] = await app.db.transaction(async (tx) => {
        await makeRoomAt(tx, list.id, position);
        return tx
          .insert(shoppingItems)
          .values({ ...req.body, category, listId: list.id, position })
          .returning();
      });

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, list.id));

      app.broadcastToList(req.params.id, 'list_updated');
      void classifyItemInBackground(app, item, req.user.id, { keepCategory: !!category });
      res.status(201);
      return item;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/:id/items/:itemId',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      params: z.object({ id: z.uuid(), itemId: z.uuid() }),
      body: UpdateShoppingItemSchema,
      response: {
        200: ShoppingItemSchema,
      },
    },
    handler: async (req) => {
      // Only re-classify when the normalized name actually changes.
      const previous = req.body.name
        ? await app.db.query.shoppingItems.findFirst({
            where: and(eq(shoppingItems.id, req.params.itemId), eq(shoppingItems.listId, req.params.id)),
            columns: { name: true },
          })
        : undefined;

      const [updated] = await app.db
        .update(shoppingItems)
        .set(req.body)
        .where(
          and(
            eq(shoppingItems.id, req.params.itemId),
            eq(shoppingItems.listId, req.params.id),
            inArray(
              shoppingItems.listId,
              app.db
                .select({ id: shoppingLists.id })
                .from(shoppingLists)
                .where(or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true))),
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new ApiError(404, 'NOT_FOUND', 'Item or List not found');
      }

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, req.params.id));

      app.broadcastToList(req.params.id, 'list_updated');
      if (previous && normalizeItemName(previous.name) !== normalizeItemName(updated.name)) {
        void classifyItemInBackground(app, updated, req.user.id, { keepCategory: req.body.category !== undefined });
      }
      return updated;
    },
  });

  app.route({
    method: 'POST',
    url: '/:id/items/:itemId/merge',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      summary: 'Merge an item into the item it was flagged as a possible duplicate of',
      params: z.object({ id: z.uuid(), itemId: z.uuid() }),
      response: {
        200: ShoppingItemSchema,
        404: ApiErrorResponseSchema,
      },
    },
    handler: async (req) => {
      const list = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, req.params.id),
          or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true)),
        ),
      });

      if (!list) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      const merged = await app.db.transaction(async (tx) => {
        const item = await tx.query.shoppingItems.findFirst({
          where: and(eq(shoppingItems.id, req.params.itemId), eq(shoppingItems.listId, list.id)),
        });
        if (!item?.possibleDuplicateOfId) return undefined;

        const target = await tx.query.shoppingItems.findFirst({
          where: and(eq(shoppingItems.id, item.possibleDuplicateOfId), eq(shoppingItems.listId, list.id)),
        });
        if (!target) return undefined;

        const [updatedTarget] = await tx
          .update(shoppingItems)
          .set(
            target.isChecked
              ? { isChecked: false, quantity: item.quantity, position: item.position }
              : { quantity: target.quantity + item.quantity },
          )
          .where(eq(shoppingItems.id, target.id))
          .returning();

        await tx.delete(shoppingItems).where(eq(shoppingItems.id, item.id));
        return updatedTarget;
      });

      if (!merged) {
        throw new ApiError(404, 'NOT_FOUND', 'Item or duplicate not found');
      }

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, list.id));

      app.broadcastToList(req.params.id, 'list_updated');
      return merged;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/:id/items/reorder',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      summary: 'Reorder items',
      params: z.object({ id: z.uuid() }),
      body: ReorderShoppingItemsSchema,
      response: {
        200: z.array(ShoppingItemSchema),
      },
    },
    handler: async (req) => {
      const { itemIds } = req.body;
      const listId = req.params.id;

      const list = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, listId),
          or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true)),
        ),
      });

      if (!list) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      await app.db.transaction(async (tx) => {
        await Promise.all(
          itemIds.map((itemId, index) =>
            tx
              .update(shoppingItems)
              .set({ position: index })
              .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.listId, listId))),
          ),
        );
      });

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, list.id));

      const updatedItems = await app.db.query.shoppingItems.findMany({
        where: eq(shoppingItems.listId, listId),
        orderBy: asc(shoppingItems.position),
      });

      app.broadcastToList(req.params.id, 'list_updated');
      return updatedItems;
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id/items/:itemId',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      params: z.object({ id: z.uuid(), itemId: z.uuid() }),
      response: {
        204: z.null(),
      },
    },
    handler: async (req, res) => {
      const result = await app.db
        .delete(shoppingItems)
        .where(
          and(
            eq(shoppingItems.id, req.params.itemId),
            eq(shoppingItems.listId, req.params.id),
            inArray(
              shoppingItems.listId,
              app.db
                .select({ id: shoppingLists.id })
                .from(shoppingLists)
                .where(or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true))),
            ),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new ApiError(404, 'NOT_FOUND', 'Item not found');
      }

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, req.params.id));

      app.broadcastToList(req.params.id, 'list_updated');
      res.status(204).send(null);
    },
  });
};
