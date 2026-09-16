/**
 * Every href/src on every root page: relative links resolve to a file (in the repo root or in
 * public/), and nothing is root-absolute (GitHub Pages serves the site under a sub-path).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGES, siteUrl, sitemapXml } from '../scripts/site';

const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const htmlFiles = readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(ROOT, f));

const EXTERNAL = /^(https?:|mailto:|tel:|sms:|data:|javascript:|#|%SITE_URL%)/i;

function references(html: string): string[] {
  const out: string[] = [];
  const pattern = /\b(?:href|src)\s*=\s*"([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) out.push(match[1]!);
  return out;
}

describe('internal links', () => {
  for (const file of htmlFiles) {
    const name = relative(ROOT, file);
    const html = readFileSync(file, 'utf8');
    const refs = references(html);

    it(`${name} has no root-absolute href or src`, () => {
      const absolute = refs.filter((r) => r.startsWith('/') && !r.startsWith('//'));
      expect(absolute, absolute.join(', ')).toEqual([]);
    });

    it(`${name} relative links resolve to files`, () => {
      const missing: string[] = [];
      for (const ref of refs) {
        if (ref === '' || EXTERNAL.test(ref) || ref.startsWith('/')) continue;
        const path = ref.replace(/[?#].*$/, '');
        if (path === '') continue;
        const candidates = [resolve(ROOT, path), resolve(PUBLIC, path)];
        if (!candidates.some((c) => existsSync(c))) missing.push(ref);
      }
      expect(missing, missing.join(', ')).toEqual([]);
    });

    it(`${name} in-page anchors point at an existing id`, () => {
      const ids = new Set<string>();
      const idPattern = /\sid="([^"]+)"/g;
      let m: RegExpExecArray | null;
      while ((m = idPattern.exec(html)) !== null) ids.add(m[1]!);
      const broken = refs.filter((r) => r.startsWith('#') && r.length > 1 && !ids.has(r.slice(1)));
      expect(broken, broken.join(', ')).toEqual([]);
    });
  }

  it('the seven site pages exist', () => {
    for (const page of ['index', 'how-it-works', 'for-practices', 'for-families', 'about', 'contact', 'privacy']) {
      expect(existsSync(join(ROOT, `${page}.html`)), `${page}.html`).toBe(true);
    }
  });

  it('the generated sitemap lists exactly the seven pages, never 404', () => {
    const xml = sitemapXml('https://example.github.io/nestwell_website');
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1]);
    expect(locs).toHaveLength(7);
    for (const loc of locs) expect(loc!.startsWith('https://example.github.io/nestwell_website/')).toBe(true);
    expect(xml).not.toContain('404');
  });

  it('the site URL defaults to the custom domain and drops a trailing slash', () => {
    expect(siteUrl('')).toBe('https://hellonestwell.com');
    expect(siteUrl('https://example.github.io/nestwell_website/')).toBe('https://example.github.io/nestwell_website');
  });

  it('every built page is listed in the Vite inputs', () => {
    for (const file of htmlFiles) {
      const page = relative(ROOT, file).replace(/\.html$/, '');
      expect(PAGES as readonly string[], `${page}.html missing from scripts/site.ts PAGES`).toContain(page);
    }
  });

  it('absolute URLs in page heads use the %SITE_URL% placeholder', () => {
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      expect(html, relative(ROOT, file)).not.toContain('https://hellonestwell.com/');
    }
  });
});
