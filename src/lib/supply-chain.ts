import * as cheerio from 'cheerio';
import type { ProspectResult, ConfidenceLevel } from '@/types';
import {
  COMBILIFT_PRODUCTS,
  FLORIDA_INDUSTRIES,
  matchProductToIndustry,
} from '@/lib/combilift-knowledge';

const SEARCH_TIMEOUT_MS = 10000;
const SEARCH_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assessCombiliftFit(
  companyDesc: string,
  industry: string
): { product: string; rationale: string } {
  const combined = `${companyDesc} ${industry}`.toLowerCase();

  // Strong keyword signals that map directly to specific products
  const strongSignals: Record<string, string[]> = {
    'Straddle-Carrier': ['precast', 'heavy panel', 'oversized load', 'modular building', 'gantry', 'straddle', 'shipyard', 'wind energy'],
    'Aisle-Master': ['cold storage', 'narrow aisle', 'pallet position', 'distribution center', 'fulfillment', '3pl', 'cold chain', 'freezer', 'beverage distribut', 'e-commerce'],
    'Combi-CS': ['intermodal', 'container depot', 'port logistics', 'container stack', 'reach stacker'],
    'Combi-WR': ['retail backroom', 'small warehouse', 'manufacturing cell', 'pedestrian', 'walk-behind'],
  };

  for (const [productName, signals] of Object.entries(strongSignals)) {
    for (const signal of signals) {
      if (combined.includes(signal)) {
        const product = COMBILIFT_PRODUCTS[productName];
        return {
          product: productName,
          rationale: `${productName} is well-suited for this operation: ${product.keyBenefit}`,
        };
      }
    }
  }

  // General keyword matching across idealFor arrays
  let bestProduct = 'C-Series';
  let bestScore = 0;

  for (const [productName, product] of Object.entries(COMBILIFT_PRODUCTS)) {
    let score = 0;
    for (const term of product.idealFor) {
      const lowerTerm = term.toLowerCase();
      if (combined.includes(lowerTerm)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestProduct = productName;
    }
  }

  const product = COMBILIFT_PRODUCTS[bestProduct];
  const rationale =
    bestScore > 0
      ? `${bestProduct} is well-suited for this company: ${product.keyBenefit}`
      : `${bestProduct} (general recommendation) is a versatile starting point: ${product.keyBenefit}`;

  return { product: bestProduct, rationale };
}

async function searchWeb(query: string): Promise<string[]> {
  const snippets: string[] = [];

  const searchApiKey = process.env.SEARCH_API_KEY;
  const searchApiUrl = process.env.SEARCH_API_URL;

  try {
    if (searchApiKey && searchApiUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

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
          for (const result of results.slice(0, 10)) {
            const snippet =
              result.snippet || result.description || result.content || '';
            const title = result.title || '';
            const link = result.link || result.url || '';
            if (snippet || title) {
              snippets.push(`${title} - ${snippet} ${link}`.trim());
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

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

          $('.result').slice(0, 10).each((_i, el) => {
            const title = $(el).find('.result__title').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            const link = $(el).find('.result__url').text().trim();
            if (snippet || title) {
              snippets.push(`${title} - ${snippet} ${link}`.trim());
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

      await delay(SEARCH_DELAY_MS);
    }
  } catch (error) {
    console.warn(
      'Supply chain web search failed:',
      error instanceof Error ? error.message : error
    );
  }

  return snippets;
}

function extractCompanyMentions(
  snippets: string[],
  excludeCompany: string
): Array<{
  companyName: string;
  context: string;
  isFloridaMention: boolean;
}> {
  const mentions: Array<{
    companyName: string;
    context: string;
    isFloridaMention: boolean;
  }> = [];
  const seen = new Set<string>();
  const excludeLower = excludeCompany.toLowerCase();

  const floridaPatterns =
    /\b(?:Florida|FL|Miami|Orlando|Tampa|Jacksonville|Fort Lauderdale|St\.? Petersburg|Clearwater|Sarasota|Naples|Fort Myers|Tallahassee|Gainesville|Daytona|Ocala|Lakeland|Palm Beach|Boca Raton|Hollywood|Hialeah|Port St\.? Lucie|Cape Coral|Pensacola)\b/i;

  // Simple company name extraction: look for capitalized multi-word patterns that might be company names
  const companyPattern =
    /(?:[A-Z][a-zA-Z&'.]+(?:\s+[A-Z][a-zA-Z&'.]+){0,4})\s*(?:Inc\.?|LLC|Corp\.?|Ltd\.?|Co\.|Corporation|Incorporated|Group|Holdings|Logistics|Distribution|Supply|Warehouse|Manufacturing|Industries|Enterprises?|Services|Solutions|Partners?)/g;

  for (const snippet of snippets) {
    const matches = snippet.match(companyPattern) || [];
    const isFloridaSnippet = floridaPatterns.test(snippet);

    for (const match of matches) {
      const cleaned = match.trim();
      const cleanedLower = cleaned.toLowerCase();

      if (
        cleanedLower.includes(excludeLower) ||
        excludeLower.includes(cleanedLower) ||
        seen.has(cleanedLower) ||
        cleaned.length < 3
      ) {
        continue;
      }

      seen.add(cleanedLower);
      mentions.push({
        companyName: cleaned,
        context: snippet.slice(0, 200),
        isFloridaMention: isFloridaSnippet,
      });
    }
  }

  return mentions;
}

function inferRelationship(
  context: string,
  sourceCompany: string
): { relationship: string; relationshipDesc: string } {
  const lower = context.toLowerCase();

  if (
    lower.includes('supplier') ||
    lower.includes('supplies') ||
    lower.includes('raw material') ||
    lower.includes('vendor')
  ) {
    return {
      relationship: 'supplier',
      relationshipDesc: `Potential supplier in the same supply chain as ${sourceCompany}`,
    };
  }

  if (
    lower.includes('customer') ||
    lower.includes('client') ||
    lower.includes('buyer') ||
    lower.includes('purchas')
  ) {
    return {
      relationship: 'customer',
      relationshipDesc: `Potential customer or buyer related to ${sourceCompany}`,
    };
  }

  if (
    lower.includes('logistics') ||
    lower.includes('shipping') ||
    lower.includes('freight') ||
    lower.includes('transport') ||
    lower.includes('3pl') ||
    lower.includes('warehouse')
  ) {
    return {
      relationship: 'logistics_partner',
      relationshipDesc: `Logistics or warehousing partner in the same network as ${sourceCompany}`,
    };
  }

  if (
    lower.includes('distribut') ||
    lower.includes('wholesale')
  ) {
    return {
      relationship: 'distributor',
      relationshipDesc: `Distributor or wholesale partner connected to ${sourceCompany}`,
    };
  }

  if (
    lower.includes('sister') ||
    lower.includes('subsidiary') ||
    lower.includes('division') ||
    lower.includes('branch') ||
    lower.includes('facility')
  ) {
    return {
      relationship: 'sibling_facility',
      relationshipDesc: `Related facility or division of ${sourceCompany}`,
    };
  }

  return {
    relationship: 'industry_peer',
    relationshipDesc: `Industry peer operating in the same sector as ${sourceCompany}`,
  };
}

function determineBestIndustry(context: string): string {
  const lower = context.toLowerCase();

  for (const industry of FLORIDA_INDUSTRIES) {
    const keywords = industry.toLowerCase().split(/[\s&]+/);
    const matchCount = keywords.filter((kw) => kw.length > 2 && lower.includes(kw)).length;
    if (matchCount >= 2 || (keywords.length === 1 && lower.includes(keywords[0]))) {
      return industry;
    }
  }

  return 'General Industrial';
}

export async function researchSupplyChain(
  company: string,
  industryVertical: string | null
): Promise<ProspectResult[]> {
  const results: ProspectResult[] = [];
  const industry = industryVertical || 'industrial supply chain';

  try {
    // Run multiple search queries to find supply chain connections
    const queries = [
      `"${company}" supply chain partners Florida`,
      `"${company}" suppliers distributors ${industry}`,
      `${industry} companies Florida warehouse logistics`,
    ];

    const allSnippets: string[] = [];

    for (const query of queries) {
      const snippets = await searchWeb(query);
      allSnippets.push(...snippets);
    }

    // Extract company mentions from search results
    const mentions = extractCompanyMentions(allSnippets, company);

    // Prioritize Florida mentions
    const floridaMentions = mentions.filter((m) => m.isFloridaMention);
    const otherMentions = mentions.filter((m) => !m.isFloridaMention);
    const sortedMentions = [...floridaMentions, ...otherMentions];

    for (const mention of sortedMentions.slice(0, 10)) {
      const { relationship, relationshipDesc } = inferRelationship(
        mention.context,
        company
      );

      const mentionIndustry = determineBestIndustry(mention.context);
      const keywords = mention.context
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const productMatch = matchProductToIndustry(mentionIndustry, keywords);
      const fit = assessCombiliftFit(mention.context, mentionIndustry);

      const confidence: ConfidenceLevel = mention.isFloridaMention
        ? 'medium'
        : 'low';

      results.push({
        companyName: mention.companyName,
        relationship,
        relationshipDesc,
        location: mention.isFloridaMention ? 'Florida' : 'Unknown',
        industry: mentionIndustry,
        combiliftFit: fit.rationale,
        combiliftProduct: productMatch,
        confidence,
      });
    }
  } catch (error) {
    console.error(
      'Supply chain research failed:',
      error instanceof Error ? error.message : error
    );
  }

  // Ensure at least 3 results; pad with low-confidence suggestions if needed
  while (results.length < 3) {
    const paddingIndex = results.length;
    const suggestedIndustries = [
      'Third-Party Logistics (3PL)',
      'Cold Storage & Refrigerated Warehousing',
      'Building Materials & Lumber',
      'Retail & Wholesale Distribution',
      'Construction & Infrastructure',
    ];

    const suggestedIndustry =
      suggestedIndustries[paddingIndex % suggestedIndustries.length];
    const fit = assessCombiliftFit(suggestedIndustry, suggestedIndustry);
    const productMatch = matchProductToIndustry(suggestedIndustry, [
      suggestedIndustry.toLowerCase(),
    ]);

    results.push({
      companyName: `[Suggested: ${suggestedIndustry} company in Florida]`,
      relationship: 'industry_peer',
      relationshipDesc: `Explore ${suggestedIndustry} companies in Florida as potential Combilift prospects`,
      location: 'Florida',
      industry: suggestedIndustry,
      combiliftFit: fit.rationale,
      combiliftProduct: productMatch,
      confidence: 'low',
    });
  }

  return results;
}
