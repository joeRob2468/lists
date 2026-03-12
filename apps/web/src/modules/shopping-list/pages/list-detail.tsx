import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { SEO } from '@/components/ui/seo/seo';
import { useUser } from '@/modules/auth/hooks/use-user';
import { Button, Container, Skeleton, Stack, Text } from '@mantine/core';
import { IconShare } from '@tabler/icons-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingItemAddForm } from '../components/shopping-item-add-form/shopping-item-add-form';
import { ShoppingItemsList } from '../components/shopping-items-list/shopping-items-list';
import { ShareListModal } from '../components/shopping-list-share-modal/shopping-list-share-modal';
import { useShoppingList } from '../hooks/use-shopping-list';

export const ListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useUser();

  const {
    list,
    items,
    isLoading,
    error,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    reorderItems,
    updateList,
    isPending,
    isUpdateListPending,
  } = useShoppingList(listId);

  const activeItems = items.filter((item) => !item.isChecked);
  const checkedItems = items.filter((item) => item.isChecked);

  const [shareModalOpen, setShareModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Container size="xl" py="md">
        <Skeleton height={125} mb="xl" />
        <Stack>
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </Stack>
      </Container>
    );
  }

  if (error || !list) {
    return (
      <Text c="red" ta="center" mt="xl">
        List not found or you do not have access.
      </Text>
    );
  }

  const isOwner = user?.id === list.ownerId;

  return (
    <>
      <SEO title={list.name} description={`Collaborate on the ${list.name} shopping list.`} />
      <Container size="xl" py="md">
        <PageHeader
          title={list.name}
          subtitle={
            isOwner
              ? 'Add, reorder, or remove items from your list.'
              : 'This is a shared list - you can add and check off items.'
          }
          actions={
            isOwner && (
              <Button leftSection={<IconShare size={18} />} onClick={() => setShareModalOpen(true)}>
                Share
              </Button>
            )
          }
        />

        <ShoppingItemsList
          items={activeItems}
          enableDrag={true}
          onToggle={toggleItem}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onReorder={(newActiveItems) => {
            const newItems = [...newActiveItems, ...checkedItems];
            reorderItems(newItems);
          }}
        />
        <ShoppingItemAddForm
          onAdd={(values) => addItem(values)}
          isLoading={isPending}
          hideTopBorder={activeItems.length > 0}
        />

        {checkedItems.length > 0 && (
          <>
            <SectionHeader title="completed" mt="xl" />
            <ShoppingItemsList
              items={checkedItems}
              enableDrag={false}
              onToggle={toggleItem}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          </>
        )}
      </Container>

      {isOwner && (
        <ShareListModal
          opened={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          listId={list.id}
          isShared={list.isShared}
          onToggleShare={(isShared) => updateList({ listId: list.id, data: { isShared } })}
          isLoading={isUpdateListPending}
        />
      )}
    </>
  );
};
