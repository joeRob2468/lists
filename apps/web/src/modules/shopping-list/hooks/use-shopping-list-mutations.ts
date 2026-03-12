import { apiClient } from '@/api/client';
import type { ShoppingListSchema, ShoppingListWithItemsSchema } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

type ShoppingList = z.infer<typeof ShoppingListSchema>;
type ShoppingListWithItems = z.infer<typeof ShoppingListWithItemsSchema>;

export type CreateListMode = 'create-list' | 'create-template' | 'use-template' | 'save-as-template';

interface CreateListArgs {
  name: string;
  mode: CreateListMode;
  templateId?: string;
}

export function useShoppingListMutations() {
  const queryClient = useQueryClient();

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`lists/${id}`, { json: {} }).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async ({ name, mode, templateId }: CreateListArgs) => {
      if (mode === 'save-as-template') {
        if (!templateId) throw new Error('List ID missing');
        return apiClient
          .post('lists/save-as-template', {
            json: { listId: templateId, newName: name },
          })
          .json<ShoppingListWithItems>();
      }

      if (mode === 'use-template') {
        if (!templateId) throw new Error('Template ID missing');
        return apiClient
          .post('lists/from-template', {
            json: { templateId, newName: name },
          })
          .json<ShoppingListWithItems>();
      }

      return apiClient
        .post('lists', {
          json: {
            name,
            isTemplate: mode === 'create-template',
          },
        })
        .json<ShoppingList>();
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.setQueryData(['list', newList.id], newList);
    },
  });

  return {
    deleteList: deleteListMutation.mutate,
    isDeletePending: deleteListMutation.isPending,
    createList: createListMutation.mutate,
    isCreatePending: createListMutation.isPending,
  };
}
