import { PageHeader } from '@/components/ui/page-header/page-header';
import { Box, Button, Container, SimpleGrid, Skeleton, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { ShoppingListCard } from '../components/shopping-list-card/shopping-list-card';
import { ShoppingListCreateModal } from '../components/shopping-list-create-modal/shopping-list-create-modal';
import { useShoppingListsQuery } from '../hooks/use-shopping-lists-query';

export const Lists = () => {
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { lists, isLoading, error } = useShoppingListsQuery({ isTemplate: false });

  const filteredLists = lists?.filter((list) => list.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Container size="xl" py="md">
      <PageHeader
        title="My Lists"
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

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={160} radius="md" />
          ))}
        </SimpleGrid>
      ) : error ? (
        <Text c="red">Failed to load lists.</Text>
      ) : filteredLists?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text c="dimmed" size="lg" mb="md">
            {search ? `No lists found matching "${search}"` : "You don't have any lists yet."}
          </Text>
          {!search && (
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
              Create your first list
            </Button>
          )}
        </div>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filteredLists?.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </SimpleGrid>
      )}

      <ShoppingListCreateModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} mode="create-list" />
    </Container>
  );
};
