import { useState } from 'react';
import { Title, Text, Group, Button, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import { IconPlus, IconTemplate } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingListSchema } from '@repo/common';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { useUser } from '@/modules/auth/hooks/use-user';
import { CreateListModal } from '../components/create-list-modal/create-list-modal';
import { DashboardListCard } from '../components/dashboard-list-card/dashboard-list-card';
import classes from './dashboard.module.css';

type ShoppingList = z.infer<typeof ShoppingListSchema>;

export const Dashboard = () => {
  const { data: user } = useUser();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    data: lists,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lists', { isTemplate: false }],
    queryFn: async () => {
      return apiClient.get('lists', { searchParams: { isTemplate: false } }).json<ShoppingList[]>();
    },
  });

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning!' : hour < 18 ? 'Good afternoon!' : 'Good evening!';

  return (
    <div className={classes.container}>
      {/* Hero / Quick Actions */}
      <div className={classes.heroSection}>
        <Group justify="space-between" align="flex-end">
          <div>
            <Text size="lg" c="dimmed">
              {greeting},
            </Text>
            <Title order={1}>{user?.name || 'User'}</Title>
          </div>
          <Group>
            {/* Future: Template Selector Dropdown */}
            <Button
              variant="light"
              leftSection={<IconTemplate size={18} />}
              onClick={() => console.log('TODO: Implement template picker')}
            >
              Use Template
            </Button>
            <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
              New List
            </Button>
          </Group>
        </Group>
      </div>

      {/* Active Lists Grid */}
      <Stack>
        <Text className={classes.sectionTitle}>Your Active Lists</Text>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={160} radius="md" />
            ))}
          </SimpleGrid>
        ) : error ? (
          <Text c="red">Failed to load lists.</Text>
        ) : lists && lists.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {lists.map((list) => (
              <DashboardListCard key={list.id} list={list} />
            ))}
          </SimpleGrid>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text c="dimmed" mb="md">
              You don't have any active shopping lists.
            </Text>
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
              Create your first list
            </Button>
          </div>
        )}
      </Stack>

      <CreateListModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};
