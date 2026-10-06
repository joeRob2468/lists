import { z } from 'zod';

/**
 * Single source of truth for item categories. Array order is the "Sort by category" order; `description` is what the
 * classifier sees; `color` is a Mantine color (violet is reserved for AI indicators).
 *
 * Adding a category needs no migration. Renaming/removing a key needs a migration for items still using it. Any change
 * should clear `item_categories` (cached answers reflect the old set).
 */
export const ITEM_CATEGORIES = [
  {
    key: 'produce',
    label: 'Produce',
    color: 'green',
    description: 'fresh fruit, vegetables, fresh herbs, salad greens, mushrooms',
  },
  {
    key: 'bakery',
    label: 'Bakery',
    color: 'orange',
    description: 'bread, buns, bagels, tortillas, pita, croissants, pastries, cakes',
  },
  {
    key: 'meat_seafood',
    label: 'Meat & Seafood',
    color: 'red',
    description: 'raw meat, poultry, bacon, sausages, fish, shellfish',
  },
  {
    key: 'deli',
    label: 'Deli',
    color: 'pink',
    description: 'sliced deli meats, specialty cheeses, rotisserie chicken, prepared foods, fresh dips like hummus',
  },
  {
    key: 'dairy_eggs',
    label: 'Dairy & Eggs',
    color: 'blue',
    description: 'milk, plant-based milks, cheese, yogurt, butter, cream, sour cream, eggs',
  },
  {
    key: 'frozen',
    label: 'Frozen',
    color: 'cyan',
    description: 'frozen vegetables and fruit, frozen meals, frozen pizza, ice cream, ice',
  },
  {
    key: 'canned_dry_goods',
    label: 'Canned & Dry Goods',
    color: 'yellow',
    description: 'canned vegetables, beans, soup, tuna, coconut milk, broth, pasta, rice, grains, lentils, noodles',
  },
  {
    key: 'baking_spices',
    label: 'Baking & Spices',
    color: 'orange',
    description: 'flour, sugar, baking soda, yeast, vanilla, chocolate chips, salt, pepper, spices, dried herbs',
  },
  {
    key: 'condiments_sauces',
    label: 'Condiments & Sauces',
    color: 'red',
    description:
      'ketchup, mustard, mayo, hot sauce, soy sauce, pasta sauce, salad dressing, oils, vinegar, ' +
      'spreads like peanut butter, jam and honey',
  },
  {
    key: 'breakfast_cereal',
    label: 'Breakfast & Cereal',
    color: 'grape',
    description: 'cereal, oatmeal, granola, pancake mix, syrup, breakfast pastries',
  },
  {
    key: 'snacks',
    label: 'Snacks',
    color: 'lime',
    description: 'chips, crackers, cookies, candy, chocolate bars, nuts, popcorn, granola bars, jerky',
  },
  {
    key: 'beverages',
    label: 'Beverages',
    color: 'indigo',
    description: 'non-alcoholic drinks: water, sparkling water, soda, juice, coffee, tea, sports drinks, kombucha',
  },
  {
    key: 'alcohol',
    label: 'Alcohol',
    color: 'grape',
    description: 'beer, wine, spirits, hard seltzer, cider',
  },
  {
    key: 'household',
    label: 'Household',
    color: 'teal',
    description:
      'cleaning supplies, laundry detergent, dish soap, paper towels, toilet paper, trash bags, foil, food storage bags',
  },
  {
    key: 'home_general',
    label: 'Home & General',
    color: 'blue',
    description:
      'non-food general merchandise: kitchenware, batteries, light bulbs, stationery, school and office supplies, ' +
      'greeting cards',
  },
  {
    key: 'personal_care',
    label: 'Personal Care',
    color: 'pink',
    description: 'toiletries, shampoo, soap, toothpaste, floss, deodorant, razors, cosmetics, feminine care',
  },
  {
    key: 'health_pharmacy',
    label: 'Health & Pharmacy',
    color: 'green',
    description: 'medicine, pain relievers, allergy and cold remedies, vitamins, first aid, bandages, sunscreen',
  },
  {
    key: 'baby',
    label: 'Baby',
    color: 'yellow',
    description: 'diapers, baby wipes, infant formula, baby food',
  },
  {
    key: 'pet',
    label: 'Pet',
    color: 'orange',
    description: 'pet food, pet treats, cat litter, pet supplies',
  },
  {
    key: 'other',
    label: 'Other',
    color: 'gray',
    description: 'anything that does not fit the categories above',
  },
] as const satisfies readonly { key: string; label: string; color: string; description: string }[];

type ItemCategoryDefinition = (typeof ITEM_CATEGORIES)[number];

export const ItemCategorySchema = z.enum(
  ITEM_CATEGORIES.map((category) => category.key) as [
    ItemCategoryDefinition['key'],
    ...ItemCategoryDefinition['key'][],
  ],
);
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

const byKey = <T>(pick: (category: ItemCategoryDefinition) => T) =>
  Object.fromEntries(ITEM_CATEGORIES.map((category) => [category.key, pick(category)])) as Record<ItemCategory, T>;

export const ITEM_CATEGORY_LABELS = byKey((category) => category.label as string);
export const ITEM_CATEGORY_COLORS = byKey((category) => category.color as string);

/** Rank for sorting. Uncategorized items sort with "other". */
export const getItemCategoryRank = (category: string | null | undefined) => {
  const parsed = ItemCategorySchema.safeParse(category);
  return ItemCategorySchema.options.indexOf(parsed.success ? parsed.data : 'other');
};
