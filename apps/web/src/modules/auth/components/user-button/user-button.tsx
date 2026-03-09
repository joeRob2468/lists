import { apiClient } from '@/api/client';
import { useUser } from '@/modules/auth/hooks/use-user';
import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import classes from './user-button.module.css';

export const UserButton = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleLogout = async () => {
    await apiClient.post('auth/logout', { json: {} });
    queryClient.clear();
    navigate('/');
  };

  return (
    <Menu position="bottom-end" shadow="sm" width={200}>
      <Menu.Target>
        <UnstyledButton className={classes.userButton}>
          <Avatar src={user?.picture} alt={user?.name} radius="xl" size="md">
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <div className={classes.dropdown}>
          <Text size="sm" fw={500} truncate>
            {user?.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user?.email}
          </Text>
        </div>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
