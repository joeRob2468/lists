import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { SEO } from '@/components/ui/seo/seo';
import { useUser } from '@/modules/auth/hooks/use-user';
import { Badge, Button, Container, Group, Skeleton, Stack, Text, Textarea, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { getItemCategoryRank } from '@repo/common';
import { IconArrowsSort, IconSparkles, IconTemplate, IconTrash, IconUsers } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingItemAddForm } from '../components/shopping-item-add-form/shopping-item-add-form';
import { ShoppingItemsList } from '../components/shopping-items-list/shopping-items-list';
import { ShoppingListActionsMenu } from '../components/shopping-list-actions-menu/shopping-list-actions-menu';
import { ShoppingListCreateModal } from '../components/shopping-list-create-modal/shopping-list-create-modal';
import { ShareListModal } from '../components/shopping-list-share-modal/shopping-list-share-modal';
import { useItemHistoryQuery } from '../hooks/use-item-history-query';
import { useShoppingList } from '../hooks/use-shopping-list';
import { useShoppingListMutations } from '../hooks/use-shopping-list-mutations';

export const ListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const {
    list,
    items,
    isLoading,
    error,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    mergeItem,
    reorderItems,
    updateList,
    isUpdateListPending,
  } = useShoppingList(listId);
  const { deleteList, isDeletePending } = useShoppingListMutations();
  const { history } = useItemHistoryQuery();

  const activeItems = items.filter((item) => !item.isChecked);
  const checkedItems = items.filter((item) => item.isChecked);
  const getDuplicateOf = (item: (typeof items)[number]) =>
    items.find((other) => other.id === item.possibleDuplicateOfId);

  // Stable sort keeps the user's manual order within each category.
  const sortByCategory = (group: typeof items) =>
    [...group].sort((a, b) => getItemCategoryRank(a.category) - getItemCategoryRank(b.category));

  const handleSortByCategory = () => {
    reorderItems([...sortByCategory(activeItems), ...sortByCategory(checkedItems)]);
  };

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

  const handleDelete = () => {
    if (!list) return;

    modals.openConfirmModal({
      title: `Confirm deletion`,
      children: (
        <Text size="sm">
          Are you sure you want to delete the "{list.name}" {list.isTemplate ? 'template' : 'list'}?
        </Text>
      ),
      confirmProps: { color: 'red', leftSection: <IconTrash size={18} /> },
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      onConfirm: () => {
        deleteList(list.id, {
          onSuccess: () => {
            notifications.show({
              title: 'Success',
              message: list.isTemplate ? 'Template deleted' : 'List deleted',
              color: 'green',
            });
            navigate('/dashboard');
          },
        });
      },
    });
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
          badges={
            <Group gap="xs">
              {list.isShared && (
                <Badge variant="light" leftSection={<IconUsers size={12} />}>
                  Shared
                </Badge>
              )}
              {list.isTemplate && (
                <Badge variant="light" leftSection={<IconTemplate size={12} />}>
                  Template
                </Badge>
              )}
              {list.autoCategorize && (
                <Badge variant="light" color="violet" leftSection={<IconSparkles size={12} />}>
                  Auto-categorize
                </Badge>
              )}
            </Group>
          }
          actions={
            <Group gap="xs">
              <Button
                variant="default"
                leftSection={<IconArrowsSort size={18} />}
                disabled={items.length < 2}
                onClick={handleSortByCategory}
              >
                Sort by category
              </Button>
              <ShoppingListActionsMenu
                isOwner={isOwner}
                isTemplate={list.isTemplate}
                autoCategorize={list.autoCategorize}
                isDeletePending={isDeletePending}
                onToggleAutoCategorize={() =>
                  updateList({ listId: list.id, data: { autoCategorize: !list.autoCategorize } })
                }
                onShare={() => setShareModalOpen(true)}
                onTemplate={() => setTemplateModalOpen(true)}
                onDelete={handleDelete}
              />
            </Group>
          }
        />

        <ShoppingItemsList
          items={activeItems}
          enableDrag={true}
          onToggle={toggleItem}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onMerge={mergeItem}
          getDuplicateOf={list.autoCategorize ? getDuplicateOf : undefined}
          onReorder={(newActiveItems) => {
            const newItems = [...newActiveItems, ...checkedItems];
            reorderItems(newItems);
          }}
        />
        <ShoppingItemAddForm
          onAdd={(values) => addItem(values)}
          items={items}
          history={history}
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
        mode={list.isTemplate ? 'use-template' : 'save-as-template'}
        templateId={list.id}
        initialName={list.isTemplate ? list.name : `${list.name} Template`}
      />
    </>
  );
};
