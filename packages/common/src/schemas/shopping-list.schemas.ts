import { z } from 'zod';

const ShoppingItemCore = z.object({
  id: z.uuid(),
  listId: z.uuid(),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  isChecked: z.boolean(),
  position: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ShoppingItemSchema = ShoppingItemCore.extend({
  quantity: ShoppingItemCore.shape.quantity.default(1),
  isChecked: ShoppingItemCore.shape.isChecked.default(false),
  position: ShoppingItemCore.shape.position.default(0),
});

export const CreateShoppingItemSchema = ShoppingItemSchema.pick({
  name: true,
  category: true,
  quantity: true,
});

export const UpdateShoppingItemSchema = ShoppingItemCore.partial().pick({
  name: true,
  category: true,
  quantity: true,
  isChecked: true,
  position: true,
});

export const ReorderShoppingItemsSchema = z.object({
  itemIds: z.array(z.uuid()).min(1),
});

const ShoppingListCore = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string().min(1),
  isTemplate: z.boolean(),
  isShared: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ShoppingListSchema = ShoppingListCore.extend({
  isTemplate: ShoppingListCore.shape.isTemplate.default(false),
  isShared: ShoppingListCore.shape.isShared.default(false),
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
});

export const CreateShoppingListFromTemplateSchema = z.object({
  templateId: z.uuid(),
  newName: z.string().optional(),
});
