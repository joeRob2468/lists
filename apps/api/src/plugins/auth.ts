import fp from 'fastify-plugin';
import oauth2 from '@fastify/oauth2';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from '@repo/env';

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
    // startRedirectPath is REMOVED to allow custom handling in auth.routes.ts
    callbackUri: `${env.VITE_API_URL}/auth/callback/google`, 
  });

  app.decorate('authenticate', async (req, res) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      res.send(err);
    }
  });
});