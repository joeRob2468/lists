import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { OAuth2Namespace } from '@fastify/oauth2';
import { JWT } from '@fastify/jwt';
import * as schema from '@/db/schema';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>;
    google: OAuth2Namespace;
    jwt: JWT;
    authenticate: (req: FastifyRequest, res: FastifyReply) => Promise<void>;
  }
}
