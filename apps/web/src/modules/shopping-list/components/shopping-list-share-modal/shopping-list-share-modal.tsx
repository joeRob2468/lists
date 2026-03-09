import { ActionIcon, CopyButton, Modal, Stack, Switch, Text, TextInput, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

interface ShareListModalProps {
  opened: boolean;
  onClose: () => void;
  listId: string;
  isShared: boolean;
  onToggleShare: (isShared: boolean) => void;
  isLoading?: boolean;
}

export function ShareListModal({ opened, onClose, listId, isShared, onToggleShare, isLoading }: ShareListModalProps) {
  const shareUrl = `${window.location.origin}/lists/${listId}`;

  return (
    <Modal opened={opened} onClose={onClose} title="Share List" centered>
      <Stack gap="md">
        <Switch
          label="Enable Link Sharing"
          description="Anyone with the link can view and edit this list."
          checked={isShared}
          onChange={(e) => onToggleShare(e.currentTarget.checked)}
          disabled={isLoading}
          size="md"
        />

        {isShared && (
          <div>
            <Text size="sm" fw={500} mb={4}>
              Copy Link
            </Text>
            <TextInput
              readOnly
              value={shareUrl}
              rightSection={
                <CopyButton value={shareUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                      <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              }
            />
          </div>
        )}
      </Stack>
    </Modal>
  );
}
