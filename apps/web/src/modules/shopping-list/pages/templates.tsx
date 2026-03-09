import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { Button, Container, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { ShoppingListSchema } from '@repo/common';
import { IconCopy, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { z } from 'zod';
import { ShoppingListCard } from '../components/shopping-list-card/shopping-list-card';
import {
  ShoppingListCreateModal,
  type ShoppingListCreateModalMode,
} from '../components/shopping-list-create-modal/shopping-list-create-modal';
import { useShoppingListsQuery } from '../hooks/use-shopping-lists-query';

export const Templates = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ShoppingListCreateModalMode>('create-template');
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string } | undefined>(undefined);

  const { lists: templates, isLoading, error } = useShoppingListsQuery({ isTemplate: true });

  const handleUseTemplate = (template: z.infer<typeof ShoppingListSchema>) => {
    setSelectedTemplate(template);
    setModalMode('use-template');
    setModalOpen(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(undefined);
    setModalMode('create-template');
    setModalOpen(true);
  };

  return (
    <Container size="xl" py="md">
      <PageHeader
        title="Templates"
        subtitle="Manage your reusable shopping lists."
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={handleCreateTemplate}>
            New Template
          </Button>
        }
      />

      <Stack>
        <SectionHeader title="Your Active Templates" />

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
          </SimpleGrid>
        ) : error ? (
          <Text c="red">Failed to load templates</Text>
        ) : templates?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text c="dimmed" mb="md">
              You don't have any active templates.
            </Text>
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Create your first template
            </Button>
          </div>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {templates?.map((template) => (
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
        )}
      </Stack>

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
