import { Modal, Button, TextInput, Group } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateShoppingListSchema, ShoppingListSchema } from '@repo/common';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { notifications } from '@mantine/notifications';
import classes from './create-list-modal.module.css';
import { z } from 'zod';

type CreateListFormValues = z.input<typeof CreateShoppingListSchema>;

interface CreateListModalProps {
  opened: boolean;
  onClose: () => void;
}

export const CreateListModal = ({ opened, onClose }: CreateListModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateListFormValues>({
    resolver: zodResolver(CreateShoppingListSchema),
    defaultValues: {
      name: '',
      isTemplate: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateListFormValues) => {
      return apiClient
        .post('lists', { json: values })
        .json<z.infer<typeof ShoppingListSchema>>();
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });

      notifications.show({
        title: 'Success',
        message: 'List created successfully',
        color: 'green',
      });

      reset();
      onClose();
      navigate(`/lists/${newList.id}`);
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to create list',
        color: 'red',
      });
    },
  });

  const onSubmit = (data: CreateListFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New List" centered>
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <TextInput
          label="List Name"
          placeholder="e.g., Weekly Groceries, Costco Run"
          data-autofocus
          withAsterisk
          {...register('name')}
          error={errors.name?.message}
        />

        {/* Hidden field handling if we ever add a visible checkbox for isTemplate */}
        <input type="hidden" {...register('isTemplate')} />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Create List
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
