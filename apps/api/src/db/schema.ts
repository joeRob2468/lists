import { ItemCategory, User } from '@repo/common';
import { relations } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
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
  autoCategorize: boolean('auto_categorize').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  owner: one(users, {
    fields: [shoppingLists.ownerId],
    references: [users.id],
  }),
  items: many(shoppingItems),
}));

// --- Shopping Items ---
export const shoppingItems = pgTable('shopping_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  listId: uuid('list_id')
    .references(() => shoppingLists.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  category: text('category').$type<ItemCategory>(),
  quantity: integer('quantity').default(1).notNull(),
  isChecked: boolean('is_checked').default(false).notNull(),
  position: integer('position').default(0).notNull(),
  // Set by the item classifier when this looks like a synonym/typo of another item on the list.
  possibleDuplicateOfId: uuid('possible_duplicate_of_id').references((): AnyPgColumn => shoppingItems.id, {
    onDelete: 'set null',
  }),
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

// --- Shared Shopping List Access History ---
export const sharedListAccess = pgTable(
  'shared_list_access',
  {
    userId: uuid('user_id').notNull(),
    listId: uuid('list_id')
      .notNull()
      .references(() => shoppingLists.id, { onDelete: 'cascade' }),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listId] })],
);

// --- Item Category Cache ---
// Global classifier cache keyed by normalized item name, so each name is classified once.
export const itemCategories = pgTable('item_categories', {
  normalizedName: text('normalized_name').primaryKey(),
  category: text('category').$type<ItemCategory>().notNull(),
  confidence: real('confidence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
