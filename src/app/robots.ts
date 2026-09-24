import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/_next/',
          '/scratch/',
        ],
      },
    ],
    sitemap: 'https://sfvapparel.my/sitemap.xml',
    host: 'https://sfvapparel.my',
  };
}
