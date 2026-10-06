import { ActionIcon, Badge, Group, Popover, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

interface ShoppingItemQuantityChipProps {
  quantity: number;
  onChange: (quantity: number) => void;
}

export const ShoppingItemQuantityChip = ({ quantity, onChange }: ShoppingItemQuantityChipProps) => {
  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Badge
          component="button"
          type="button"
          variant={quantity > 1 ? 'light' : 'transparent'}
          color="gray"
          c={quantity > 1 ? undefined : 'dimmed'}
          size="sm"
          // Fixed width keeps the category chips aligned.
          miw={36}
          tt="none"
          style={{ cursor: 'pointer' }}
          aria-label={`Quantity ${quantity}, change`}
        >
          ×{quantity}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown p={6}>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onChange(quantity - 1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <IconMinus size={16} />
          </ActionIcon>
          <Text size="sm" fw={500} miw={24} ta="center">
            {quantity}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onChange(quantity + 1)}
            aria-label="Increase quantity"
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
};
