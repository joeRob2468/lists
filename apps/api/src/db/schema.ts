import { User } from "@repo/common";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}) satisfies Record<keyof User, unknown>;

export const selectUserSchema = createSelectSchema(users);
export type DbUser = typeof users.$inferSelect;