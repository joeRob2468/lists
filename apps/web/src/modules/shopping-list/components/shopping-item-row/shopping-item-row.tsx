import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { ActionIcon, Badge, Checkbox, Group, TextInput } from '@mantine/core';
import type { ShoppingItemSchema, UpdateShoppingItemSchema } from '@repo/common';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type z from 'zod';
import classes from './shopping-item-row.module.css';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type UpdateItemInput = z.input<typeof UpdateShoppingItemSchema>;

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, isChecked: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: UpdateItemInput) => void;
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
        <Group gap="xs">
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
          {item.quantity > 1 && (
            <Badge variant="light" color="gray" size="sm">
              x{item.quantity}
            </Badge>
          )}
        </Group>
      </div>

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
