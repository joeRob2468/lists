import { Badge, ColorSwatch, Menu } from '@mantine/core';
import { ITEM_CATEGORY_COLORS, ITEM_CATEGORY_LABELS, type ItemCategory, ItemCategorySchema } from '@repo/common';
import { IconCheck } from '@tabler/icons-react';

interface ShoppingItemCategoryChipProps {
  category: ItemCategory | null | undefined;
  onChange: (category: ItemCategory) => void;
}

export const ShoppingItemCategoryChip = ({ category, onChange }: ShoppingItemCategoryChipProps) => {
  // Uncategorized (null) shows as "Other" but stays null, so auto-categorize can still fill it in.
  const displayed = category ?? 'other';

  return (
    <Menu position="bottom-end" shadow="md" withinPortal>
      <Menu.Target>
        <Badge
          component="button"
          type="button"
          variant="light"
          color={ITEM_CATEGORY_COLORS[displayed]}
          size="sm"
          style={{ cursor: 'pointer' }}
          aria-label="Change category"
        >
          {ITEM_CATEGORY_LABELS[displayed]}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown mah={320} style={{ overflowY: 'auto' }}>
        {ItemCategorySchema.options.map((option) => (
          <Menu.Item
            key={option}
            onClick={() => onChange(option)}
            leftSection={<ColorSwatch color={`var(--mantine-color-${ITEM_CATEGORY_COLORS[option]}-6)`} size={10} />}
            rightSection={option === displayed ? <IconCheck size={14} /> : null}
          >
            {ITEM_CATEGORY_LABELS[option]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
