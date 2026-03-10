import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';
import { WsServerEvent } from '@repo/common';
import fp from 'fastify-plugin';

export default fp(async (app) => {
  await app.register(fastifyWebsocket);

  const listRooms = new Map<string, Set<WebSocket>>();

  app.decorate('subscribeToList', (listId: string, socket: WebSocket) => {
    if (!listRooms.has(listId)) {
      listRooms.set(listId, new Set());
    }
    listRooms.get(listId)?.add(socket);
  });

  app.decorate('unsubscribeFromList', (listId: string, socket: WebSocket) => {
    const room = listRooms.get(listId);
    if (room) {
      room.delete(socket);
      if (room.size === 0) {
        listRooms.delete(listId);
      }
    }
  });

  app.decorate('broadcastToList', (listId: string, event: WsServerEvent['event']) => {
    const room = listRooms.get(listId);
    if (room) {
      for (const client of room) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ event }));
        }
      }
    }
  });
});
