import { apiClient } from '@/api/client';
import type {
  CreateShoppingItemSchema,
  ShoppingItemSchema,
  ShoppingListWithItemsSchema,
  UpdateShoppingItemSchema,
  UpdateShoppingListSchema,
} from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

type ShoppingListWithItems = z.infer<typeof ShoppingListWithItemsSchema>;
type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type CreateItemInput = z.input<typeof CreateShoppingItemSchema>;
type UpdateItemInput = z.input<typeof UpdateShoppingItemSchema>;
type UpdateListInput = z.input<typeof UpdateShoppingListSchema>;

export const useShoppingList = (listId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['list', listId];
  const [optimisticItems, setOptimisticItems] = useState<ShoppingItem[] | null>(null);

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      return apiClient.get(`lists/${listId}`).json<ShoppingListWithItems>();
    },
    enabled: !!listId,
  });

  const addItemMutation = useMutation({
    mutationFn: async (values: CreateItemInput) => {
      return apiClient.post(`lists/${listId}/items`, { json: values }).json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [
            ...oldData.items,
            {
              id: crypto.randomUUID(),
              listId: listId!,
              name: newItem.name,
              quantity: newItem.quantity ?? 1,
              isChecked: false,
              position: 9999,
              category: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        };
      });

      return { previousList };
    },
    onError: (_err, _new, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      return apiClient.patch(`lists/${listId}/items/${itemId}`, {
        json: { isChecked },
      });
    },
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) => (item.id === itemId ? { ...item, isChecked } : item)),
        };
      });

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: UpdateItemInput }) => {
      return apiClient.patch(`lists/${listId}/items/${itemId}`, { json: data }).json();
    },
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
        };
      });

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiClient.delete(`lists/${listId}/items/${itemId}`, { json: {} }).json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.filter((item) => item.id !== itemId),
        };
      });

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (newItems: ShoppingItem[]) => {
      const itemIds = newItems.map((item) => item.id);
      return apiClient.patch(`lists/${listId}/items/reorder`, { json: { itemIds } }).json<ShoppingItem[]>();
    },
    onMutate: async (newItems) => {
      setOptimisticItems(newItems);
      await queryClient.cancelQueries({ queryKey });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: newItems,
        };
      });

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => {
      setOptimisticItems(null);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ listId, data }: { listId: string; data: UpdateListInput }) => {
      if (!listId) return;
      return apiClient.patch(`lists/${listId}`, { json: data }).json<ShoppingListWithItems>();
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousList = queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...newData };
      });

      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKey, context.previousList);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    list,
    items: optimisticItems ?? list?.items ?? [],
    isLoading,
    isPending: addItemMutation.isPending || toggleItemMutation.isPending || deleteItemMutation.isPending,
    error,
    addItem: addItemMutation.mutate,
    toggleItem: toggleItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    reorderItems: reorderMutation.mutate,
    updateList: updateListMutation.mutate,
    isUpdateListPending: updateListMutation.isPending,
  };
};
