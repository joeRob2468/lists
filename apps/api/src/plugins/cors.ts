import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '@repo/env';

export default fp(async (app) => {
  await app.register(cors, {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
});
