import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { ActionIcon, Badge, Checkbox, Group, Text } from '@mantine/core';
import type { ShoppingItemSchema } from '@repo/common';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import type z from 'zod';
import classes from './list-item.module.css';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

interface ListItemProps {
  item: ShoppingItem;
  onToggle: (id: string, isChecked: boolean) => void;
  onDelete: (id: string) => void;
  isPending?: boolean;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  innerRef?: React.Ref<HTMLDivElement>;
  isDragging?: boolean;
}

export const ListItem = ({
  item,
  onToggle,
  onDelete,
  isPending,
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging,
}: ListItemProps) => {
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
          <Text className={item.isChecked ? classes.strikethrough : undefined} fw={500}>
            {item.name}
          </Text>
          {item.quantity > 1 && (
            <Badge variant="light" color="gray" size="sm">
              x{item.quantity}
            </Badge>
          )}
        </Group>
      </div>

      <ActionIcon className={classes.deleteButton} variant="subtle" color="red" onClick={() => onDelete(item.id)} loading={isPending}>
        <IconTrash size={16} />
      </ActionIcon>
    </div>
  );
};
