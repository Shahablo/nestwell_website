/** The mailto: fallback stays under the length mail handlers accept, and says when it shortened. */
import { describe, expect, it } from 'vitest';
import { MAILTO_LIMIT, buildMailto } from '../src/scripts/form';

describe('buildMailto', () => {
  it('leaves a short message untouched', () => {
    const { href, truncated } = buildMailto('hello@example.com', 'Pilot conversation', { Practice: 'Example OB', Role: 'Other' });
    expect(truncated).toBe(false);
    expect(decodeURIComponent(href)).toContain('Practice: Example OB\nRole: Other');
  });

  it('shortens the longest field to fit the limit and marks it', () => {
    const { href, truncated } = buildMailto('hello@example.com', 'Pilot conversation', {
      Practice: 'Example OB',
      Message: 'Who owns the gap? '.repeat(400),
      Tools: 'A portal. '.repeat(40),
    });
    expect(truncated).toBe(true);
    expect(href.length).toBeLessThanOrEqual(MAILTO_LIMIT);
    expect(decodeURIComponent(href)).toContain('[shortened]');
    expect(decodeURIComponent(href)).toContain('Practice: Example OB');
  });
});
