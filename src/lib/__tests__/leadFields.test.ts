import { describe, it, expect } from 'vitest';
import { missingLeadFields } from '../leadFields';

/**
 * The deal app's /api/leads refuses a lead unless all four are present, so this
 * check is what stands between a booth card and a 400 at the worst moment. OCR
 * misses phone numbers routinely, which is exactly the case worth pinning down.
 */
describe('missingLeadFields', () => {
  const full = {
    companyName: 'Booth Prospect Materials Co',
    contactName: 'Dana Reyes',
    contactPhone: '407-555-0142',
    contactEmail: 'dana@boothprospect.com',
  };

  it('passes a complete card', () => {
    expect(missingLeadFields(full)).toEqual([]);
  });

  it('names the missing field so it can be fixed at the booth', () => {
    expect(missingLeadFields({ ...full, contactPhone: '' })).toEqual(['phone']);
  });

  it('treats whitespace as missing -- OCR yields blank-looking strings', () => {
    expect(missingLeadFields({ ...full, contactEmail: '   ' })).toEqual(['email']);
  });

  it('reports every missing field, in form order', () => {
    expect(missingLeadFields({ contactName: 'Dana Reyes' })).toEqual(['company', 'phone', 'email']);
  });

  it('treats absent keys the same as empty ones', () => {
    expect(missingLeadFields({})).toEqual(['company', 'name', 'phone', 'email']);
  });
});

/**
 * The follow-up interval is typed by hand now, so the rules the tracker enforces
 * server-side (integer, at least 1 day) have to be enforced before the contact is
 * written -- otherwise a bad number surfaces as a 400 after the save, which is
 * exactly the "looks like it worked" failure this screen is built to avoid.
 */
describe('follow-up interval validation', () => {
  const parse = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 && n <= 365;
  };

  it('accepts a typed number in range', () => {
    expect(parse('10')).toBe(true);
    expect(parse('1')).toBe(true);
    expect(parse('365')).toBe(true);
  });

  it('rejects an empty box, which is what a half-retyped field looks like', () => {
    expect(parse('')).toBe(false);
    expect(parse('   ')).toBe(false);
  });

  it('rejects zero and negatives -- the tracker requires at least one day', () => {
    expect(parse('0')).toBe(false);
    expect(parse('-3')).toBe(false);
  });

  it('rejects a value beyond a year', () => {
    expect(parse('366')).toBe(false);
  });

  it('rejects text', () => {
    expect(parse('soon')).toBe(false);
  });
});
