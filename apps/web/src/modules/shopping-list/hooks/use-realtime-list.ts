import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@repo/env';
import { type WsClientMessage, WsServerEventSchema } from '@repo/common';

export const useRealtimeList = (listId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId) return;

    const wsUrl = (env.VITE_API_URL || 'http://localhost:3001').replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/lists/ws`);

    ws.onopen = () => {
      const message: WsClientMessage = { action: 'join', listId };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        const parsed = WsServerEventSchema.safeParse(rawData);

        if (parsed.success) {
          const data = parsed.data;
          if (data.event === 'list_updated') {
            queryClient.invalidateQueries({ queryKey: ['list', listId] });
          }
        }
      } catch (e) {
        console.error('WebSocket message parsing failed', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [listId, queryClient]);
};
