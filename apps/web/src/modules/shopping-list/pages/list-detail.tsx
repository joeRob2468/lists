import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { AddItemForm } from '../components/add-item-form/add-item-form';
import { ListItem } from '../components/list-item/list-item';
import { useShoppingList } from '../hooks/use-shopping-list';
import classes from './list-detail.module.css';

export const ListDetail = () => {
  const { listId } = useParams<{ listId: string }>();

  const { list, items, isLoading, error, addItem, toggleItem, deleteItem, reorderItems, isPending } =
    useShoppingList(listId);

  const activeItems = items.filter((item) => !item.isChecked);
  const checkedItems = items.filter((item) => item.isChecked);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !list) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex == destinationIndex) return;

    const newActiveItems = Array.from(activeItems);
    const [movedItem] = newActiveItems.splice(sourceIndex, 1);
    newActiveItems.splice(destinationIndex, 0, movedItem);

    const newFullList = [...newActiveItems, ...checkedItems];
    reorderItems(newFullList);
  };

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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="active-items-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {activeItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        item={item}
                        innerRef={provided.innerRef}
                        draggableProps={provided.draggableProps}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        onToggle={(itemId, isChecked) => toggleItem({ itemId, isChecked })}
                        onDelete={(itemId) => deleteItem(itemId)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <AddItemForm onAdd={(values) => addItem(values)} isLoading={isPending} />
      </div>

      {checkedItems.length > 0 && (
        <div className={classes.listGroup}>
          <Text className={classes.sectionTitle}>Completed</Text>
          <Stack gap={0}>
            {checkedItems.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onToggle={(itemId, isChecked) => toggleItem({ itemId, isChecked })}
                onDelete={(itemId) => deleteItem(itemId)}
                isPending={isPending}
              />
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
};
