import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, Badge, Group, Text } from '@mantine/core';
import {
  CreateShoppingItemSchema,
  ITEM_CATEGORY_COLORS,
  ITEM_CATEGORY_LABELS,
  type ItemHistoryEntrySchema,
  type ShoppingItemSchema,
} from '@repo/common';
import { IconPlus } from '@tabler/icons-react';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useItemSuggestions } from '../../hooks/use-item-suggestions';
import classes from './shopping-item-add-form.module.css';

type CreateItemFormValues = z.input<typeof CreateShoppingItemSchema>;
type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type ItemHistoryEntry = z.infer<typeof ItemHistoryEntrySchema>;

interface ShoppingItemAddFormProps {
  onAdd: (values: CreateItemFormValues) => void;
  items?: ShoppingItem[];
  history?: ItemHistoryEntry[];
  hideTopBorder?: boolean;
}

export const ShoppingItemAddForm = ({
  onAdd,
  items = [],
  history = [],
  hideTopBorder = false,
}: ShoppingItemAddFormProps) => {
  const { control, handleSubmit, reset } = useForm<CreateItemFormValues>({
    resolver: zodResolver(CreateShoppingItemSchema),
    defaultValues: { name: '', quantity: 1, category: null },
  });

  const query = useWatch({ control, name: 'name' });
  const suggestions = useItemSuggestions(query, items, history);

  const onSubmit = (data: CreateItemFormValues) => {
    if (!data.name.trim()) return;
    onAdd(data);
    reset();
  };

  // Mantine writes the chosen option into the input after `onOptionSubmit`; skip it so the field stays cleared.
  const skipNextChangeRef = useRef(false);

  const handleOptionSubmit = (name: string) => {
    skipNextChangeRef.current = true;
    onSubmit({ name, quantity: 1, category: suggestions.get(name)?.category ?? null });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`${classes.container} ${hideTopBorder ? classes.hideTopBorder : ''}`}
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Autocomplete
            {...field}
            onChange={(value) => {
              if (skipNextChangeRef.current) {
                skipNextChangeRef.current = false;
                return;
              }
              field.onChange(value);
            }}
            onOptionSubmit={handleOptionSubmit}
            variant="unstyled"
            placeholder="Add a list item..."
            className={classes.input}
            classNames={{
              input: classes.inputField,
              section: classes.inputIcon,
              dropdown: classes.dropdown,
              option: classes.option,
            }}
            // Icon inside the input so the input (and its dropdown) span the whole row.
            leftSection={<IconPlus size={20} />}
            leftSectionWidth={48}
            leftSectionPointerEvents="none"
            autoComplete="off"
            // Reversed so the best match sits closest to the input.
            data={[...suggestions.keys()].reverse()}
            // Always above the input so it stays visible over a mobile keyboard.
            comboboxProps={{
              width: 'target',
              position: 'top-start',
              offset: 1,
              middlewares: { flip: false },
            }}
            // Already fuzzy-filtered above.
            filter={({ options }) => options}
            renderOption={({ option }) => {
              const suggestion = suggestions.get(option.value);
              const item = suggestion?.item;
              const category = item ? item.category : suggestion?.category;
              return (
                <Group justify="space-between" wrap="nowrap" w="100%">
                  <Text size="sm">{option.value}</Text>
                  <Group gap={6} wrap="nowrap">
                    {category && (
                      <Badge variant="light" color={ITEM_CATEGORY_COLORS[category]} size="xs">
                        {ITEM_CATEGORY_LABELS[category]}
                      </Badge>
                    )}
                    {item && (item.isChecked || item.quantity > 1) && (
                      <Text size="xs" c="dimmed">
                        {item.isChecked ? 'completed' : `×${item.quantity}`}
                      </Text>
                    )}
                  </Group>
                </Group>
              );
            }}
          />
        )}
      />
    </form>
  );
};
