import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { ShoppingListCard } from '@/modules/shopping-list/components/shopping-list-card/shopping-list-card';
import {
  ShoppingListCreateModal,
  type ShoppingListCreateModalMode,
} from '@/modules/shopping-list/components/shopping-list-create-modal/shopping-list-create-modal';
import { useShoppingListsQuery } from '@/modules/shopping-list/hooks/use-shopping-lists-query';
import { Button, Container, SimpleGrid, Skeleton, Text } from '@mantine/core';
import type { ShoppingListSchema } from '@repo/common';
import { IconCopy, IconPlus, IconTemplate } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ShoppingListCreateModalMode>('create-list');
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string } | undefined>(undefined);

  const { lists: listsOwned, isLoading: isLoadingOwned } = useShoppingListsQuery({
    isTemplate: false,
    limit: 6,
  });
  const { lists: listsShared, isLoading: isLoadingShared } = useShoppingListsQuery({
    isTemplate: false,
    sharedWithMe: true,
    limit: 6,
  });
  const { lists: templatesOwned, isLoading: isLoadingTemplatesOwned } = useShoppingListsQuery({
    isTemplate: true,
    limit: 6,
  });
  const { lists: templatesShared, isLoading: isLoadingTemplatesShared } = useShoppingListsQuery({
    isTemplate: true,
    sharedWithMe: true,
    limit: 6,
  });

  const handleUseTemplate = (template: z.infer<typeof ShoppingListSchema>) => {
    setSelectedTemplate(template);
    setModalMode('use-template');
    setModalOpen(true);
  };

  const handleCreateList = () => {
    setSelectedTemplate(undefined);
    setModalMode('create-list');
    setModalOpen(true);
  };

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
            <Button leftSection={<IconPlus size={18} />} onClick={handleCreateList}>
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
          <Button variant="outline" onClick={handleCreateList}>
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

      {isLoadingShared ? (
        <>
          <SectionHeader title="Shared Lists" mt="xl" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={160} radius="md" />
            ))}
          </SimpleGrid>
        </>
      ) : (
        listsShared &&
        listsShared.length > 0 && (
          <>
            <SectionHeader title="Shared Lists" mt="xl" />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {listsShared?.map((list) => (
                <ShoppingListCard key={list.id} list={list} />
              ))}
            </SimpleGrid>
          </>
        )
      )}

      {isLoadingTemplatesOwned ? (
        <>
          <SectionHeader title="My Templates" mt="xl" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={160} radius="md" />
            ))}
          </SimpleGrid>
        </>
      ) : (
        templatesOwned &&
        templatesOwned.length > 0 && (
          <>
            <SectionHeader title="My Templates" mt="xl" />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {templatesOwned?.map((template) => (
                <ShoppingListCard
                  key={template.id}
                  list={template}
                  footer={
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconCopy size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      Use Template
                    </Button>
                  }
                />
              ))}
            </SimpleGrid>
          </>
        )
      )}

      {isLoadingTemplatesShared ? (
        <>
          <SectionHeader title="Shared Templates" mt="xl" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={160} radius="md" />
            ))}
          </SimpleGrid>
        </>
      ) : (
        templatesShared &&
        templatesShared?.length > 0 && (
          <>
            <SectionHeader title="Shared Templates" mt="xl" />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {templatesShared?.map((template) => (
                <ShoppingListCard
                  key={template.id}
                  list={template}
                  footer={
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconCopy size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      Use Template
                    </Button>
                  }
                />
              ))}
            </SimpleGrid>
          </>
        )
      )}

      <ShoppingListCreateModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        templateId={selectedTemplate?.id}
        initialName={selectedTemplate?.name}
      />
    </Container>
  );
};
