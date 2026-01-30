import { lazy } from 'react';

const Landing = lazy(() =>
  import('@/modules/landing/pages/landing').then((m) => ({
    default: m.Landing,
  })),
);

const Dashboard = lazy(() =>
  import('@/modules/dashboard/pages/dashboard').then((m) => ({
    default: m.Dashboard,
  })),
);
const Templates = lazy(() =>
  import('@/modules/shopping-list/pages/templates').then((m) => ({
    default: m.Templates,
  })),
);
const Lists = lazy(() =>
  import('@/modules/shopping-list/pages/lists').then((m) => ({
    default: m.Lists,
  })),
);
const ListDetail = lazy(() =>
  import('@/modules/shopping-list/pages/list-detail').then((m) => ({
    default: m.ListDetail,
  })),
);

export const PUBLIC_ROUTES = [{ path: '/', element: <Landing /> }];

export const PRIVATE_ROUTES = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/templates', element: <Templates /> },
  { path: '/lists', element: <Lists /> },
  { path: '/lists/:listId', element: <ListDetail /> },
];
