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
import { User, UserSchema } from '@repo/common';

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
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

    app.route({
      method: 'GET',
      url: '/',
      schema: {
        summary: 'Get User',
        description: 'Returns a static user for demonstration',
        tags: ['User'],
        response: {
          200: UserSchema,
        },
      },
      handler: (req, res) => {
        const user: User = {
          id: '1',
          name: 'John Darksouls',
        };
        return user;
      },
    });

    await app.listen({ port: env.API_PORT });
    console.log(
      `Swagger docs available at http://localhost:${env.API_PORT}/docs`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
void start();
