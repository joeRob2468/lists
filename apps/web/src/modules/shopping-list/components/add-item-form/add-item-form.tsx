import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput } from '@mantine/core';
import { CreateShoppingItemSchema } from '@repo/common';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import classes from './add-item-form.module.css';

type CreateItemFormValues = z.input<typeof CreateShoppingItemSchema>;

interface AddItemFormProps {
  onAdd: (values: CreateItemFormValues) => void;
  isLoading?: boolean;
}

export const AddItemForm = ({ onAdd, isLoading }: AddItemFormProps) => {
  const { register, handleSubmit, reset } = useForm<CreateItemFormValues>({
    resolver: zodResolver(CreateShoppingItemSchema),
    defaultValues: { name: '', quantity: 1, category: null },
  });

  const onSubmit = (data: CreateItemFormValues) => {
    if (!data.name.trim()) return;
    onAdd(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.container}>
      <div className={classes.iconWrapper}>
        <IconPlus size={20} />
      </div>
      <TextInput
        variant="unstyled"
        placeholder="Add a list item..."
        className={classes.input}
        {...register('name')}
        disabled={isLoading}
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }
        }}
      />
    </form>
  );
};
