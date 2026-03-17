import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Server-side env variables (api only)
    API_PORT: z.coerce.number().default(3001),
    APP_PORT: z.coerce.number().default(3000),
    APP_URL: z.url(),
    DATABASE_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    AUTH_SECRET: z.string().min(32),
    ALLOWED_ORIGINS: z.string().transform((s) => s.split(',')),
  },
  clientPrefix: 'VITE_',
  client: {
    // client side variables (web and api)
    VITE_API_URL: z.url(),
    VITE_UMAMI_URL: z.url().optional(),
    VITE_UMAMI_WEBSITE_ID: z.string().optional(),
  },
  runtimeEnv: {
    API_PORT: process.env.API_PORT,
    APP_PORT: process.env.APP_PORT,
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_UMAMI_URL: process.env.VITE_UMAMI_URL,
    VITE_UMAMI_WEBSITE_ID: process.env.VITE_UMAMI_WEBSITE_ID,
  },
  emptyStringAsUndefined: true,
});
