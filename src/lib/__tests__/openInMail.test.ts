import { describe, it, expect } from 'vitest';
import { mailtoUrl, outlookUrl, gmailUrl } from '../openInMail';

const msg = {
  to: 'monmac@tisd.net',
  subject: 'Great meeting you — Michael from Monarch Machinery Inc',
  body: 'Hi Michael,\n\nIt was great meeting you.\n\nKenny',
};

describe('mail compose links', () => {
  /**
   * The address goes in the path, unencoded. The previous code ran the whole
   * address through encodeURIComponent, turning the @ into %40 — tolerated by
   * most clients, wrong by the spec, and a needless thing to be wrong about.
   */
  it('leaves the address readable in the mailto path', () => {
    expect(mailtoUrl(msg).startsWith('mailto:monmac@tisd.net?')).toBe(true);
  });

  it('asks for Outlook by name rather than relying on the system default', () => {
    expect(outlookUrl(msg).startsWith('ms-outlook://compose?')).toBe(true);
    expect(outlookUrl(msg)).toContain('to=monmac%40tisd.net');
  });

  /**
   * The test that mattered, written wrong the first time.
   *
   * I originally built these with URLSearchParams, which form-encodes a space as
   * `+`, and then asserted `toContain('Hi+Michael')` — enshrining the bug as the
   * expectation. It shipped green and Kenny opened a draft reading
   * "Hi+Rodrigo,+It+was+great+meeting+you". Mail clients percent-decode; they do
   * not turn `+` back into a space.
   *
   * So this now asserts the opposite: spaces are %20, and no literal `+` ever
   * appears between two words.
   */
  it('encodes spaces as %20, never as +', () => {
    for (const url of [mailtoUrl(msg), outlookUrl(msg), gmailUrl(msg)]) {
      expect(url).not.toContain('\n');
      expect(url).toContain('Hi%20Michael');
      expect(url).not.toContain('Hi+Michael');
      // No `+` immediately followed by a letter anywhere in the URL.
      expect(/\+[A-Za-z]/.test(url)).toBe(false);
      // The em dash survives rather than truncating the subject.
      expect(decodeURIComponent(url)).toContain('—');
      // And a decoded body reads like prose, with real spaces and newlines.
      expect(decodeURIComponent(url)).toContain('It was great meeting you.');
    }
  });

  it('builds a Gmail compose URL with the right parameter names', () => {
    const u = gmailUrl(msg);
    expect(u).toContain('view=cm');
    expect(u).toContain('su=');
  });
});
