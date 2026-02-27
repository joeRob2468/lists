import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/providers/app-provider';
import { ProtectedRoute } from '@/modules/auth/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout/app-layout';
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from '@/config/routes.config';
import { Suspense } from 'react';
import { LoadingOverlay } from '@mantine/core';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          {PUBLIC_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={<LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />}>
                  {route.element}
                </Suspense>
              }
            />
          ))}

          {/* Private Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {PRIVATE_ROUTES.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Suspense fallback={<LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />}>
                      {route.element}
                    </Suspense>
                  }
                />
              ))}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
