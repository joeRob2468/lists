export interface RouteSEO {
  title: string;
  description?: string;
}

export const SEO_CONFIG = {
  appName: 'Shopping Lists',
  titleTemplate: '%s | Shopping Lists',
  defaultTitle: 'Shopping Lists | Collaborative Groceries',
  defaultDescription:
    'A simple, collaborative shopping list app. Create templates, share with family, and check off items in real-time.',
  themeColor: '#228be6',
  baseUrl: window.location.origin,
  defaultOgImage: `${window.location.origin}/og-image.jpg`, // 1200x630
};
