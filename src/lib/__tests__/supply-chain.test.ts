import { describe, it, expect } from 'vitest';
import { assessCombiliftFit } from '../supply-chain';

describe('assessCombiliftFit', () => {
  it('recommends C-Series for lumber yard operations', () => {
    const result = assessCombiliftFit(
      'Lumber yard and timber distribution',
      'Lumber & Building Materials',
    );

    expect(result.product).toContain('C-Series');
  });

  it('recommends Aisle-Master for distribution center / warehouse operations', () => {
    const result = assessCombiliftFit(
      'Large distribution center and warehouse operations',
      'Distribution & Warehousing',
    );

    expect(result.product).toContain('Aisle-Master');
  });

  it('recommends Straddle-Carrier for precast concrete and heavy panel handling', () => {
    const result = assessCombiliftFit(
      'Precast concrete manufacturing and heavy panel handling',
      'Precast Concrete & Construction',
    );

    expect(result.product).toContain('Straddle');
  });

  it('recommends Aisle-Master for cold storage warehouse operations', () => {
    const result = assessCombiliftFit(
      'Temperature-controlled cold storage warehouse',
      'Cold Storage & 3PL',
    );

    expect(result.product).toContain('Aisle-Master');
  });

  it('defaults to a valid product string for unknown industry', () => {
    const result = assessCombiliftFit('General business operations', 'Other');

    expect(typeof result.product).toBe('string');
    expect(result.product.length).toBeGreaterThan(0);
  });

  it('produces a descriptive rationale (more than 20 characters)', () => {
    const result = assessCombiliftFit(
      'Steel fabrication and long bar storage',
      'Steel & Metals Distribution',
    );

    expect(result.rationale.length).toBeGreaterThan(20);
  });
});
