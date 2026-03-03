import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import type { ShoppingItemSchema } from '@repo/common';
import { z } from 'zod';
import { ListItem } from '../../components/list-item/list-item';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

interface BaseShoppingItemListProps {
  items: ShoppingItem[];
  onToggle: (data: { itemId: string; isChecked: boolean }) => void;
  onDelete: (itemId: string) => void;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

interface DraggableProps extends BaseShoppingItemListProps {
  enableDrag: true;
  droppableId?: string;
  onReorder: (items: ShoppingItem[]) => void;
}

interface StaticProps extends BaseShoppingItemListProps {
  enableDrag: false;
  droppableId?: never;
  onReorder?: never;
}

type ShoppingItemListProps = DraggableProps | StaticProps;

export const ShoppingItemList = ({
  items,
  droppableId,
  enableDrag = false,
  onToggle,
  onDelete,
  onReorder,
  renderHeader,
  renderFooter,
}: ShoppingItemListProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex == destinationIndex) return;

    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, movedItem);

    onReorder(newItems);
  };

  const renderList = () => (
    <>
      {items.map((item, index) =>
        enableDrag ? (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided, snapshot) => (
              <ListItem
                item={item}
                innerRef={provided.innerRef}
                draggableProps={provided.draggableProps}
                dragHandleProps={provided.dragHandleProps}
                isDragging={snapshot.isDragging}
                onToggle={(itemId, isChecked) => onToggle({ itemId, isChecked })}
                onDelete={(itemId) => onDelete(itemId)}
              />
            )}
          </Draggable>
        ) : (
          <ListItem
            key={item.id}
            item={item}
            onToggle={(itemId, isChecked) => onToggle({ itemId, isChecked })}
            onDelete={onDelete}
          />
        ),
      )}
    </>
  );

  return (
    <>
      {renderHeader?.()}

      {enableDrag ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={droppableId ?? 'droppable-items-list'}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {renderList()}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div>{renderList()}</div>
      )}

      {renderFooter?.()}
    </>
  );
};
