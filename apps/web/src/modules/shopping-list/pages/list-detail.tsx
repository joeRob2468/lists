import { PageHeader } from '@/components/ui/page-header/page-header';
import { SectionHeader } from '@/components/ui/section-header/section-header';
import { Button, Container, Skeleton, Stack, Text } from '@mantine/core';
import { IconShare } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { ShoppingItemAddForm } from '../components/shopping-item-add-form/shopping-item-add-form';
import { ShoppingItemsList } from '../components/shopping-items-list/shopping-items-list';
import { useShoppingList } from '../hooks/use-shopping-list';
import classes from './list-detail.module.css';

export const ListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const { list, items, isLoading, error, addItem, toggleItem, updateItem, deleteItem, reorderItems, isPending } =
    useShoppingList(listId);

  const activeItems = items.filter((item) => !item.isChecked);
  const checkedItems = items.filter((item) => item.isChecked);

  if (isLoading) {
    return (
      <div className={classes.container}>
        <Skeleton height={50} mb="xl" />
        <Skeleton height={40} mb="xl" />
        <Stack>
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </Stack>
      </div>
    );
  }

  if (error || !list) {
    return (
      <Text c="red" ta="center" mt="xl">
        List not found or you do not have access.
      </Text>
    );
  }

  return (
    <Container size="xl" py="md">
      <PageHeader
        title={list.name}
        actions={
          <Button leftSection={<IconShare size={18} />} onClick={() => console.log('TODO: share modal')}>
            Share
          </Button>
        }
      />

      <div className={classes.listGroup}>
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
        <ShoppingItemAddForm onAdd={(values) => addItem(values)} isLoading={isPending} />
      </div>

      {checkedItems.length > 0 && (
        <div className={classes.listGroup}>
          <SectionHeader title="completed" />
          <ShoppingItemsList
            items={checkedItems}
            enableDrag={false}
            onToggle={toggleItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        </div>
      )}
    </Container>
  );
};
