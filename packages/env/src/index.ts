import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Server-side env variables (api only)
    API_PORT: z.coerce.number().default(3001),
    APP_PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
    API_SECRET: z.string().min(1),
  },
  clientPrefix: 'VITE_',
  client: {
    // client side variables (web and api)
    VITE_API_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
