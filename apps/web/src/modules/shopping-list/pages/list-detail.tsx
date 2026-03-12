import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { SEO } from '@/components/ui/seo/seo';
import { useUser } from '@/modules/auth/hooks/use-user';
import { Button, Container, Group, Skeleton, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconCopy, IconShare } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingItemAddForm } from '../components/shopping-item-add-form/shopping-item-add-form';
import { ShoppingItemsList } from '../components/shopping-items-list/shopping-items-list';
import { ShoppingListCreateModal } from '../components/shopping-list-create-modal/shopping-list-create-modal';
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
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const [nameValue, setNameValue] = useState(list?.name);

  useEffect(() => {
    if (list && !isUpdateListPending) {
      // I'm aware that this causes a second render (one for prop change, one for state update),
      // but the performance impact is acceptable to me in this case.
      setNameValue(list.name); // eslint-disable-line
    }
  }, [list, isUpdateListPending]);

  const handleNameSubmit = () => {
    if (!list) return;
    const trimmed = nameValue ? nameValue.trim() : '';
    if (trimmed.length === 0) {
      setNameValue(list.name);
    } else if (trimmed !== list.name) {
      updateList({ listId: list.id, data: { name: trimmed } });
    }
  };

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

  const titleElement = isOwner ? (
    <Textarea
      variant="unstyled"
      value={nameValue}
      onChange={(e) => setNameValue(e.currentTarget.value)}
      onBlur={handleNameSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      autosize
      minRows={1}
      styles={{
        input: {
          fontSize: 'var(--mantine-h1-font-size)',
          fontWeight: 'var(--mantine-h1-font-weight)',
          lineHeight: 'var(--mantine-h1-line-height)',
          fontFamily: 'var(--mantine-font-family-headings)',
          height: 'auto',
          padding: 0,
          overflow: 'hidden',
          wordBreak: 'break-word',
        },
      }}
    />
  ) : (
    <Title order={1}>{list.name}</Title>
  );

  return (
    <>
      <SEO title={list.name} description={`Collaborate on the ${list.name} shopping list.`} />
      <Container size="xl" py="md">
        <PageHeader
          title={titleElement}
          subtitle={
            isOwner
              ? 'Add, reorder, or remove items from your list.'
              : 'This is a shared list - you can add and check off items.'
          }
          actions={
            <Group>
              <Button variant="default" leftSection={<IconCopy size={18} />} onClick={() => setTemplateModalOpen(true)}>
                {list.isTemplate ? 'Create List' : 'Save as Template'}
              </Button>
              {isOwner && (
                <Button leftSection={<IconShare size={18} />} onClick={() => setShareModalOpen(true)}>
                  Share
                </Button>
              )}
            </Group>
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

      <ShoppingListCreateModal
        opened={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        mode={list.isTemplate ? 'create-list' : 'save-as-template'}
        templateId={list.id}
        initialName={list.isTemplate ? list.name : `${list.name} Template`}
      />
    </>
  );
};
