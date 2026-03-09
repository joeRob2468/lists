import { ActionIcon, Badge, Card, Group, Menu, Text } from '@mantine/core';
import { ShoppingListSchema } from '@repo/common';
import { IconCalendar, IconDots, IconPencil, IconTrash, IconUsers, type ReactNode } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useShoppingListMutations } from '../../hooks/use-shopping-list-mutations';
import classes from './shopping-list-card.module.css';

// Infer the type directly from the schema
type ShoppingList = z.infer<typeof ShoppingListSchema>;

interface ShoppingListCardProps {
  list: ShoppingList;
  footer?: ReactNode;
  menuItems?: ReactNode;
  hideDefaultMenu?: boolean;
}

export const ShoppingListCard = ({ list, footer, menuItems, hideDefaultMenu = false }: ShoppingListCardProps) => {
  const navigate = useNavigate();
  const { deleteList } = useShoppingListMutations();

  // Format date: "Jan 14, 2:30 PM"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(list.updatedAt));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteList(list.id);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/lists/${list.id}`);
  };

  return (
    <Card
      className={classes.card}
      padding="lg"
      radius="md"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        navigate(`/lists/${list.id}`);
      }}
    >
      <Group justify="space-between" className={classes.titleGroup}>
        <Text className={classes.title} fw={600} size="lg" truncate>
          {list.name}
        </Text>

        <Group gap="xs">
          {list.isShared && (
            <Badge variant="light" color="blue" leftSection={<IconUsers size={12} />}>
              Shared
            </Badge>
          )}

          {(menuItems || !hideDefaultMenu) && (
            <Menu withinPortal position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {!hideDefaultMenu && (
                  <>
                    <Menu.Item leftSection={<IconPencil size={14} />} onClick={handleOpen}>
                      Edit
                    </Menu.Item>
                    <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={handleDelete}>
                      Delete
                    </Menu.Item>
                    {menuItems && <Menu.Divider />}
                  </>
                )}

                {menuItems}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {/* Placeholder for description or item preview if added later */}
        Click to view items.
      </Text>

      <Group justify="space-between" className={classes.meta}>
        <Group gap={6}>
          <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            Updated {formattedDate}
          </Text>
        </Group>
      </Group>

      {footer && <div className={classes.footer}>{footer}</div>}
    </Card>
  );
};
