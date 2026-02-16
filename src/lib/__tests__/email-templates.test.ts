import { describe, it, expect } from 'vitest';
import {
  generateFollowUpDraft,
  generateNurtureDraft,
  PERSONALITY_DESCRIPTIONS,
  type TemplateContact,
} from '../email-templates';

function makeContact(overrides: Partial<TemplateContact> = {}): TemplateContact {
  return {
    name: 'Test Person',
    company: 'TestCo',
    personalityType: 'Balanced',
    personalitySummary: null,
    researchSnippets: null,
    industryVertical: 'Manufacturing',
    emailDrafts: [],
    ...overrides,
  };
}

const personalityTypes = ['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced'] as const;

const nurtureTopics = [
  'Warehouse Safety & OSHA Compliance',
  'Space Optimization & Storage Density',
  'Long Load & Bulk Material Handling',
  'ROI & Total Cost of Ownership',
  'Fleet Management & Maintenance',
] as const;

describe('generateFollowUpDraft', () => {
  it('produces a shorter body for Driver than for Amiable', () => {
    const driverContact = makeContact({ personalityType: 'Driver' });
    const amiableContact = makeContact({ personalityType: 'Amiable' });

    const driverDraft = generateFollowUpDraft(driverContact);
    const amiableDraft = generateFollowUpDraft(amiableContact);

    expect(driverDraft.body.length).toBeLessThan(amiableDraft.body.length);
  });

  it('produces at least 3 unique subjects across all 5 personality types', () => {
    const subjects = personalityTypes.map((type) => {
      const contact = makeContact({ personalityType: type });
      return generateFollowUpDraft(contact).subject;
    });

    const uniqueSubjects = new Set(subjects);
    expect(uniqueSubjects.size).toBeGreaterThanOrEqual(3);
  });

  it('includes required template placeholders for each personality type', () => {
    for (const type of personalityTypes) {
      const contact = makeContact({ personalityType: type });
      const draft = generateFollowUpDraft(contact);

      const hasPersonalNote = draft.body.includes('[Personal note');
      const hasWhereWeMet = draft.body.includes('[Where we met]');
      const hasCallToAction = draft.body.includes('[Your call to action');

      const matchCount = [hasPersonalNote, hasWhereWeMet, hasCallToAction].filter(Boolean).length;
      expect(matchCount).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('generateNurtureDraft', () => {
  it('generates bodies containing Combilift-relevant keywords for each nurture topic', () => {
    const relevantKeywords = [
      'safety',
      'storage',
      'aisle',
      'forklift',
      'roi',
      'combilift',
      'warehouse',
      'narrow',
      'fleet',
      'maintenance',
      'osha',
      'pallet',
      'space',
      'load',
      'operator',
      'machine',
    ];

    for (const topic of nurtureTopics) {
      const contact = makeContact({ personalityType: 'Driver' });
      const draft = generateNurtureDraft(contact, topic);
      const lowerBody = draft.body.toLowerCase();

      const hasRelevantKeyword = relevantKeywords.some((keyword) =>
        lowerBody.includes(keyword),
      );

      expect(hasRelevantKeyword).toBe(true);
    }
  });
});

describe('PERSONALITY_DESCRIPTIONS', () => {
  it('has entries for all five personality types', () => {
    for (const type of personalityTypes) {
      expect(PERSONALITY_DESCRIPTIONS[type]).toBeDefined();
      expect(typeof PERSONALITY_DESCRIPTIONS[type]).toBe('string');
      expect(PERSONALITY_DESCRIPTIONS[type].length).toBeGreaterThan(0);
    }
  });
});
