import { apiClient } from '@/api/client';
import { ItemHistoryEntrySchema } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

type ItemHistoryEntry = z.infer<typeof ItemHistoryEntrySchema>;

/** Item names from the user's own lists, for add-form autocomplete. */
export function useItemHistoryQuery() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['item-history'],
    queryFn: async () => {
      return apiClient.get('lists/item-history').json<ItemHistoryEntry[]>();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    history: history ?? [],
    isLoading,
  };
}
