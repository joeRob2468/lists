import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { ActionIcon, Button, Checkbox, Group, Text, TextInput } from '@mantine/core';
import type { ShoppingItemSchema, UpdateShoppingItemSchema } from '@repo/common';
import { IconGripVertical, IconSparkles, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type z from 'zod';
import { ShoppingItemCategoryChip } from '../shopping-item-category-chip/shopping-item-category-chip';
import { ShoppingItemQuantityChip } from '../shopping-item-quantity-chip/shopping-item-quantity-chip';
import classes from './shopping-item-row.module.css';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type UpdateItemInput = z.input<typeof UpdateShoppingItemSchema>;

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, isChecked: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: UpdateItemInput) => void;
  /** Item this one was flagged as a likely duplicate of. */
  duplicateOf?: ShoppingItem;
  onMerge?: (id: string) => void;
  isPending?: boolean;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  innerRef?: React.Ref<HTMLDivElement>;
  isDragging?: boolean;
}

export const ShoppingItemRow = ({
  item,
  onToggle,
  onDelete,
  onUpdate,
  duplicateOf,
  onMerge,
  isPending,
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging,
}: ShoppingItemRowProps) => {
  const [nameValue, setNameValue] = useState(item.name);

  useEffect(() => {
    // I'm aware that this causes a second render (one for prop change, one for state update),
    // but the performance impact is acceptable to me in this case.
    setNameValue(item.name); // eslint-disable-line
  }, [item.name]);

  const handleSubmit = () => {
    if (nameValue.trim().length === 0) {
      setNameValue(item.name);
    } else if (nameValue.trim() !== item.name) {
      onUpdate(item.id, { name: nameValue });
    }
  };

  return (
    <div
      className={`${classes.itemRow} ${item.isChecked ? classes.checked : ''} ${isDragging ? classes.isDragging : ''}`}
      ref={innerRef}
      {...draggableProps}
    >
      {dragHandleProps && (
        <div className={classes.dragHandle} {...dragHandleProps}>
          <IconGripVertical size={16} />
        </div>
      )}

      <Checkbox
        checked={item.isChecked}
        onChange={(e) => onToggle(item.id, e.currentTarget.checked)}
        disabled={isPending}
        radius="xl"
        size="md"
      />
      <div className={classes.content}>
        <TextInput
          variant="unstyled"
          value={nameValue}
          onChange={(e) => setNameValue(e.currentTarget.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className={`${classes.textInput} ${item.isChecked ? classes.strikethrough : undefined}`}
          fw={500}
        />
        {duplicateOf && !item.isChecked && (
          <Group gap={4} className={classes.duplicateHint}>
            <IconSparkles size={12} color="var(--mantine-color-violet-4)" />
            <Text size="xs" c="violet.3">
              Same as "{duplicateOf.name}"?
            </Text>
            {onMerge && (
              <Button size="compact-xs" variant="subtle" color="violet" onClick={() => onMerge(item.id)}>
                Merge
              </Button>
            )}
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={() => onUpdate(item.id, { possibleDuplicateOfId: null })}
            >
              Keep both
            </Button>
          </Group>
        )}
      </div>

      <Group gap={6} wrap="nowrap" className={classes.chips}>
        <ShoppingItemCategoryChip category={item.category} onChange={(category) => onUpdate(item.id, { category })} />
        <ShoppingItemQuantityChip quantity={item.quantity} onChange={(quantity) => onUpdate(item.id, { quantity })} />
      </Group>

      <ActionIcon
        className={classes.deleteButton}
        variant="subtle"
        color="red"
        onClick={() => onDelete(item.id)}
        loading={isPending}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </div>
  );
};
