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
