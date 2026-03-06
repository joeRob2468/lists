import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import type { ShoppingItemSchema, UpdateShoppingItemSchema } from '@repo/common';
import { z } from 'zod';
import { ShoppingItemRow } from '../shopping-item-row/shopping-item-row';

type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
type UpdateItemInput = z.input<typeof UpdateShoppingItemSchema>;

interface BaseShoppingItemsListProps {
  items: ShoppingItem[];
  onToggle: (data: { itemId: string; isChecked: boolean }) => void;
  onUpdate: (data: { itemId: string; data: UpdateItemInput }) => void;
  onDelete: (itemId: string) => void;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

interface DraggableProps extends BaseShoppingItemsListProps {
  enableDrag: true;
  droppableId?: string;
  onReorder: (items: ShoppingItem[]) => void;
}

interface StaticProps extends BaseShoppingItemsListProps {
  enableDrag: false;
  droppableId?: never;
  onReorder?: never;
}

type ShoppingItemsListProps = DraggableProps | StaticProps;

export const ShoppingItemsList = ({
  items,
  droppableId,
  enableDrag = false,
  onToggle,
  onUpdate,
  onDelete,
  onReorder,
  renderHeader,
  renderFooter,
}: ShoppingItemsListProps) => {
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
              <ShoppingItemRow
                item={item}
                innerRef={provided.innerRef}
                draggableProps={provided.draggableProps}
                dragHandleProps={provided.dragHandleProps}
                isDragging={snapshot.isDragging}
                onToggle={(itemId, isChecked) => onToggle({ itemId, isChecked })}
                onUpdate={(itemId, data) => onUpdate({ itemId, data })}
                onDelete={(itemId) => onDelete(itemId)}
              />
            )}
          </Draggable>
        ) : (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={(itemId, isChecked) => onToggle({ itemId, isChecked })}
            onUpdate={(itemId, data) => onUpdate({ itemId, data })}
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
