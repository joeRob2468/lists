import ky from 'ky';
import { env } from '@repo/env';

export const apiClient = ky.create({
  prefixUrl: env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          // FUTURE IMPLEMENTATION: log out on 401, other global error handling
        }
      },
    ],
  },
});
