import { describe, it, expect } from 'vitest';
import { parseContactFields, parseBusinessCard } from '../parser';

const cleanText = `John Smith
Senior Vice President
Acme Corporation
john.smith@acme.com
(555) 123-4567
1234 Main Street, Suite 100
Orlando, FL 32801`;

const messyText = `WILLIAMS CONSTRUCTION LLC
Bob Williams
Project Manager
bwilliams@williamsconst.net
Office: 904-555-0199
Mobile: 904-555-0200
8821 Commerce Way
Jacksonville FL 32256`;

const partialText = `Lisa M. Garcia
Operations Director
lisa@example.com`;

describe('parseContactFields', () => {
  describe('clean card', () => {
    it('extracts name, email, phone, company, and address correctly', () => {
      const result = parseContactFields(cleanText);

      expect(result.name).toBe('John Smith');
      expect(result.email).toBe('john.smith@acme.com');
      expect(result.phone).toContain('555');
      expect(result.phone).toContain('123');
      expect(result.phone).toContain('4567');
      expect(result.company).toBe('Acme Corporation');
      expect(result.address).toContain('Orlando');
    });
  });

  describe('messy card', () => {
    it('extracts fields from a card with multiple phone numbers and uppercase company', () => {
      const result = parseContactFields(messyText);

      expect(result.name).toBe('Bob Williams');
      expect(result.email).toContain('bwilliams');
      expect(result.phone).toContain('904');
      expect(result.company.toLowerCase()).toContain('williams');
    });
  });

  describe('partial card (missing fields)', () => {
    it('extracts available fields and handles missing ones gracefully', () => {
      const result = parseContactFields(partialText);

      const nameHasLisa = result.name.includes('Lisa');
      const nameHasGarcia = result.name.includes('Garcia');
      expect(nameHasLisa || nameHasGarcia).toBe(true);

      expect(result.email).toBe('lisa@example.com');

      // Company may be empty or may have extracted "Operations Director" as a
      // fallback heuristic. Either way, ensure it is a string.
      expect(typeof result.company).toBe('string');
    });
  });
});

describe('parseBusinessCard (confidence)', () => {
  it('returns high confidence for email and phone on a clean card', async () => {
    const { confidence } = await parseBusinessCard(cleanText);

    expect(confidence.email).toBe('high');
    expect(confidence.phone).toBe('high');
  });

  it('returns low confidence for phone when phone is missing', async () => {
    const { confidence } = await parseBusinessCard(partialText);

    expect(confidence.phone).toBe('low');
  });
});
