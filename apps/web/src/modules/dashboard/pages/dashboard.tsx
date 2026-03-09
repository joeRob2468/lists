import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { ShoppingListCard } from '@/modules/shopping-list/components/shopping-list-card/shopping-list-card';
import { ShoppingListCreateModal } from '@/modules/shopping-list/components/shopping-list-create-modal/shopping-list-create-modal';
import { useShoppingListsQuery } from '@/modules/shopping-list/hooks/use-shopping-lists-query';
import { Button, Container, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { IconPlus, IconTemplate } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { lists: listsOwned, isLoading: isLoadingOwned } = useShoppingListsQuery({ isTemplate: false });
  const { lists: listsShared, isLoading: isLoadingShared } = useShoppingListsQuery({
    isTemplate: false,
    sharedWithMe: true,
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

      <SectionHeader title="My Lists" />
      {isLoadingOwned ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={160} radius="md" />
          ))}
        </SimpleGrid>
      ) : listsOwned?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text c="dimmed" mb="md">
            You don't have any active shopping lists.
          </Text>
          <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
            Create your first list
          </Button>
        </div>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {listsOwned?.map((list) => (
              <ShoppingListCard key={list.id} list={list} />
            ))}
          </SimpleGrid>
        </>
      )}

      <SectionHeader title="Shared With Me" mt="xl" />
      {isLoadingShared ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={160} radius="md" />
          ))}
        </SimpleGrid>
      ) : listsShared?.length === 0 ? (
        <Text c="dimmed" size="lg" mb="md">
          {'Nobody has shared any lists with you yet.'}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {listsShared?.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </SimpleGrid>
      )}

      <ShoppingListCreateModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </Container>
  );
};
