/**
 * Site-level build facts shared by vite.config.ts and the tests: the pages, the public origin,
 * and the generated sitemap.xml / robots.txt.
 *
 * SITE_URL is the absolute origin (plus sub-path) the build is published at, with no trailing
 * slash. It defaults to the custom domain; the deploy workflow sets it to the github.io
 * project URL while the site is served there, so canonical and Open Graph URLs point at a
 * host that actually answers.
 */

/** Every page Vite builds. 404 is built but never listed in the sitemap. */
export const PAGES = ['index', 'how-it-works', 'for-practices', 'for-families', 'about', 'contact', 'privacy', '404'] as const;

/** The seven content pages, in sitemap order, with their sitemap hints. */
export const SITEMAP: ReadonlyArray<{ page: string; changefreq: string; priority: string }> = [
  { page: 'index', changefreq: 'monthly', priority: '1.0' },
  { page: 'how-it-works', changefreq: 'monthly', priority: '0.9' },
  { page: 'for-practices', changefreq: 'monthly', priority: '0.9' },
  { page: 'for-families', changefreq: 'monthly', priority: '0.8' },
  { page: 'about', changefreq: 'monthly', priority: '0.7' },
  { page: 'contact', changefreq: 'monthly', priority: '0.8' },
  { page: 'privacy', changefreq: 'yearly', priority: '0.3' },
];

export const DEFAULT_SITE_URL = 'https://hellonestwell.com';

export function siteUrl(raw: string | undefined = process.env.SITE_URL): string {
  const value = (raw ?? '').trim() || DEFAULT_SITE_URL;
  return value.replace(/\/+$/, '');
}

export function pageUrl(origin: string, page: string): string {
  return page === 'index' ? `${origin}/` : `${origin}/${page}.html`;
}

export function sitemapXml(origin: string): string {
  const rows = SITEMAP.map(
    ({ page, changefreq, priority }) =>
      `  <url><loc>${pageUrl(origin, page)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}
