import { apiClient } from '@/api/client';
import { ShoppingListSchema } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

type ShoppingList = z.infer<typeof ShoppingListSchema>;

interface UseShoppingListsQueryOptions {
  isTemplate?: boolean;
  sharedWithMe?: boolean;
  limit?: number;
}

export function useShoppingListsQuery({ isTemplate, sharedWithMe, limit }: UseShoppingListsQueryOptions = {}) {
  const queryKey = ['lists', { isTemplate, sharedWithMe, limit }];

  const {
    data: lists,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (typeof isTemplate === 'boolean') searchParams.isTemplate = String(isTemplate);
      if (typeof sharedWithMe === 'boolean') searchParams.sharedWithMe = String(sharedWithMe);
      if (limit) searchParams.limit = String(limit);

      return apiClient.get('lists', { searchParams }).json<ShoppingList[]>();
    },
  });

  return {
    lists,
    isLoading,
    error,
  };
}
