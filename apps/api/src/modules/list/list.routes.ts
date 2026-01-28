import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import {
  ApiError,
  ApiErrorResponseSchema,
  CreateShoppingItemSchema,
  CreateShoppingListFromTemplateSchema,
  CreateShoppingListSchema,
  ShoppingListWithItemsSchema,
  ShoppingListSchema,
  UpdateShoppingItemSchema,
  UpdateShoppingListSchema,
  ShoppingItemSchema,
  ReorderShoppingItemsSchema,
} from '@repo/common';
import { shoppingItems, shoppingLists } from '@/db/schema';

export const listModule: FastifyPluginAsyncZod = async (app) => {
  // --- List Endpoints ---

  app.route({
    method: 'GET',
    url: '/',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Get all lists for current user',
      querystring: z.object({
        isTemplate: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.array(ShoppingListSchema),
      },
    },
    handler: async (req) => {
      const filters = [eq(shoppingLists.ownerId, req.user.id)];

      if (typeof req.query.isTemplate === 'boolean') {
        filters.push(eq(shoppingLists.isTemplate, req.query.isTemplate));
      }

      const lists = await app.db.query.shoppingLists.findMany({
        where: and(...filters),
        orderBy: desc(shoppingLists.createdAt),
      });

      return lists;
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Get list by ID (with items)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: ShoppingListWithItemsSchema,
        404: ApiErrorResponseSchema,
        403: ApiErrorResponseSchema,
      },
    },
    handler: async (req) => {
      const list = await app.db.query.shoppingLists.findFirst({
        where: eq(shoppingLists.id, req.params.id),
        with: {
          items: {
            orderBy: asc(shoppingItems.position),
          },
        },
      });

      if (!list) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      if (list.ownerId !== req.user.id && !list.isShared) {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You do not have access to this list',
        );
      }

      return list;
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Create a new list',
      body: CreateShoppingListSchema,
      response: {
        201: ShoppingListSchema,
      },
    },
    handler: async (req, res) => {
      const [newList] = await app.db
        .insert(shoppingLists)
        .values({
          ...req.body,
          ownerId: req.user.id,
        })
        .returning();

      res.status(201);
      return newList;
    },
  });

  app.route({
    method: 'POST',
    url: '/from-template',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Create a new list from an existing template',
      body: CreateShoppingListFromTemplateSchema,
      response: {
        201: ShoppingListWithItemsSchema,
        404: ApiErrorResponseSchema,
      },
    },
    handler: async (req, res) => {
      const { templateId, newName } = req.body;

      const template = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, templateId),
          eq(shoppingLists.isTemplate, true),
        ),
        with: { items: true },
      });

      if (!template) {
        throw new ApiError(404, 'NOT_FOUND', 'Template not found');
      }

      const [newList] = await app.db
        .insert(shoppingLists)
        .values({
          name: newName || template.name,
          ownerId: req.user.id,
          isTemplate: false,
        })
        .returning();

      if (template.items.length > 0) {
        await app.db.insert(shoppingItems).values(
          template.items.map((item) => ({
            listId: newList.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            isChecked: false,
            position: item.position,
          })),
        );
      }

      const fullList = await app.db.query.shoppingLists.findFirst({
        where: eq(shoppingLists.id, newList.id),
        with: { items: { orderBy: asc(shoppingItems.position) } },
      });

      res.status(201);
      return fullList;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/:id',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      params: z.object({ id: z.string().uuid() }),
      body: UpdateShoppingListSchema,
      response: {
        200: ShoppingListSchema,
      },
    },
    handler: async (req) => {
      const [updated] = await app.db
        .update(shoppingLists)
        .set(req.body)
        .where(
          and(
            eq(shoppingLists.id, req.params.id),
            eq(shoppingLists.ownerId, req.user.id),
          ),
        )
        .returning();

      if (!updated) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }
      return updated;
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      params: z.object({ id: z.uuid() }),
      response: {
        204: z.null(),
      },
    },
    handler: async (req, res) => {
      const result = await app.db
        .delete(shoppingLists)
        .where(
          and(
            eq(shoppingLists.id, req.params.id),
            eq(shoppingLists.ownerId, req.user.id),
          ),
        )
        .returning({ id: shoppingLists.id });

      if (result.length === 0) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      res.status(204).send(null);
    },
  });

  // --- Item Endpoints ---

  app.route({
    method: 'POST',
    url: '/:id/items',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Items'],
      params: z.object({ id: z.uuid() }),
      body: CreateShoppingItemSchema,
      response: {
        201: ShoppingItemSchema,
      },
    },
    handler: async (req, res) => {
      const list = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, req.params.id),
          eq(shoppingLists.ownerId, req.user.id),
        ),
      });

      if (!list) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      const [maxPos] = await app.db
        .select({ pos: shoppingItems.position })
        .from(shoppingItems)
        .where(eq(shoppingItems.listId, list.id))
        .orderBy(desc(shoppingItems.position))
        .limit(1);

      const newPosition = (maxPos?.pos ?? -1) + 1;

      const [item] = await app.db
        .insert(shoppingItems)
        .values({
          ...req.body,
          listId: list.id,
          position: newPosition,
        })
        .returning();

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
                .where(eq(shoppingLists.ownerId, req.user.id)),
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new ApiError(404, 'NOT_FOUND', 'Item or List not found');
      }

      return updated;
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
    handler: async (req, res) => {
      const { itemIds } = req.body;
      const listId = req.params.id;

      const list = await app.db.query.shoppingLists.findFirst({
        where: and(
          eq(shoppingLists.id, listId),
          eq(shoppingLists.ownerId, req.user.id),
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
              .where(
                and(
                  eq(shoppingItems.id, itemId),
                  eq(shoppingItems.listId, listId),
                ),
              ),
          ),
        );
      });

      const updatedItems = await app.db.query.shoppingItems.findMany({
        where: eq(shoppingItems.listId, listId),
        orderBy: asc(shoppingItems.position),
      });

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
                .where(eq(shoppingLists.ownerId, req.user.id)),
            ),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new ApiError(404, 'NOT_FOUND', 'Item not found');
      }

      res.status(204).send(null);
    },
  });
};
