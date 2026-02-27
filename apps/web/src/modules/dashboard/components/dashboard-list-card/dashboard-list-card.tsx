import { Card, Text, Group, Badge } from '@mantine/core';
import { IconCalendar, IconUsers } from '@tabler/icons-react';
import { ShoppingListSchema } from '@repo/common';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import classes from './dashboard-list-card.module.css';

// Infer the type directly from the schema
type ShoppingList = z.infer<typeof ShoppingListSchema>;

interface DashboardListCardProps {
  list: ShoppingList;
}

export const DashboardListCard = ({ list }: DashboardListCardProps) => {
  const navigate = useNavigate();

  // Format date: "Jan 14, 2:30 PM"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(list.updatedAt));

  return (
    <Card className={classes.card} padding="lg" radius="md" onClick={() => navigate(`/lists/${list.id}`)}>
      <Group justify="space-between" className={classes.titleGroup}>
        <Text fw={600} size="lg" truncate>
          {list.name}
        </Text>
        {list.isShared && (
          <Badge variant="light" color="blue" leftSection={<IconUsers size={12} />}>
            Shared
          </Badge>
        )}
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {/* Placeholder for description or item preview if added later */}
        Click to view items and start shopping.
      </Text>

      <Group justify="space-between" className={classes.meta}>
        <Group gap={6}>
          <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            Updated {formattedDate}
          </Text>
        </Group>
      </Group>
    </Card>
  );
};
