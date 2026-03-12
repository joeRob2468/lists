import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CreateShoppingListSchema } from '@repo/common';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useShoppingListMutations, type CreateListMode } from '../../hooks/use-shopping-list-mutations';
import classes from './shopping-list-create-modal.module.css';

const FormSchema = CreateShoppingListSchema.pick({
  name: true,
});
type FormValues = z.infer<typeof FormSchema>;

export type ShoppingListCreateModalMode = CreateListMode;

interface ShoppingListCreateModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: CreateListMode;
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
  const { createList, isCreatePending } = useShoppingListMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: initialName },
  });

  useEffect(() => {
    if (opened) setValue('name', initialName);
  }, [opened, initialName, setValue]);

  const onSubmit = (data: FormValues) => {
    createList(
      { name: data.name, mode, templateId },
      {
        onSuccess: (newList) => {
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
      },
    );
  };

  const getTitle = () => {
    switch (mode) {
      case 'create-template':
        return 'New Template';
      case 'use-template':
        return 'Create List from Template';
      case 'save-as-template':
        return 'Save as Template';
      default:
        return 'New List';
    }
  };

  const getButtonLabel = () => {
    if (isCreatePending) return 'Saving...';
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
          label="Name"
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
          <Button type="submit" loading={isSubmitting || isCreatePending}>
            {getButtonLabel()}
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
