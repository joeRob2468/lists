import { lazy } from 'react';

export interface RouteSEO {
  title: string;
  description?: string;
}

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  seo?: RouteSEO;
}

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

export const PUBLIC_ROUTES: AppRoute[] = [{ path: '/', element: <Landing /> }];

export const PRIVATE_ROUTES: AppRoute[] = [
  { path: '/dashboard', element: <Dashboard />, seo: { title: 'Dashboard' } },
  { path: '/templates', element: <Templates />, seo: { title: 'Templates' } },
  { path: '/lists', element: <Lists />, seo: { title: 'My Lists' } },
  { path: '/lists/:listId', element: <ListDetail /> },
];
