import { describe, it, expect } from 'vitest';
import { contactCreateSchema } from '../validators';

/**
 * The scan pages post `personalitySummary: null` whenever a card is saved
 * without running personality research first (src/app/confirm/page.tsx and
 * src/app/upload/review/page.tsx both initialise it to null). The schema used
 * `.optional()`, which accepts undefined but rejects null, so every one of
 * those saves failed with a 400 and no contact was created.
 */
describe('contactCreateSchema', () => {
  const base = { name: 'Jane Doe' };

  it('accepts a card saved without personality research', () => {
    const result = contactCreateSchema.safeParse({
      ...base,
      email: 'jane@acme.com',
      phone: '555-0100',
      company: 'Acme Steel',
      address: 'Tampa, FL',
      rawOcrText: 'Jane Doe\nAcme Steel',
      personalityType: 'Balanced',
      personalityConfidence: 'none',
      personalitySummary: null,
      researchSnippets: '',
    });

    expect(result.success).toBe(true);
  });

  it('accepts null for every nullable text field', () => {
    const result = contactCreateSchema.safeParse({
      ...base,
      email: null,
      phone: null,
      company: null,
      address: null,
      personalitySummary: null,
      researchSnippets: null,
      industryVertical: null,
      rawOcrText: null,
      batchId: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts the same fields as empty strings and as absent', () => {
    expect(
      contactCreateSchema.safeParse({ ...base, email: '', personalitySummary: '' }).success
    ).toBe(true);
    expect(contactCreateSchema.safeParse(base).success).toBe(true);
  });

  it('still rejects a malformed email', () => {
    const result = contactCreateSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('still requires a name', () => {
    expect(contactCreateSchema.safeParse({ name: '' }).success).toBe(false);
    expect(contactCreateSchema.safeParse({}).success).toBe(false);
  });
});
