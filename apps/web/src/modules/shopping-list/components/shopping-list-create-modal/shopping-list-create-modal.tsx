import { apiClient } from '@/api/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CreateShoppingListSchema, ShoppingListSchema, ShoppingListWithItemsSchema } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import classes from './shopping-list-create-modal.module.css';

const FormSchema = CreateShoppingListSchema.pick({
  name: true,
});
type FormValues = z.infer<typeof FormSchema>;
export type ShoppingListCreateModalMode = 'create-list' | 'create-template' | 'use-template' | 'save-as-template';

interface ShoppingListCreateModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: ShoppingListCreateModalMode;
  templateId?: string;
  initialName?: string;
}

export const ShoppingListCreateModal = ({
  opened,
  onClose,
  mode = 'create-list',
  templateId,
  initialName = '',
}: ShoppingListCreateModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initialName,
    },
  });

  useEffect(() => {
    if (opened) {
      setValue('name', initialName);
    }
  }, [opened, initialName, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === 'save-as-template') {
        if (!templateId) throw new Error('Template ID missing');
        return apiClient
          .post('lists/save-as-template', {
            json: { listId: templateId, newName: values.name },
          })
          .json<z.infer<typeof ShoppingListWithItemsSchema>>();
      } else if (mode === 'use-template') {
        if (!templateId) throw new Error('Template ID missing');
        return apiClient
          .post('lists/from-template', {
            json: { templateId, newName: values.name },
          })
          .json<z.infer<typeof ShoppingListWithItemsSchema>>();
      } else {
        return apiClient
          .post('lists', {
            json: {
              name: values.name,
              isTemplate: mode === 'create-template',
            },
          })
          .json<z.infer<typeof ShoppingListSchema>>();
      }
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });

      notifications.show({
        title: 'Success',
        message: mode === 'create-template' || mode === 'save-as-template' ? 'Template created' : 'List created',
        color: 'green',
      });

      reset();
      onClose();
      navigate(`/lists/${newList.id}`);
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Operation failed',
        color: 'red',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create-template':
        return 'New Template';
      case 'use-template':
        return 'Create List';
      case 'save-as-template':
        return 'Create Template';
      default:
        return 'Create List';
    }
  };

  const getButtonLabel = () => {
    if (mutation.isPending) return 'Saving...';
    switch (mode) {
      case 'create-template':
        return 'Create Template';
      case 'use-template':
        return 'Create List';
      case 'save-as-template':
        return 'Save Template';
      default:
        return 'Create List';
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={getTitle()} centered>
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <TextInput
          label="List Name"
          placeholder="e.g., Weekly Groceries, Costco Run"
          data-autofocus
          withAsterisk
          {...register('name')}
          error={errors.name?.message}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {getButtonLabel()}
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
