import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  PersonalityType,
  PersonalityResult,
  ResearchResult,
  ConfidenceLevel,
} from '@/types';

function getEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
  } catch { /* ignore */ }
  return undefined;
}

export const PERSONALITY_KEYWORD_MAP: Record<PersonalityType, string[]> = {
  Driver: [
    'CEO',
    'founder',
    'president',
    'managing director',
    'aggressive growth',
    'results-driven',
    'bottom line',
    'competitive',
    'decisive',
    'direct',
    'fast-paced',
    'goal-oriented',
    'take charge',
    'no-nonsense',
    'demanding',
    'entrepreneurial',
    'high-energy',
    'impatient',
    'action-oriented',
    'dominant',
  ],
  Analytical: [
    'engineer',
    'CTO',
    'analyst',
    'researcher',
    'data-driven',
    'methodical',
    'systematic',
    'detail-oriented',
    'precise',
    'thorough',
    'cautious',
    'logical',
    'technical',
    'quality-focused',
    'process-oriented',
    'perfectionist',
    'studious',
    'meticulous',
    'calculated',
    'scientific',
  ],
  Expressive: [
    'marketing',
    'creative director',
    'brand',
    'visionary',
    'innovative',
    'enthusiastic',
    'charismatic',
    'storyteller',
    'passionate',
    'energetic',
    'dynamic',
    'inspiring',
    'outgoing',
    'persuasive',
    'big picture',
    'spontaneous',
    'collaborative',
    'animated',
    'optimistic',
    'people person',
  ],
  Amiable: [
    'HR',
    'human resources',
    'team lead',
    'supportive',
    'patient',
    'loyal',
    'dependable',
    'cooperative',
    'relationship-focused',
    'consensus',
    'harmonious',
    'steady',
    'reliable',
    'empathetic',
    'good listener',
    'diplomatic',
    'nurturing',
    'accommodating',
    'trusting',
    'warm',
  ],
  Balanced: [],
};

const SEARCH_DELAY_MS = 1000;
const SEARCH_TIMEOUT_MS = 10000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchContact(
  name: string,
  company: string
): Promise<string[]> {
  const snippets: string[] = [];
  const query = `${name} ${company}`.trim();

  if (!query) {
    return snippets;
  }

  const searchApiKey = process.env.SEARCH_API_KEY;
  const searchApiUrl = process.env.SEARCH_API_URL;

  try {
    if (searchApiKey && searchApiUrl) {
      // Use configured search API
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        SEARCH_TIMEOUT_MS
      );

      try {
        const response = await fetch(
          `${searchApiUrl}?q=${encodeURIComponent(query)}&key=${encodeURIComponent(searchApiKey)}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }
        );

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const results = data.results || data.items || data.organic || [];
          for (const result of results.slice(0, 5)) {
            const snippet =
              result.snippet || result.description || result.content || '';
            if (snippet) {
              snippets.push(snippet);
            }
          }
        }
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Search API request timed out');
        } else {
          throw error;
        }
      }
    } else {
      // Fallback to DuckDuckGo HTML search
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        SEARCH_TIMEOUT_MS
      );

      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(ddgUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html',
          },
        });

        clearTimeout(timeout);

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          $('.result__snippet')
            .slice(0, 5)
            .each((_i, el) => {
              const text = $(el).text().trim();
              if (text) {
                snippets.push(text);
              }
            });
        }
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('DuckDuckGo search request timed out');
        } else {
          throw error;
        }
      }

      // Respect rate limiting
      await delay(SEARCH_DELAY_MS);
    }
  } catch (error) {
    console.warn(
      'Web search failed:',
      error instanceof Error ? error.message : error
    );
  }

  return snippets;
}

function classifyByKeywords(
  researchText: string
): { type: PersonalityType; confidence: ConfidenceLevel } {
  const lowerText = researchText.toLowerCase();
  const scores: Record<PersonalityType, number> = {
    Driver: 0,
    Analytical: 0,
    Expressive: 0,
    Amiable: 0,
    Balanced: 0,
  };

  for (const [type, keywords] of Object.entries(PERSONALITY_KEYWORD_MAP)) {
    if (type === 'Balanced') continue;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[type as PersonalityType]++;
      }
    }
  }

  let bestType: PersonalityType = 'Balanced';
  let bestScore = 0;
  let tieCount = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (type === 'Balanced') continue;
    if (score > bestScore) {
      bestScore = score;
      bestType = type as PersonalityType;
      tieCount = 1;
    } else if (score === bestScore && score > 0) {
      tieCount++;
    }
  }

  // If there is a tie, default to Balanced
  if (tieCount > 1) {
    bestType = 'Balanced';
  }

  let confidence: ConfidenceLevel;
  if (bestScore >= 3) {
    confidence = 'medium';
  } else if (bestScore >= 1) {
    confidence = 'low';
  } else {
    confidence = 'none';
  }

  return { type: bestType, confidence };
}

const PERSONALITY_PROMPT = (name: string, company: string, researchText: string, rawCardText?: string) => {
  const companyLabel = company || 'unknown company';

  let contextBlock = '';

  if (rawCardText) {
    contextBlock += `\nBusiness card text (OCR):\n${rawCardText}\n`;
  }

  if (researchText) {
    contextBlock += `\nWeb research text:\n${researchText}\n`;
  }

  if (!contextBlock.trim()) {
    contextBlock = '\nNo additional information available. Classify based on the name and company only, or return Balanced if insufficient.\n';
  }

  return `Based on the following information about ${name} from ${companyLabel}, classify their personality type using the DISC-inspired framework below.

IMPORTANT: Pay close attention to their JOB TITLE on the business card. The job title is one of the strongest indicators of personality type:
- Operations Manager, VP Operations, COO, General Manager → typically Driver
- Engineer, Analyst, Controller, Quality Manager, IT Director → typically Analytical
- Sales Manager, Marketing Director, Business Development, Creative Director → typically Expressive
- HR Manager, Customer Service, Office Manager, Administrative, Coordinator → typically Amiable

Personality Types:
- Driver: Results-oriented, decisive, competitive, direct, fast-paced. Prefers efficiency and control. Typical roles: CEO, founder, owner, executive, operations manager, VP, general manager, director of operations.
- Analytical: Detail-oriented, systematic, data-driven, cautious, methodical. Values accuracy and process. Typical roles: engineer, analyst, CTO, researcher, controller, quality manager, IT director.
- Expressive: Enthusiastic, creative, visionary, outgoing, persuasive. Values relationships and big ideas. Typical roles: marketing director, creative director, sales leader, business development, VP sales.
- Amiable: Supportive, patient, cooperative, relationship-focused, steady. Values harmony and trust. Typical roles: HR manager, team lead, customer service, office manager, coordinator, administrative.
- Balanced: No clear dominant type or insufficient information to classify.
${contextBlock}
Respond with ONLY valid JSON in this exact format:
{
  "personalityType": "Driver|Analytical|Expressive|Amiable|Balanced",
  "confidence": "high|medium|low|none",
  "summary": "2-3 sentence explanation of the classification"
}`;
};

function parsePersonalityJSON(content: string): PersonalityResult | null {
  try {
    let jsonStr = content.trim();
    const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) jsonStr = jsonBlockMatch[1].trim();
    // Also try to extract JSON object from surrounding text
    const jsonObjMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjMatch) jsonStr = jsonObjMatch[0];

    const parsed = JSON.parse(jsonStr);
    const validTypes: PersonalityType[] = ['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced'];
    const validConfidences: ConfidenceLevel[] = ['high', 'medium', 'low', 'none'];

    return {
      personalityType: validTypes.includes(parsed.personalityType) ? parsed.personalityType : 'Balanced',
      confidence: validConfidences.includes(parsed.confidence) ? parsed.confidence : 'low',
      summary: String(parsed.summary || 'Classified via LLM analysis.'),
    };
  } catch {
    return null;
  }
}

async function classifyWithAnthropic(
  name: string, company: string, researchText: string, rawCardText?: string
): Promise<PersonalityResult | null> {
  const apiKey = getEnvVar('ANTHROPIC_API_KEY');
  if (!apiKey) return null;

  try {
    console.log('[Research] Classifying personality with Claude...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: PERSONALITY_PROMPT(name, company, researchText, rawCardText),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[Research] Anthropic API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    console.log(`[Research] Claude classification: ${content.substring(0, 200)}`);
    return parsePersonalityJSON(content);
  } catch (error) {
    console.warn('[Research] Anthropic classification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function classifyWithOpenAI(
  name: string, company: string, researchText: string, rawCardText?: string
): Promise<PersonalityResult | null> {
  const apiKey = getEnvVar('LLM_API_KEY');
  const baseUrl = getEnvVar('LLM_BASE_URL');
  if (!apiKey || !baseUrl) return null;

  try {
    console.log('[Research] Classifying personality with OpenAI...');
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getEnvVar('LLM_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a personality analysis assistant. Classify people based on research text using the DISC-inspired framework. Return only valid JSON.',
          },
          { role: 'user', content: PERSONALITY_PROMPT(name, company, researchText, rawCardText) },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    return parsePersonalityJSON(content);
  } catch (error) {
    console.warn('[Research] OpenAI classification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function classifyPersonality(
  name: string,
  company: string,
  researchText: string,
  rawCardText?: string
): Promise<PersonalityResult> {
  // 1. Try Anthropic Claude
  const anthropicResult = await classifyWithAnthropic(name, company, researchText, rawCardText);
  if (anthropicResult) return anthropicResult;

  // 2. Try OpenAI-compatible API
  const openaiResult = await classifyWithOpenAI(name, company, researchText, rawCardText);
  if (openaiResult) return openaiResult;

  // 3. Fallback: keyword-based heuristic
  console.log('[Research] No LLM configured, using keyword heuristic');
  const { type, confidence } = classifyByKeywords(researchText);

  let summary: string;
  if (type === 'Balanced') {
    summary = 'Insufficient distinguishing signals found in available research. Defaulting to Balanced profile.';
  } else {
    summary = `Keyword analysis of available research suggests a ${type} personality profile based on role indicators and language patterns.`;
  }

  return { personalityType: type, confidence, summary };
}

export async function researchContact(
  name: string,
  company: string,
  rawCardText?: string
): Promise<ResearchResult> {
  try {
    // Step 1: Search for information about the contact (only if we have company)
    const snippets = company ? await searchContact(name, company) : [];
    const researchText = snippets.join(' ').trim();

    // Step 2: Classify personality based on research + business card text
    const personalityResult = await classifyPersonality(
      name,
      company,
      researchText,
      rawCardText
    );

    // Truncate research snippets to 2000 characters
    const truncatedSnippets =
      researchText.length > 2000
        ? researchText.slice(0, 2000) + '...'
        : researchText;

    return {
      ...personalityResult,
      researchSnippets: truncatedSnippets,
    };
  } catch (error) {
    console.error(
      'Research contact failed:',
      error instanceof Error ? error.message : error
    );

    // Always return a valid result, defaulting to Balanced on failure
    return {
      personalityType: 'Balanced',
      confidence: 'none',
      summary:
        'Research could not be completed. Defaulting to Balanced personality profile.',
      researchSnippets: '',
    };
  }
}
