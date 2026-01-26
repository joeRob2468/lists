import { User } from "@repo/common";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}) satisfies Record<keyof User, unknown>;

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;