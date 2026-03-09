import { useUser } from '@/modules/auth/hooks/use-user';
import { Button, Container, Stack, Text, Title, rem } from '@mantine/core';
import { env } from '@repo/env';
import { IconBrandGoogle } from '@tabler/icons-react';
import { Navigate } from 'react-router-dom';

export const Landing = () => {
  const { user, isLoading } = useUser();

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}/dashboard`;
    window.location.href = `${env.VITE_API_URL}/auth/login/google?return_url=${encodeURIComponent(returnUrl)}`;
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container size="md" h="100vh" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Stack gap={30} align="center" ta="center">
        <Title order={1} style={{ fontSize: rem(48) }}>
          Shopping Lists.
        </Title>

        <Text c="dimmed" size="lg" maw={580}>
          A simple, collaborative shopping list app. Create templates, share with family, and check off items in
          real-time. No clutter, just groceries.
        </Text>

        <Button
          size="xl"
          variant="default"
          leftSection={<IconBrandGoogle size={20} />}
          onClick={handleLogin}
          loading={isLoading}
          mt="xl"
        >
          Continue with Google
        </Button>
      </Stack>
    </Container>
  );
};
