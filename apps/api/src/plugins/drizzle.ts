import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import { env } from '@repo/env';

export default fp(async (app) => {
  const queryClient = postgres(env.DATABASE_URL);
  const db = drizzle(queryClient, { schema });

  app.decorate('db', db);
  app.addHook('onClose', async () => {
    await queryClient.end();
  });
});
