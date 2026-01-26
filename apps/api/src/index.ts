import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@repo/env';
import { ApiError, ApiErrorResponseSchema, User, UserSchema } from '@repo/common';
import drizzle from "@/plugins/drizzle";
import errorHandler from '@/plugins/error-handler';

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
    await app.register(drizzle);
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Shopping List',
          description: 'API documentation for the Shopping List project',
          version: '0.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.API_PORT}`,
            description: 'Local Development Server',
          },
        ],
      },
      transform: jsonSchemaTransform,
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
    });

    await app.register(errorHandler);

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

    await app.listen({ port: env.API_PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
void start();
