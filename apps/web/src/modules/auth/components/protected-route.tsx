import { LoadingOverlay } from '@mantine/core';
import { useUser } from '../hooks/use-user';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { user, isLoading, isError } = useUser();

  if (isLoading) {
    return <LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />;
  }

  if (isError || !user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={{ user }} />;
};
