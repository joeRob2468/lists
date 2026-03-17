import { sharedListAccess, shoppingItems, shoppingLists } from '@/db/schema';
import {
  ApiError,
  ApiErrorResponseSchema,
  CreateShoppingItemSchema,
  CreateShoppingListFromTemplateSchema,
  CreateShoppingListSchema,
  ReorderShoppingItemsSchema,
  ShoppingItemSchema,
  ShoppingListSchema,
  ShoppingListWithItemsSchema,
  UpdateShoppingItemSchema,
  UpdateShoppingListSchema,
  WsClientMessageSchema,
} from '@repo/common';
import { and, asc, desc, eq, inArray, ne, or } from 'drizzle-orm';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { SaveListAsTemplateSchema } from '../../../../../packages/common/src/schemas/shopping-list.schemas';

export const listModule: FastifyPluginAsyncZod = async (app) => {
  // --- List Endpoints ---

  app.route({
    method: 'GET',
    url: '/',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Get all lists for current user, or all shared lists previously accessed by current user',
      querystring: z.object({
        isTemplate: z
          .enum(['true', 'false'])
          .transform((value) => value === 'true')
          .optional(),
        sharedWithMe: z
          .enum(['true', 'false'])
          .transform((value) => value === 'true')
          .optional(),
        limit: z.coerce.number().min(1).max(50).optional(),
      }),
      response: {
        200: z.array(ShoppingListSchema),
      },
    },
    handler: async (req) => {
      const filters = [];
      const limit = req.query.limit;

      if (req.query.sharedWithMe) {
        filters.push(eq(shoppingLists.isShared, true));
        filters.push(ne(shoppingLists.ownerId, req.user.id));

        // subquery: listId must exist in current user access history
        const userAccessedLists = app.db
          .select({ listId: sharedListAccess.listId })
          .from(sharedListAccess)
          .where(eq(sharedListAccess.userId, req.user.id));
        filters.push(inArray(shoppingLists.id, userAccessedLists));
      } else {
        filters.push(eq(shoppingLists.ownerId, req.user.id));
      }

      if (typeof req.query.isTemplate === 'boolean') {
        filters.push(eq(shoppingLists.isTemplate, req.query.isTemplate));
      }

      const lists = await app.db.query.shoppingLists.findMany({
        where: and(...filters),
        orderBy: desc(shoppingLists.updatedAt),
        limit,
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
        throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this list');
      }

      // Update access history when guest retrieves list
      if (list.ownerId !== req.user.id) {
        await app.db
          .insert(sharedListAccess)
          .values({
            userId: req.user.id,
            listId: list.id,
            lastAccessedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [sharedListAccess.userId, sharedListAccess.listId],
            set: { lastAccessedAt: new Date() },
          });
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
        where: and(eq(shoppingLists.id, templateId), eq(shoppingLists.isTemplate, true)),
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
            isChecked: item.isChecked,
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
    method: 'POST',
    url: '/save-as-template',
    onRequest: [app.authenticate],
    schema: {
      tags: ['Lists'],
      summary: 'Save an existing list as a new reusable template',
      body: SaveListAsTemplateSchema,
      response: {
        201: ShoppingListWithItemsSchema,
        404: ApiErrorResponseSchema,
      },
    },
    handler: async (req, res) => {
      const { listId, newName } = req.body;

      const sourceList = await app.db.query.shoppingLists.findFirst({
        where: eq(shoppingLists.id, listId),
        with: { items: true },
      });

      if (!sourceList) {
        throw new ApiError(404, 'NOT_FOUND', 'Source list not found');
      }

      const [newTemplate] = await app.db
        .insert(shoppingLists)
        .values({
          name: newName || `${sourceList.name} Template`,
          ownerId: req.user.id,
          isTemplate: true,
        })
        .returning();

      if (sourceList.items.length > 0) {
        await app.db.insert(shoppingItems).values(
          sourceList.items.map((item) => ({
            listId: newTemplate.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            isChecked: item.isChecked,
            position: item.position,
          })),
        );
      }

      const fullTemplate = await app.db.query.shoppingLists.findFirst({
        where: eq(shoppingLists.id, newTemplate.id),
        with: { items: { orderBy: asc(shoppingItems.position) } },
      });

      res.status(201);
      return fullTemplate;
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
        .where(and(eq(shoppingLists.id, req.params.id), eq(shoppingLists.ownerId, req.user.id)))
        .returning();

      if (!updated) {
        throw new ApiError(404, 'NOT_FOUND', 'List not found');
      }

      app.broadcastToList(req.params.id, 'list_updated');
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
        .where(and(eq(shoppingLists.id, req.params.id), eq(shoppingLists.ownerId, req.user.id)))
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
          or(eq(shoppingLists.ownerId, req.user.id), eq(shoppingLists.isShared, true)),
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

      await app.db.update(shoppingLists).set({ updatedAt: new Date() }).where(eq(shoppingLists.id, list.id));

      app.broadcastToList(req.params.id, 'list_updated');
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

  // --- Websocket Endpoints ---

  app.route({
    method: 'GET',
    url: '/ws',
    schema: {
      tags: ['Realtime'],
      summary: 'WebSocket connection for live list updates',
      description: `
Establish a WebSocket connection to receive real-time updates for shopping lists. 
Since this is a WebSocket upgrade endpoint, you cannot test it directly via the Swagger UI "Try it out" button.

### Sending Messages (Client -> Server)
To listen for changes on a specific list, send a JSON string matching the \`WsClientMessage\` schema:
\`\`\`json
{
  "action": "join",
  "listId": "123e4567-e89b-12d3-a456-426614174000"
}
\`\`\`

### Receiving Messages (Server -> Client)
When someone modifies a list you are subscribed to, the server will emit a JSON string matching the \`WsServerEvent\` schema:
\`\`\`json
{
  "event": "list_updated"
}
\`\`\`
The client should respond to this event by triggering a background refetch of the list data.
        `,
    },
    wsHandler: (socket, _req) => {
      // const socket = connection.socket;
      let currentListId: string | null = null;

      socket.on('message', (message: string | Buffer) => {
        try {
          const rawData = JSON.parse(message.toString());
          const parsed = WsClientMessageSchema.safeParse(rawData);
          if (!parsed.success) return;

          const data = parsed.data;
          if (data.action === 'join') {
            if (currentListId) {
              app.unsubscribeFromList(currentListId, socket);
            }

            currentListId = data.listId;
            app.subscribeToList(currentListId, socket);
          }
        } catch {
          // ignore malformed JSON payloads.
        }
      });

      socket.on('close', () => {
        if (currentListId) {
          app.unsubscribeFromList(currentListId, socket);
        }
      });
    },
    handler: async (_req, res) => {
      return res.status(426).send('Upgrade Required');
    },
  });
};
