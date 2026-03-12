import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <HelmetProvider>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <QueryClientProvider client={queryClient}>
          <ModalsProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </ModalsProvider>
          <Notifications />
        </QueryClientProvider>
      </MantineProvider>
    </HelmetProvider>
  );
};
