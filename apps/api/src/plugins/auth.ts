import fp from 'fastify-plugin';
import oauth2 from '@fastify/oauth2';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from '@repo/env';
import { ApiError } from '@repo/common';

export default fp(async (app) => {
  await app.register(cookie);

  await app.register(jwt, {
    secret: env.AUTH_SECRET,
    cookie: {
      cookieName: 'session',
      signed: false,
    },
  });

  await app.register(oauth2, {
    name: 'google',
    credentials: {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    scope: ['profile', 'email'],
    callbackUri: `${env.VITE_API_URL}/auth/callback/google`,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // don't enforce secure cookies in local dev
      sameSite: 'lax',
    },
  });

  app.decorate('authenticate', async (req, _res) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated');
    }
  });
});
