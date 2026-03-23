import { LoadingOverlay } from '@mantine/core';
import { useUser } from '../hooks/use-user';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { user, isLoading, isError } = useUser();
  const location = useLocation();
  const returnTo = encodeURIComponent(location.pathname + location.search);

  if (isLoading) {
    return <LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />;
  }

  if (isError || !user) {
    return <Navigate to={`/?returnTo=${returnTo}`} replace />;
  }

  return <Outlet context={{ user }} />;
};
