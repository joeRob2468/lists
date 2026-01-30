import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { string, z } from 'zod';
import { env } from '@repo/env';
import { users } from '@/db/schema';
import { ApiError } from '@repo/common';

export const authModule: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/login/google',
    schema: {
      tags: ['OAuth2'],
      querystring: z.object({
        return_url: z.url().optional(),
      }),
    },
    handler: async (req, res) => {
      const redirectUrl = req.query.return_url || env.APP_URL;

      const url = new URL(redirectUrl);
      if (!env.ALLOWED_ORIGINS.includes(url.origin)) {
        throw new ApiError(400, 'INVALID_REDIRECT', 'Redirect URL not allowed');
      }

      // Store redirect URL in a cookie
      res.setCookie('return_url', redirectUrl, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
      });

      const authorizationUri = await app.google.generateAuthorizationUri(
        req,
        res,
      );

      return res.redirect(authorizationUri);
    },
  });

  app.route({
    method: 'GET',
    url: '/callback/google',
    schema: {
      tags: ['OAuth2'],
      querystring: z.looseObject({ state: z.string().optional() }),
    },
    handler: async (req, res) => {
      const { token } =
        await app.google.getAccessTokenFromAuthorizationCodeFlow(req);

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${token.access_token}` },
        },
      );
      const googleUser = (await userInfoResponse.json()) as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      const [user] = await app.db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          picture: googleUser.picture,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { googleId: googleUser.id, name: googleUser.name, picture: googleUser.picture },
        })
        .returning();

      const payload = { id: user.id, email: user.email };
      const jwtToken = app.jwt.sign(payload);

      res.setCookie('session', jwtToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Retrieve and clear the return_url cookie
      const returnUrl = req.cookies.return_url || env.APP_URL;
      res.clearCookie('return_url');

      return res.redirect(returnUrl);
    },
  });
};
