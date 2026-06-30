import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/api/',
        '/checkout', // Si existe
        '/my-account', // Si existe
      ],
    },
    sitemap: 'https://www.montevida.pe/sitemap.xml',
  };
}
