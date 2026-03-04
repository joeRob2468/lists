import { Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { AddItemForm } from '../components/add-item-form/add-item-form';
import { ShoppingItemList } from '../components/shopping-item-list/shopping-item-list';
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
    <div className={classes.container}>
      <div className={classes.header}>
        <Group justify="space-between">
          <Title order={2}>{list.name}</Title>
          <Button variant="default" size="xs">
            Share
          </Button>
        </Group>
      </div>

      <div className={classes.listGroup}>
        <ShoppingItemList
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
        <AddItemForm onAdd={(values) => addItem(values)} isLoading={isPending} />
      </div>

      {checkedItems.length > 0 && (
        <div className={classes.listGroup}>
          <Text className={classes.sectionTitle}>Completed</Text>
          <ShoppingItemList
            items={checkedItems}
            enableDrag={false}
            onToggle={toggleItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        </div>
      )}
    </div>
  );
};
