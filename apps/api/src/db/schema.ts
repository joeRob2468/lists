import { User } from '@repo/common';
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

// --- Users ---
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  picture: text('picture'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}) satisfies Record<keyof User, unknown>;

export const selectUserSchema = createSelectSchema(users);
export type DbUser = typeof users.$inferSelect;

// --- Shopping Lists ---
export const shoppingLists = pgTable('shopping_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  isTemplate: boolean('is_template').default(false).notNull(),
  isShared: boolean('is_shared').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const shoppingListsRelations = relations(
  shoppingLists,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [shoppingLists.ownerId],
      references: [users.id],
    }),
    items: many(shoppingItems),
  }),
);

// --- Shopping Items ---
export const shoppingItems = pgTable('shopping_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  listId: uuid('list_id')
    .references(() => shoppingLists.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  category: text('category'),
  quantity: integer('quantity').default(1).notNull(),
  isChecked: boolean('is_checked').default(false).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  list: one(shoppingLists, {
    fields: [shoppingItems.listId],
    references: [shoppingLists.id],
  }),
}));
