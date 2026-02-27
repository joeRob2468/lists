import { apiClient } from '@/api/client';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import type {
  CreateShoppingItemSchema,
  ShoppingItemSchema,
  ShoppingListWithItemsSchema,
} from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { AddItemForm } from '../components/add-item-form/add-item-form';
import { ListItem } from '../components/list-item/list-item';
import classes from './list-detail.module.css';

type ShoppingListWithItems = z.infer<typeof ShoppingListWithItemsSchema>;
type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type CreateItemInput = z.input<typeof CreateShoppingItemSchema>;
interface ReorderVariables {
  itemIds: string[];
  newItems: ShoppingItem[];
}

export const ListDetail = () => {
  const { listId: id } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const queryKey = ['list', id];
  const [optimisticItems, setOptimisticItems] = useState<ShoppingItem[] | null>(
    null,
  );

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      return apiClient.get(`lists/${id}`).json<ShoppingListWithItems>();
    },
    enabled: !!id,
  });

  const addItemMutation = useMutation({
    mutationFn: async (values: CreateItemInput) => {
      return apiClient.post(`lists/${id}/items`, { json: values }).json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList =
        queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [
            ...oldData.items,
            {
              id: crypto.randomUUID(),
              listId: id!,
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
    mutationFn: async ({
      itemId,
      isChecked,
    }: {
      itemId: string;
      isChecked: boolean;
    }) => {
      return apiClient.patch(`lists/${id}/items/${itemId}`, {
        json: { isChecked },
      });
    },
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList =
        queryClient.getQueryData<ShoppingListWithItems>(queryKey);

      queryClient.setQueryData<ShoppingListWithItems>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) =>
            item.id === itemId ? { ...item, isChecked } : item,
          ),
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
      return apiClient
        .delete(`lists/${id}/items/${itemId}`, { json: {} })
        .json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList =
        queryClient.getQueryData<ShoppingListWithItems>(queryKey);

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
    mutationFn: async ({ itemIds }: ReorderVariables) => {
      return apiClient
        .patch(`lists/${id}/items/reorder`, { json: { itemIds } })
        .json<ShoppingItem[]>();
    },
    onMutate: async ({ newItems }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousList =
        queryClient.getQueryData<ShoppingListWithItems>(queryKey);

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

  const items = optimisticItems ?? list?.items ?? [];
  const activeItems = items.filter((item) => !item.isChecked);
  const checkedItems = items.filter((item) => item.isChecked);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !list) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex == destinationIndex) return;

    const newActiveItems = Array.from(activeItems);
    const [movedItem] = newActiveItems.splice(sourceIndex, 1);
    newActiveItems.splice(destinationIndex, 0, movedItem);

    const newFullList = [...newActiveItems, ...checkedItems];

    setOptimisticItems(newFullList);
    reorderMutation.mutate({
      itemIds: newFullList.map((item) => item.id),
      newItems: newFullList,
    });
  };

  if (isLoading) {
    return (
      <div className={classes.container}>
        <Skeleton height={50} mb="xl" />
        <Skeleton height={40} mb="xl" />
        <Stack>
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </Stack>
      </div>
    );
  }

  if (error || !list) {
    return (
      <Text c="red" ta="center" mt="xl">
        List not found or you do not have access.
      </Text>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Group justify="space-between">
          <Title order={2}>{list.name}</Title>
          <Button variant="default" size="xs">
            Share
          </Button>
        </Group>
      </div>

      <div className={classes.listGroup}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="active-items-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {activeItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        item={item}
                        innerRef={provided.innerRef}
                        draggableProps={provided.draggableProps}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        onToggle={(itemId, isChecked) =>
                          toggleItemMutation.mutate({ itemId, isChecked })
                        }
                        onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <AddItemForm
          onAdd={(values) => addItemMutation.mutate(values)}
          isLoading={addItemMutation.isPending}
        />
      </div>

      {checkedItems.length > 0 && (
        <div className={classes.listGroup}>
          <Text className={classes.sectionTitle}>Completed</Text>
          <Stack gap={0}>
            {checkedItems.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onToggle={(itemId, isChecked) =>
                  toggleItemMutation.mutate({ itemId, isChecked })
                }
                onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                isPending={
                  toggleItemMutation.isPending || deleteItemMutation.isPending
                }
              />
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
};
