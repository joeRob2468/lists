import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { NAV_LINKS } from '@/config/navigation.config';
import { UserButton } from '@/modules/auth/components/user-button/user-button';
import classes from './app-layout.module.css';

export const AppLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

  const links = NAV_LINKS.map((item) => (
    <NavLink
      key={item.label}
      active={location.pathname === item.link}
      label={item.label}
      leftSection={<item.icon size={'1.2rem'} stroke={1.5} />}
      onClick={() => {
        navigate(item.link);
        if (opened) toggle();
      }}
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      p="xl"
    >
      <AppShell.Header>
        <Group h="100%" px={'md'}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Shopping List</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>{links}</AppShell.Section>
        <AppShell.Section className={classes.navbarFooter}>
          <UserButton />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
