import { AppLayout } from '@/components/layout/app-layout/app-layout';
import { SEO } from '@/components/ui/seo/seo';
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from '@/config/routes.config';
import { ProtectedRoute } from '@/modules/auth/components/protected-route';
import { AppProvider } from '@/providers/app-provider';
import { LoadingOverlay } from '@mantine/core';
import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

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
                <>
                  <SEO seo={route.seo} />
                  <Suspense fallback={<LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />}>
                    {route.element}
                  </Suspense>
                </>
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
                    <>
                      <SEO seo={route.seo} />
                      <Suspense fallback={<LoadingOverlay overlayProps={{ radius: 'sm', blur: 2 }} visible />}>
                        {route.element}
                      </Suspense>
                    </>
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
