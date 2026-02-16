import { describe, it, expect } from 'vitest';
import {
  COMBILIFT_PRODUCTS,
  VALUE_PILLARS,
  FLORIDA_INDUSTRIES,
  matchProductToIndustry,
  getRelevantStats,
} from '../combilift-knowledge';

describe('COMBILIFT_PRODUCTS', () => {
  it('has complete data for every product', () => {
    for (const [productName, product] of Object.entries(COMBILIFT_PRODUCTS)) {
      expect(product.description, `${productName} missing description`).toBeTruthy();
      expect(typeof product.description).toBe('string');
      expect(product.description.length).toBeGreaterThan(0);

      expect(Array.isArray(product.idealFor), `${productName} idealFor should be an array`).toBe(
        true,
      );
      expect(product.idealFor.length, `${productName} idealFor should be non-empty`).toBeGreaterThan(
        0,
      );

      expect(product.keyBenefit, `${productName} missing keyBenefit`).toBeTruthy();
      expect(typeof product.keyBenefit).toBe('string');
      expect(product.keyBenefit.length).toBeGreaterThan(0);

      expect(product.safetyAngle, `${productName} missing safetyAngle`).toBeTruthy();
      expect(typeof product.safetyAngle).toBe('string');
      expect(product.safetyAngle.length).toBeGreaterThan(0);

      expect(product.roiAngle, `${productName} missing roiAngle`).toBeTruthy();
      expect(typeof product.roiAngle).toBe('string');
      expect(product.roiAngle.length).toBeGreaterThan(0);
    }
  });
});

describe('VALUE_PILLARS', () => {
  it('has headline and at least 2 stats for each pillar', () => {
    for (const [pillarName, pillar] of Object.entries(VALUE_PILLARS)) {
      expect(pillar.headline, `${pillarName} missing headline`).toBeTruthy();
      expect(typeof pillar.headline).toBe('string');
      expect(pillar.headline.length).toBeGreaterThan(0);

      expect(Array.isArray(pillar.stats), `${pillarName} stats should be an array`).toBe(true);
      expect(
        pillar.stats.length,
        `${pillarName} should have at least 2 stats`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('FLORIDA_INDUSTRIES', () => {
  it('contains at least 5 industries', () => {
    expect(FLORIDA_INDUSTRIES.length).toBeGreaterThanOrEqual(5);
  });
});

describe('matchProductToIndustry', () => {
  it('returns a valid product name for a timber yard query', () => {
    const productNames = Object.keys(COMBILIFT_PRODUCTS);
    const result = matchProductToIndustry('timber yard', ['lumber', 'timber']);

    expect(productNames).toContain(result);
  });

  it('returns a string for any input', () => {
    const result = matchProductToIndustry('unknown industry', ['random']);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getRelevantStats', () => {
  it('returns a non-empty array for "safety" pillar', () => {
    const stats = getRelevantStats('safety');

    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it('returns a non-empty array for "roi" pillar', () => {
    const stats = getRelevantStats('roi');

    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it('returns a non-empty array for "efficiency" pillar', () => {
    const stats = getRelevantStats('efficiency');

    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it('returns a non-empty array for "storage" pillar', () => {
    const stats = getRelevantStats('storage');

    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });
});
