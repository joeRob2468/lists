import { PageHeader } from '@/components/ui/page-header/page-header';
import { Box, Button, Container, SimpleGrid, Skeleton, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { ShoppingListCard } from '../components/shopping-list-card/shopping-list-card';
import { ShoppingListCreateModal } from '../components/shopping-list-create-modal/shopping-list-create-modal';
import { useShoppingListsQuery } from '../hooks/use-shopping-lists-query';
import { SectionHeader } from '@/components/ui/section-header/section-header';

export const Lists = () => {
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { lists: listsOwned, isLoading: isLoadingOwned } = useShoppingListsQuery({ isTemplate: false });
  const { lists: listsShared, isLoading: isLoadingShared } = useShoppingListsQuery({
    isTemplate: false,
    sharedWithMe: true,
  });

  const filteredListsOwned = listsOwned?.filter((list) => list.name.toLowerCase().includes(search.toLowerCase()));
  const filteredListsShared = listsShared?.filter((list) => list.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Container size="xl" py="md">
      <PageHeader
        title="Lists"
        subtitle="View and manage all your active shopping lists."
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
            New List
          </Button>
        }
      />

      <Box mb="lg">
        <TextInput
          placeholder="Search lists..."
          leftSection={<IconSearch size={16} />}
          maw={400}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Box>

      <SectionHeader title="My Lists" />
      {isLoadingOwned ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={160} radius="md" />
          ))}
        </SimpleGrid>
      ) : filteredListsOwned?.length === 0 ? (
        <Text c="dimmed" size="lg" mb="md">
          {search ? `No lists found matching "${search}"` : "You don't have any lists yet."}
        </Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {filteredListsOwned?.map((list) => (
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
      ) : filteredListsShared?.length === 0 ? (
        <Text c="dimmed" size="lg" mb="md">
          {search ? `No shared lists found matching "${search}"` : 'Nobody has shared any lists with you yet.'}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filteredListsShared?.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </SimpleGrid>
      )}

      <ShoppingListCreateModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} mode="create-list" />
    </Container>
  );
};
