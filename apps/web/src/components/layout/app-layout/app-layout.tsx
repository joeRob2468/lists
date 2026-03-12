import { NAV_LINKS } from '@/config/navigation.config';
import { UserButton } from '@/modules/auth/components/user-button/user-button';
import { AppShell, Burger, Button, Container, Group, Image, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export const AppLayout = () => {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

  // --- DESKTOP LINKS ---
  const desktopLinks = NAV_LINKS.map((item) => {
    const isActive = location.pathname === item.link;
    return (
      <Button
        key={item.label}
        variant={isActive ? 'light' : 'subtle'}
        color={isActive ? '' : 'gray'}
        onClick={() => navigate(item.link)}
        leftSection={<item.icon size="1.1rem" />}
        size="sm"
      >
        {item.label}
      </Button>
    );
  });

  // --- MOBILE LINKS ---
  const mobileLinks = NAV_LINKS.map((item) => (
    <NavLink
      key={item.label}
      active={location.pathname === item.link}
      label={item.label}
      leftSection={<item.icon size="1.2rem" stroke={1.5} />}
      onClick={() => {
        navigate(item.link);
        close();
      }}
      style={{ borderRadius: 'var(--mantine-radius-sm)' }}
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'md',
        collapsed: { desktop: true, mobile: !opened },
      }}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />

              <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                <Image src="/logo.svg" h={30} w={30} />
                <Title order={3} size="md" style={{ color: '#FFFFFF' }}>
                  Lists
                </Title>
              </Group>

              <Group ml="xl" gap="sm" visibleFrom="md">
                {desktopLinks}
              </Group>
            </Group>

            <Group>
              <UserButton />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md" hiddenFrom="md">
        <AppShell.Section grow>{mobileLinks}</AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
