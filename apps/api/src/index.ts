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
import drizzlePlugin from '@/plugins/drizzle';
import authPlugin from '@/plugins/auth';
import errorHandlerPlugin from '@/plugins/error-handler';
import corsPlugin from '@/plugins/cors';
import helmetPlugin from '@/plugins/helmet';
import { userModule } from '@/modules/user/user.routes';
import { authModule } from '@/modules/auth/auth.routes';
import { listModule } from '@/modules/list/list.routes';

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
    await app.register(drizzlePlugin);
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

    await app.register(errorHandlerPlugin);
    await app.register(corsPlugin);
    await app.register(helmetPlugin);
    await app.register(authPlugin);

    await app.register(authModule, { prefix: '/auth' });
    await app.register(userModule, { prefix: '/user' });
    await app.register(listModule, { prefix: '/lists' });

    await app.listen({ port: env.API_PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
void start();
