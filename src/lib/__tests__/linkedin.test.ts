import { describe, it, expect } from 'vitest';
import { linkedInTarget } from '../linkedin';

describe('linkedInTarget', () => {
  it('links straight to a profile the card printed', () => {
    const t = linkedInTarget({
      name: 'Dana Reyes',
      company: 'Booth Prospect',
      rawOcrText: 'Dana Reyes\nlinkedin.com/in/danareyes-mhe\n407-555-0142',
    });
    expect(t).toEqual({
      kind: 'profile',
      url: 'https://www.linkedin.com/in/danareyes-mhe',
      label: 'Open LinkedIn profile',
    });
  });

  it('recovers a profile URL that OCR split with spaces', () => {
    const t = linkedInTarget({
      name: 'Dana Reyes',
      rawOcrText: 'www. linkedin .com / in / dana-reyes-42',
    });
    expect(t?.kind).toBe('profile');
    expect(t?.url).toBe('https://www.linkedin.com/in/dana-reyes-42');
  });

  it('handles a regional subdomain and a full scheme', () => {
    const t = linkedInTarget({
      name: 'Ana Silva',
      rawOcrText: 'https://br.linkedin.com/in/ana-silva-99',
    });
    expect(t?.url).toBe('https://www.linkedin.com/in/ana-silva-99');
  });

  it('falls back to a people search using name and company', () => {
    const t = linkedInTarget({ name: 'Dana Reyes', company: 'Booth Prospect Materials Co' });
    expect(t?.kind).toBe('search');
    expect(t?.url).toContain('/search/results/people/');
    expect(t?.url).toContain('Dana%20Reyes');
    expect(t?.url).toContain('Booth%20Prospect');
  });

  it('searches on the name alone when there is no company', () => {
    const t = linkedInTarget({ name: 'Dana Reyes' });
    expect(t?.kind).toBe('search');
    expect(t?.url).toContain('Dana%20Reyes');
  });

  /**
   * The point of the whole module: never invent a profile slug. A search that
   * costs one extra tap beats a confident link to the wrong Dana Reyes.
   */
  it('never fabricates a profile URL from a name', () => {
    const t = linkedInTarget({ name: 'Dana Reyes', company: 'Booth Prospect' });
    expect(t?.url).not.toContain('/in/');
  });

  it('returns nothing when there is no name to search for', () => {
    expect(linkedInTarget({ company: 'Booth Prospect' })).toBeNull();
    expect(linkedInTarget({})).toBeNull();
  });
});
