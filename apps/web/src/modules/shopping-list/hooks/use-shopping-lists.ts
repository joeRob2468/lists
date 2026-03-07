import { apiClient } from '@/api/client';
import { ShoppingListSchema } from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

type ShoppingList = z.infer<typeof ShoppingListSchema>;

interface UseShoppingListsOptions {
  isTemplate?: boolean;
}

export function useShoppingLists({ isTemplate }: UseShoppingListsOptions = {}) {
  const queryClient = useQueryClient();
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

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`lists/${id}`).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  return {
    lists,
    isLoading,
    error,
    deleteList: deleteListMutation.mutate,
    isPending: deleteListMutation.isPending,
  };
}
