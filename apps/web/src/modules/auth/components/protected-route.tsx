import { Center, Loader } from '@mantine/core';
import { useUser } from '../hooks/use-user';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { data: user, isLoading, isError } = useUser();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (isError || !user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={{ user }} />;
};
