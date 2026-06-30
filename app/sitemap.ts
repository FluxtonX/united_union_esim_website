import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unitedunion.esim';

  // Supported countries catalog list
  const countries = ['us', 'gb', 'jp', 'fr', 'de', 'sg', 'ph', 'th', 'es', 'it'];

  const countryUrls = countries.map((code) => ({
    url: `${baseUrl}/plans/${code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    ...countryUrls,
  ];
}
