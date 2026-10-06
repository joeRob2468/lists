import { z } from 'zod';
import { ItemCategorySchema } from './item-category.schemas';

const ShoppingItemCore = z.object({
  id: z.uuid(),
  listId: z.uuid(),
  name: z.string().min(1),
  category: ItemCategorySchema.optional().nullable(),
  quantity: z.number().int().min(1),
  isChecked: z.boolean(),
  position: z.number().int(),
  possibleDuplicateOfId: z.uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ShoppingItemSchema = ShoppingItemCore.extend({
  quantity: ShoppingItemCore.shape.quantity.default(1),
  isChecked: ShoppingItemCore.shape.isChecked.default(false),
  position: ShoppingItemCore.shape.position.default(0),
  possibleDuplicateOfId: ShoppingItemCore.shape.possibleDuplicateOfId.default(null),
});

export const CreateShoppingItemSchema = ShoppingItemSchema.pick({
  name: true,
  category: true,
  quantity: true,
});

export const UpdateShoppingItemSchema = ShoppingItemCore.partial()
  .pick({
    name: true,
    category: true,
    quantity: true,
    isChecked: true,
    position: true,
  })
  .extend({
    // Clients may only dismiss a duplicate suggestion, never create one.
    possibleDuplicateOfId: z.null().optional(),
  });

/** A previously used item name from the user's own lists, for autocomplete. */
export const ItemHistoryEntrySchema = ShoppingItemCore.pick({ name: true, category: true });

export const ReorderShoppingItemsSchema = z.object({
  itemIds: z.array(z.uuid()).min(1),
});

const ShoppingListCore = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string().min(1),
  isTemplate: z.boolean(),
  isShared: z.boolean(),
  /** Enables AI categorization and duplicate hints. */
  autoCategorize: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ShoppingListSchema = ShoppingListCore.extend({
  isTemplate: ShoppingListCore.shape.isTemplate.default(false),
  isShared: ShoppingListCore.shape.isShared.default(false),
  autoCategorize: ShoppingListCore.shape.autoCategorize.default(true),
});

export const ShoppingListWithItemsSchema = ShoppingListSchema.extend({
  items: z.array(ShoppingItemSchema),
});

export const CreateShoppingListSchema = z.object({
  name: z.string().min(1),
  isTemplate: z.boolean().optional().default(false),
});

export const UpdateShoppingListSchema = ShoppingListCore.partial().pick({
  name: true,
  isShared: true,
  isTemplate: true,
  autoCategorize: true,
});

export const CreateShoppingListFromTemplateSchema = z.object({
  templateId: z.uuid(),
  newName: z.string().optional(),
});

export const SaveListAsTemplateSchema = z.object({
  listId: z.uuid(),
  newName: z.string().optional(),
});
