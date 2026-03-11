import { SEO_CONFIG, type RouteSEO } from '@/config/seo.config';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  seo?: RouteSEO;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO = ({ seo, title, description, image, url }: SeoProps) => {
  const finalTitle = title || seo?.title;
  const fullTitle =
    finalTitle === SEO_CONFIG.appName
      ? SEO_CONFIG.defaultTitle
      : finalTitle
        ? SEO_CONFIG.titleTemplate.replace('%s', finalTitle)
        : SEO_CONFIG.defaultTitle;

  const finalDescription = description || seo?.description || SEO_CONFIG.defaultDescription;
  const finalImage = image || SEO_CONFIG.defaultOgImage;
  const finalUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="theme-color" content={SEO_CONFIG.themeColor} />

      {/* Open Graph (Facebook, iMessage, Slack, LinkedIn) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={SEO_CONFIG.appName} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
};
