import { defineConfig } from 'drizzle-kit';
import { env } from '@repo/env';

export default defineConfig({
  schema: '@/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL
  }
});