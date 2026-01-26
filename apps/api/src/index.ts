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

    await app.listen({ port: env.API_PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
void start();
