import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ApiError, ApiErrorResponseSchema, User, UserSchema } from "@repo/common";
import z from "zod";

export const userModule: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/me',
    onRequest: [app.authenticate],
    schema: {
      tags: ['User'],
      summary: 'Get current user',
      response: {
        200: UserSchema,
        401: ApiErrorResponseSchema
      }
    }, 
    handler: async (req, res) => {
      const user = await app.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user.id)
      });

      if (!user) {
        res.clearCookie('session');
        throw new ApiError(401, "UNAUTHORIZED", "User not found");
      }

      return user;
    }
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get User',
      description: 'Returns a static user for demonstration',
      tags: ['User'],
      params: z.object({
        id: z.uuid()
      }),
      response: {
        200: UserSchema,
        400: ApiErrorResponseSchema,
        404: ApiErrorResponseSchema
      },
    },
    handler: async (req) => {
      const { id } = req.params;
      
      const user = await app.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id)
      });

      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', `User ${id} does not exist`);
      }

      return user;
    },
  });
};