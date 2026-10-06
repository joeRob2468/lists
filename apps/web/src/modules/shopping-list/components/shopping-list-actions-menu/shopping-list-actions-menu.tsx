import { ActionIcon, Menu, Text } from '@mantine/core';
import { IconCheck, IconCopy, IconDots, IconShare, IconSparkles, IconTrash } from '@tabler/icons-react';

interface ShoppingListActionsMenuProps {
  isOwner: boolean;
  isTemplate: boolean;
  autoCategorize: boolean;
  isDeletePending?: boolean;
  onToggleAutoCategorize: () => void;
  onShare: () => void;
  onTemplate: () => void;
  onDelete: () => void;
}

export const ShoppingListActionsMenu = ({
  isOwner,
  isTemplate,
  autoCategorize,
  isDeletePending,
  onToggleAutoCategorize,
  onShare,
  onTemplate,
  onDelete,
}: ShoppingListActionsMenuProps) => {
  return (
    <Menu position="bottom-end" shadow="md" width={240}>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="More actions">
          <IconDots size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {isOwner && (
          <>
            <Menu.Label>Items</Menu.Label>
            <Menu.Item
              closeMenuOnClick={false}
              leftSection={<IconSparkles size={16} color="var(--mantine-color-violet-4)" />}
              rightSection={autoCategorize ? <IconCheck size={14} /> : null}
              aria-pressed={autoCategorize}
              onClick={onToggleAutoCategorize}
            >
              <div>
                Auto-categorize
                <Text size="xs" c="dimmed">
                  AI categories and duplicate hints
                </Text>
              </div>
            </Menu.Item>
          </>
        )}

        <Menu.Label>List</Menu.Label>
        {isOwner && (
          <Menu.Item leftSection={<IconShare size={16} />} onClick={onShare}>
            Share
          </Menu.Item>
        )}
        <Menu.Item leftSection={<IconCopy size={16} />} onClick={onTemplate}>
          {isTemplate ? 'Create list from template' : 'Save as template'}
        </Menu.Item>

        {isOwner && (
          <>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={16} />} disabled={isDeletePending} onClick={onDelete}>
              Delete {isTemplate ? 'template' : 'list'}
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};
