import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { PAGES, robotsTxt, siteUrl, sitemapXml } from './scripts/site';

// Served at the root of the custom domain (hellonestwell.com). Set BASE_PATH=/nestwell_website/
// to build for the github.io project path instead.
const base = process.env.BASE_PATH ?? '/';

// Absolute origin for canonical / Open Graph URLs, the sitemap and robots.txt.
// Defaults to https://hellonestwell.com; the deploy workflow passes the github.io URL
// while the site is served there (see scripts/site.ts).
const origin = siteUrl();

export default defineConfig({
  base,
  plugins: [
    {
      name: 'nestwell-site-meta',
      transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => html.replaceAll('%SITE_URL%', origin),
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(origin) });
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(origin) });
      },
    },
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(__dirname, `${p}.html`)])),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
