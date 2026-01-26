import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import fp from 'fastify-plugin';
import { ApiError, ApiErrorResponseSchema, User, UserSchema } from "@repo/common";

export const userModule: FastifyPluginAsyncZod = fp(async (app) => {
  app.route({
    method: 'GET',
    url: '/user/:id',
    schema: {
      summary: 'Get User',
      description: 'Returns a static user for demonstration',
      tags: ['User'],
      response: {
        200: UserSchema,
        400: ApiErrorResponseSchema,
        404: ApiErrorResponseSchema
      },
    },
    handler: async function multi(req, res) {
      const { id } = req.params as { id: string };
      
      // const user = await app.db.query.users.findFirst({
      //   where: (users, { eq }) => eq(users.id, id)
      // });

      // if (!user) {
      //   throw new ApiError(404, 'USER_NOT_FOUND', `User ${id} does not exist`);
      // }

      const user: User = {
        id,
        name: "John Darksouls",
        email: "example@example.com",
        createdAt: new Date()
      }

      return user;
    },
  });
});