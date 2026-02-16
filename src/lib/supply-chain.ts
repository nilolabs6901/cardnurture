import type { ProspectResult, ConfidenceLevel } from '@/types';
import {
  COMBILIFT_PRODUCTS,
  matchProductToIndustry,
} from '@/lib/combilift-knowledge';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load env vars directly from .env file since Next.js API routes
 * sometimes don't receive custom env vars through process.env.
 */
function getEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (match) {
      return match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env file not found
  }
  return undefined;
}

export function assessCombiliftFit(
  companyDesc: string,
  industry: string
): { product: string; rationale: string } {
  const combined = `${companyDesc} ${industry}`.toLowerCase();

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

  let bestProduct = 'C-Series';
  let bestScore = 0;

  for (const [productName, product] of Object.entries(COMBILIFT_PRODUCTS)) {
    let score = 0;
    for (const term of product.idealFor) {
      if (combined.includes(term.toLowerCase())) {
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

// Build a compact product summary for the prompt
function getCombiliftProductSummary(): string {
  return Object.entries(COMBILIFT_PRODUCTS)
    .map(([name, p]) => `- ${name}: ${p.description} Ideal for: ${p.idealFor.slice(0, 6).join(', ')}`)
    .join('\n');
}

/**
 * Use Claude to intelligently research and generate supply chain prospects
 * based on the contact's company, industry, and Combilift product knowledge.
 */
async function researchWithClaude(
  company: string,
  industry: string,
  contactName: string,
  contactTitle: string
): Promise<ProspectResult[]> {
  const apiKey = getEnvVar('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('[SupplyChain] No ANTHROPIC_API_KEY, cannot research with Claude');
    return [];
  }

  const productSummary = getCombiliftProductSummary();

  const prompt = `You are a Combilift sales intelligence assistant. Given a contact and their company, identify 3-5 REAL companies in their supply chain, local market, or industry network that would be strong prospects for Combilift material handling equipment.

CONTACT INFO:
- Name: ${contactName}
- Title: ${contactTitle}
- Company: ${company}
- Industry: ${industry}

COMBILIFT PRODUCTS:
${productSummary}

INSTRUCTIONS:
1. Think about what types of companies ${company} works with: their suppliers, customers, logistics partners, distributors, and industry peers.
2. Identify 3-5 REAL, SPECIFIC companies (not generic placeholders) that operate in related industries and would benefit from Combilift equipment.
3. Focus on companies that handle physical goods, have warehouses, yards, or distribution centers.
4. For each prospect, recommend the most relevant Combilift product based on their operations.
5. NEVER include ${company} itself as a prospect.
6. Be realistic about the relationship type and location if known.

Return ONLY valid JSON array with NO markdown formatting, code fences, or explanation. Each object must have:
{
  "companyName": "Real Company Name",
  "relationship": "supplier|customer|logistics_partner|distributor|industry_peer",
  "relationshipDesc": "Brief description of how they relate to ${company}",
  "location": "City, State or region if known, otherwise 'United States'",
  "industry": "Their industry",
  "combiliftProduct": "C-Series|Aisle-Master|Straddle-Carrier|Combi-CS|Combi-WR",
  "combiliftFit": "Why this Combilift product fits their operations",
  "confidence": "high|medium|low"
}`;

  try {
    console.log(`[SupplyChain] Researching prospects for ${company} via Claude...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[SupplyChain] Claude API error: ${response.status} - ${errText}`);
      return [];
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    console.log(`[SupplyChain] Claude response (${text.length} chars)`);

    // Parse JSON from response, handling possible markdown code blocks
    let jsonStr = text.trim();
    const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
    }

    const prospects: any[] = JSON.parse(jsonStr);

    // Validate and normalize results
    return prospects
      .filter((p: any) => p.companyName && p.companyName.toLowerCase() !== company.toLowerCase())
      .slice(0, 5)
      .map((p: any) => ({
        companyName: String(p.companyName || ''),
        relationship: String(p.relationship || 'industry_peer'),
        relationshipDesc: String(p.relationshipDesc || ''),
        location: String(p.location || 'United States'),
        industry: String(p.industry || 'General Industrial'),
        combiliftFit: String(p.combiliftFit || ''),
        combiliftProduct: String(p.combiliftProduct || 'C-Series'),
        confidence: (['high', 'medium', 'low'].includes(p.confidence) ? p.confidence : 'medium') as ConfidenceLevel,
      }));
  } catch (error) {
    console.error('[SupplyChain] Claude research failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function researchSupplyChain(
  company: string,
  industryVertical: string | null,
  contactName?: string,
  contactTitle?: string
): Promise<ProspectResult[]> {
  const industry = industryVertical || 'industrial supply chain';

  // Use Claude for intelligent prospect research
  const results = await researchWithClaude(
    company,
    industry,
    contactName || '',
    contactTitle || ''
  );

  if (results.length > 0) {
    return results;
  }

  // Fallback: generate generic industry suggestions if Claude fails
  console.warn('[SupplyChain] Claude returned no results, generating fallback suggestions');
  const fallbackResults: ProspectResult[] = [];
  const fallbackIndustries = [
    'Third-Party Logistics (3PL)',
    'Cold Storage & Refrigerated Warehousing',
    'Building Materials & Lumber',
  ];

  for (const fallbackIndustry of fallbackIndustries) {
    const fit = assessCombiliftFit(fallbackIndustry, fallbackIndustry);
    const productMatch = matchProductToIndustry(fallbackIndustry, [fallbackIndustry.toLowerCase()]);

    fallbackResults.push({
      companyName: `[Suggested: ${fallbackIndustry} company]`,
      relationship: 'industry_peer',
      relationshipDesc: `Explore ${fallbackIndustry} companies as potential Combilift prospects`,
      location: 'United States',
      industry: fallbackIndustry,
      combiliftFit: fit.rationale,
      combiliftProduct: productMatch,
      confidence: 'low',
    });
  }

  return fallbackResults;
}
