import { z } from 'zod';

export const ShoppingItemSchema = z.object({
  id: z.uuid(),
  listId: z.uuid(),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  isChecked: z.boolean().default(false),
  position: z.number().int().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateShoppingItemSchema = ShoppingItemSchema.pick({
  name: true,
  category: true,
  quantity: true,
});

export const UpdateShoppingItemSchema = ShoppingItemSchema.partial().pick({
  name: true,
  category: true,
  quantity: true,
  isChecked: true,
  position: true,
});

export const ReorderShoppingItemsSchema = z.object({
  itemIds: z.array(z.uuid()).min(1),
});

export const ShoppingListSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string().min(1),
  isTemplate: z.boolean().default(false),
  isShared: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ShoppingListWithItemsSchema = ShoppingListSchema.extend({
  items: z.array(ShoppingItemSchema),
});

export const CreateShoppingListSchema = z.object({
  name: z.string().min(1),
  isTemplate: z.boolean().optional().default(false),
});

export const UpdateShoppingListSchema = ShoppingListSchema.partial().pick({
  name: true,
  isShared: true,
  isTemplate: true,
});

export const CreateShoppingListFromTemplateSchema = z.object({
  templateId: z.uuid(),
  newName: z.string().optional(),
});
