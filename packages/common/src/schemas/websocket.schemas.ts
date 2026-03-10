import { z } from 'zod';

export const WsClientMessageSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('join'), listId: z.uuid() }),
]);
export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;

export const WsServerEventSchema = z.discriminatedUnion('event', [z.object({ event: z.literal('list_updated') })]);
export type WsServerEvent = z.infer<typeof WsServerEventSchema>;
