import { describe, it, expect } from 'vitest';
import { classifyPersonality, PERSONALITY_KEYWORD_MAP } from '../research';

describe('classifyPersonality (keyword heuristic)', () => {
  it('classifies Driver personality from executive leadership text', async () => {
    const driverText =
      'CEO and founder of a fast-growing company. Led revenue growth from $1M to $50M. Strategic leader focused on results and scaling operations. P&L responsibility for the southeast region.';

    const result = await classifyPersonality('Test Person', 'Test Co', driverText);

    expect(result.personalityType).toBe('Driver');
  });

  it('classifies Analytical personality from technical / research text', async () => {
    const analyticalText =
      'Senior engineer with a PhD in data science. Leads technical research and systems architecture. Published multiple papers on metrics analysis. Detail-oriented approach to warehouse optimization.';

    const result = await classifyPersonality('Test Person', 'Test Co', analyticalText);

    expect(result.personalityType).toBe('Analytical');
  });

  it('classifies Expressive personality from creative / visionary text', async () => {
    const expressiveText =
      'Award-winning creative director and keynote speaker. Known as a visionary innovator in the logistics space. Hosts a popular industry podcast. Passionate about brand building and community engagement.';

    const result = await classifyPersonality('Test Person', 'Test Co', expressiveText);

    expect(result.personalityType).toBe('Expressive');
  });

  it('classifies Amiable personality from collaborative / people-focused text', async () => {
    const amiableText =
      'Supportive HR team lead known for being patient and dependable. Relationship-focused leader who builds consensus across departments. Empathetic and nurturing manager who creates a harmonious and cooperative workplace.';

    const result = await classifyPersonality('Test Person', 'Test Co', amiableText);

    expect(result.personalityType).toBe('Amiable');
  });

  it('returns Balanced with confidence "none" for empty research text', async () => {
    const result = await classifyPersonality('Unknown', 'Unknown Co', '');

    expect(result.personalityType).toBe('Balanced');
    expect(result.confidence).toBe('none');
  });
});

describe('classifyPersonality (error handling)', () => {
  it('never throws for various inputs', async () => {
    // Increased timeout: this test makes multiple API calls to Claude
    const inputs: [string, string, string][] = [
      ['', '', ''],
      ['Name Only', '', ''],
      ['A', 'B', 'random words with no personality signals whatsoever'],
      ['Test', 'Co', 'a'.repeat(10000)],
      [
        'Test',
        'Co',
        'CEO founder engineer creative director team lead analytical data-driven visionary supportive',
      ],
    ];

    for (const [name, company, text] of inputs) {
      await expect(
        classifyPersonality(name, company, text),
      ).resolves.toBeDefined();
    }
  }, 60000);
});

describe('PERSONALITY_KEYWORD_MAP', () => {
  it('contains all five personality types', () => {
    expect(Object.keys(PERSONALITY_KEYWORD_MAP)).toEqual(
      expect.arrayContaining(['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced']),
    );
  });

  it('has non-empty keyword arrays for the four non-Balanced types', () => {
    for (const type of ['Driver', 'Analytical', 'Expressive', 'Amiable'] as const) {
      expect(PERSONALITY_KEYWORD_MAP[type].length).toBeGreaterThan(0);
    }
  });
});
