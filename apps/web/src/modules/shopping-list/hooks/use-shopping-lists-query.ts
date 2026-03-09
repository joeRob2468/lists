import { apiClient } from '@/api/client';
import { ShoppingListSchema } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

type ShoppingList = z.infer<typeof ShoppingListSchema>;

interface UseShoppingListsQueryOptions {
  isTemplate?: boolean;
}

export function useShoppingListsQuery({ isTemplate }: UseShoppingListsQueryOptions = {}) {
  const queryKey = ['lists', { isTemplate }];

  const {
    data: lists,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams: Record<string, string> = {};
      if (typeof isTemplate === 'boolean') {
        searchParams.isTemplate = String(isTemplate);
      }

      return apiClient.get('lists', { searchParams }).json<ShoppingList[]>();
    },
  });

  return {
    lists,
    isLoading,
    error,
  };
}
