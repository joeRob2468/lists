import { forwardRef } from 'react';
import { Avatar, Flex, Group, Menu, Text, UnstyledButton, type UnstyledButtonProps } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { IconChevronRight, IconLogout } from '@tabler/icons-react';
import { apiClient } from '@/api/client';
import { useUser } from '@/modules/auth/hooks/use-user';
import classes from './user-button.module.css';

interface UserButtonInnerProps
  extends UnstyledButtonProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof UnstyledButtonProps> {}

const UserButtonInner = forwardRef<HTMLButtonElement, UserButtonInnerProps>((props, ref) => {
  const { user } = useUser();

  return (
    <UnstyledButton ref={ref} className={classes.userButton} {...props}>
      <Group>
        <Avatar src={user?.picture} radius={'xl'} alt={user?.name}>
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Flex direction={'column'}>
          <Text size="sm" fw={500}>
            {user?.name}
          </Text>
          <Text size="xs">{user?.email}</Text>
        </Flex>

        <IconChevronRight size={'1.2rem'} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
});

export const UserButton = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await apiClient.post('auth/logout', { json: {} });
    queryClient.clear();
    navigate('/');
  };

  return (
    <Menu withArrow position="right-end" width={200}>
      <Menu.Target>
        <UserButtonInner />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item color="red" leftSection={<IconLogout />} onClick={handleLogout}>
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
