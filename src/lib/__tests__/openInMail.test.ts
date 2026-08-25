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

  it('escapes newlines and non-ascii so the body arrives intact', () => {
    for (const url of [mailtoUrl(msg), outlookUrl(msg), gmailUrl(msg)]) {
      expect(url).not.toContain('\n');
      expect(url).toContain('Hi+Michael');
      // The em dash in the subject must survive rather than truncating it.
      expect(decodeURIComponent(url.replace(/\+/g, ' '))).toContain('—');
    }
  });

  it('builds a Gmail compose URL with the right parameter names', () => {
    const u = gmailUrl(msg);
    expect(u).toContain('view=cm');
    expect(u).toContain('su=');
  });
});
