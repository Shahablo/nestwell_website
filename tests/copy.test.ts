/**
 * Copy rules from docs/BRIEF.md section 2. Scans every .html at the repo root and every
 * src/** /*.ts file, plus the walkthrough captions in public/media/*.vtt, for prohibited phrases
 * (case-insensitive, word boundaries), and checks that every page has a unique <title> and a
 * <meta name="description">.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');

export const PROHIBITED = [
  'first-of-its-kind',
  'first',
  'only',
  'better than a clinician',
  'replaces',
  'guaranteed',
  'proven',
  'proven outcomes',
  'clinically validated',
  'HIPAA compliant',
  'HIPAA certified',
  'FDA cleared',
  'FDA approved',
  'non-device',
  'the app decides nothing',
  'just shows information',
  '24/7 monitoring',
  'always watching',
  "we'll know",
  'AI triage',
  'AI therapy',
  'AI diagnosis',
  'reduces maternal mortality',
  'prevents complications',
  'saves lives',
];

/** Names a competitor: BRIEF.md forbids any description of one. */
const COMPETITORS = ['Maven', 'Pomelo', 'Babyscripts', 'Ovia', 'Soula'];

function phrasePattern(phrase: string): RegExp {
  const escaped = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'iu');
}

function normalise(text: string): string {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/&rsquo;|&#8217;|&#x2019;/gi, "'")
    .replace(/&nbsp;/g, ' ');
}

function walk(dir: string, filter: (file: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

const htmlFiles = readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(ROOT, f));
const tsFiles = walk(join(ROOT, 'src'), (f) => f.endsWith('.ts'));
const partials = walk(join(ROOT, 'src', 'partials'), (f) => f.endsWith('.html'));
const mediaDir = join(ROOT, 'public', 'media');
const captionFiles = existsSync(mediaDir)
  ? walk(mediaDir, (f) => f.endsWith('.vtt'))
  : [];
const scanned = [...htmlFiles, ...tsFiles, ...partials, ...captionFiles];

describe('prohibited phrases (BRIEF.md section 2)', () => {
  it('finds pages to scan', () => {
    expect(htmlFiles.length).toBeGreaterThanOrEqual(7);
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  it('finds the walkthrough captions to scan', () => {
    expect(captionFiles.map((f) => relative(ROOT, f).split('\\').join('/'))).toContain(
      'public/media/nestwell-walkthrough.vtt',
    );
  });

  for (const file of scanned) {
    it(`${relative(ROOT, file)} contains no prohibited phrase`, () => {
      const text = normalise(readFileSync(file, 'utf8'));
      const hits: string[] = [];
      for (const phrase of [...PROHIBITED, ...COMPETITORS]) {
        const match = phrasePattern(phrase).exec(text);
        if (match) {
          const line = text.slice(0, match.index).split('\n').length;
          hits.push(`"${phrase}" at line ${line}`);
        }
      }
      expect(hits, hits.join('; ')).toEqual([]);
    });
  }
});

describe('page metadata', () => {
  const titles = new Map<string, string>();

  for (const file of htmlFiles) {
    const name = relative(ROOT, file);
    const html = readFileSync(file, 'utf8');

    it(`${name} has a non-empty <title>`, () => {
      const match = /<title>([^<]+)<\/title>/i.exec(html);
      expect(match, 'missing <title>').not.toBeNull();
      const title = match![1]!.trim();
      expect(title.length).toBeGreaterThan(0);
      titles.set(name, title);
    });

    it(`${name} has a meta description`, () => {
      const match = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
      expect(match, 'missing <meta name="description">').not.toBeNull();
      expect(match![1]!.trim().length).toBeGreaterThan(20);
    });

    it(`${name} has an html lang attribute`, () => {
      expect(/<html[^>]*\slang="en"/i.test(html)).toBe(true);
    });
  }

  it('every page title is unique', () => {
    const seen = new Map<string, string>();
    for (const [file, title] of titles) {
      expect(seen.has(title), `duplicate title "${title}" in ${file} and ${seen.get(title)}`).toBe(false);
      seen.set(title, file);
    }
    expect(seen.size).toBe(htmlFiles.length);
  });
});
