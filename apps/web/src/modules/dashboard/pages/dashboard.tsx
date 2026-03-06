import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { ShoppingListCard } from '@/modules/shopping-list/components/shopping-list-card/shopping-list-card';
import { ShoppingListCreateModal } from '@/modules/shopping-list/components/shopping-list-create-modal/shopping-list-create-modal';
import { Button, Container, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { ShoppingListSchema } from '@repo/common';
import { IconPlus, IconTemplate } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

type ShoppingList = z.infer<typeof ShoppingListSchema>;

export const Dashboard = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

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

  return (
    <Container size="xl" py="md">
      <PageHeader
        title="Dashboard"
        subtitle="View your lists and create new ones."
        actions={
          <>
            <Button variant="light" leftSection={<IconTemplate size={18} />} onClick={() => navigate('/templates')}>
              Use Template
            </Button>
            <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
              New List
            </Button>
          </>
        }
      />

      <Stack>
        <SectionHeader title="Your Active Lists" />

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
              <ShoppingListCard key={list.id} list={list} />
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

      <ShoppingListCreateModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </Container>
  );
};
