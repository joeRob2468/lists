import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { OAuth2Namespace } from '@fastify/oauth2';
import { JWT } from '@fastify/jwt';
import * as schema from '@/db/schema';
import type { WsServerEvent } from '@repo/common';
import type { WebSocket } from '@fastify/websocket';

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
    subscribeToList: (listId: string, socket: WebSocket) => void;
    unsubscribeFromList: (listId: string, socket: WebSocket) => void;
    broadcastToList: (listId: string, event: WsServerEvent['event']) => void;
  }
}
