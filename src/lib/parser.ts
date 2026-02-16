import type { ParsedContact } from '@/types';

const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/;

const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;

const COMPANY_SUFFIXES_REGEX =
  /\b(?:Inc\.?|LLC|Corp\.?|Ltd\.?|Co\.|Corporation|Incorporated|Limited|Group|Holdings|Enterprises?|Associates?|Partners?|Solutions|Services|Technologies|Industries|Consulting|Construction|Electric(?:al)?|Plumbing|Roofing|Mechanical|Engineering|Logistics|Transport(?:ation)?|Supply|Distribution|Manufacturing)\b/i;

const STATE_ABBREVS =
  /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;

const ZIP_REGEX = /\b\d{5}(?:-\d{4})?\b/;

const STREET_PATTERNS =
  /\b(?:St\.?|Street|Ave\.?|Avenue|Blvd\.?|Boulevard|Rd\.?|Road|Dr\.?|Drive|Ln\.?|Lane|Ct\.?|Court|Way|Pl\.?|Place|Cir\.?|Circle|Pkwy\.?|Parkway|Hwy\.?|Highway|Suite|Ste\.?|Floor|Fl\.?|Unit|#)\b/i;

// Title/role keywords to help identify name vs title lines
const TITLE_KEYWORDS =
  /\b(?:President|CEO|CFO|COO|CTO|VP|Vice\s+President|Director|Manager|Supervisor|Coordinator|Owner|Founder|Partner|Principal|Superintendent|Foreman|Estimator|Broker|Agent|Representative|Rep|Sales|Marketing|Engineer|Technician|Specialist|Consultant|Advisor|Administrator|Secretary|Assistant|Analyst|Developer|Designer|Architect)\b/i;

function isEmailLine(line: string): boolean {
  return EMAIL_REGEX.test(line);
}

function isPhoneLine(line: string): boolean {
  return PHONE_REGEX.test(line);
}

function isCompanyLine(line: string): boolean {
  return COMPANY_SUFFIXES_REGEX.test(line);
}

function isAddressLine(line: string): boolean {
  return (
    STATE_ABBREVS.test(line) ||
    ZIP_REGEX.test(line) ||
    STREET_PATTERNS.test(line)
  );
}

function isTitleLine(line: string): boolean {
  return TITLE_KEYWORDS.test(line);
}

/**
 * Clean up an address string by removing common OCR artifacts
 */
function cleanAddress(addr: string): string {
  return addr
    .replace(/[=|£€¥¢~`]/g, '')
    .replace(/\s*,\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();
}

/**
 * Score how likely a line is a person's name (higher = more likely).
 */
function nameScore(line: string): number {
  let score = 0;
  const words = line.split(/\s+/).filter((w) => w.length > 0);

  // Names typically have 2-4 words
  if (words.length >= 2 && words.length <= 4) score += 3;
  else if (words.length === 1 && line.length > 2) score += 1;

  // All words start with uppercase
  const allCaps = words.every((w) => /^[A-Z]/.test(w));
  if (allCaps) score += 2;

  // Words are mostly alphabetic
  const alphaWords = words.filter((w) => /^[A-Za-z.''\-]+$/.test(w));
  if (alphaWords.length === words.length) score += 3;

  // No digits
  if (!/\d/.test(line)) score += 2;

  // Not too long (names are usually under 40 chars)
  if (line.length <= 40) score += 1;

  // Penalize if it looks like a title/role
  if (isTitleLine(line)) score -= 3;

  // Penalize if it contains special characters common in OCR noise
  if (/[=|£€¥¢~`#@]/.test(line)) score -= 3;

  return score;
}

export function parseContactFields(rawText: string): ParsedContact {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let email = '';
  let phone = '';
  let name = '';
  let company = '';
  let address = '';
  let title = '';

  // Extract email
  for (const line of lines) {
    const emailMatch = line.match(EMAIL_REGEX);
    if (emailMatch) {
      email = emailMatch[0].toLowerCase();
      break;
    }
  }

  // Extract phone (can appear multiple times — take the first)
  for (const line of lines) {
    const phoneMatch = line.match(PHONE_REGEX);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/[^\d+]/g, '');
      // Re-format
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) {
        phone = `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
      } else if (digits.length === 10) {
        phone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 7) {
        phone = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      }
      break;
    }
  }

  // Extract company (look for lines with company suffixes)
  for (const line of lines) {
    if (isCompanyLine(line)) {
      company = line;
      break;
    }
  }

  // Extract address (combine address-looking lines)
  const addressLines: string[] = [];
  for (const line of lines) {
    if (isAddressLine(line)) {
      addressLines.push(line);
    }
  }
  if (addressLines.length > 0) {
    address = cleanAddress(addressLines.join(', '));
  }

  // Find title line (for context, not stored)
  for (const line of lines) {
    if (isTitleLine(line) && !isCompanyLine(line)) {
      title = line;
      break;
    }
  }

  // Extract name: score each candidate line
  const usedLines = new Set<string>();
  if (email) {
    for (const line of lines) {
      if (isEmailLine(line)) usedLines.add(line);
    }
  }
  if (phone) {
    for (const line of lines) {
      if (isPhoneLine(line)) usedLines.add(line);
    }
  }
  if (company) usedLines.add(company);
  for (const line of addressLines) usedLines.add(line);

  // Score all remaining lines as potential names
  let bestName = '';
  let bestScore = -999;

  for (const line of lines) {
    if (usedLines.has(line)) continue;
    const score = nameScore(line);
    if (score > bestScore) {
      bestScore = score;
      bestName = line;
    }
  }

  if (bestScore >= 3) {
    name = bestName;
  } else if (bestName) {
    // Use the best candidate even if low-confidence
    name = bestName;
  }

  // If company still not found, try lines that aren't name/email/phone/address
  if (!company) {
    for (const line of lines) {
      if (
        line !== name &&
        !usedLines.has(line) &&
        !isTitleLine(line) &&
        line.length > 1
      ) {
        company = line;
        break;
      }
    }
  }

  return { name, email, phone, company, address };
}

export async function parseContactFieldsWithLLM(
  rawText: string
): Promise<ParsedContact> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new Error('LLM_API_KEY and LLM_BASE_URL must be set');
  }

  const prompt = `Extract contact information from this business card text. Return ONLY valid JSON with these exact fields:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "company": "company name",
  "address": "full address"
}

If a field is not found, use an empty string. Do not include any explanation or markdown formatting.

Business card text:
${rawText}`;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise data extraction assistant. Extract contact fields from business card text and return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  // Try to parse JSON from the response, handling possible markdown code blocks
  let jsonStr = content.trim();
  const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  return {
    name: String(parsed.name || ''),
    email: String(parsed.email || ''),
    phone: String(parsed.phone || ''),
    company: String(parsed.company || ''),
    address: String(parsed.address || ''),
  };
}

function computeConfidence(
  fields: ParsedContact
): Record<keyof ParsedContact, 'high' | 'low'> {
  return {
    name:
      fields.name && /^[A-Za-z.''\-\s]+$/.test(fields.name) && fields.name.split(/\s+/).length >= 2
        ? 'high'
        : 'low',
    email: fields.email && EMAIL_REGEX.test(fields.email) ? 'high' : 'low',
    phone: fields.phone && fields.phone.replace(/\D/g, '').length >= 7 ? 'high' : 'low',
    company: fields.company && COMPANY_SUFFIXES_REGEX.test(fields.company)
      ? 'high'
      : fields.company
        ? 'low'
        : 'low',
    address:
      fields.address &&
      (STATE_ABBREVS.test(fields.address) || ZIP_REGEX.test(fields.address))
        ? 'high'
        : 'low',
  };
}

export async function parseBusinessCard(rawText: string): Promise<{
  fields: ParsedContact;
  confidence: Record<keyof ParsedContact, 'high' | 'low'>;
}> {
  let fields: ParsedContact;

  // Try LLM-based parsing first if configured
  const llmAvailable = process.env.LLM_API_KEY && process.env.LLM_BASE_URL;

  if (llmAvailable) {
    try {
      fields = await parseContactFieldsWithLLM(rawText);
      const confidence = computeConfidence(fields);
      return { fields, confidence };
    } catch (error) {
      console.warn(
        'LLM parsing failed, falling back to rules-based parser:',
        error instanceof Error ? error.message : error
      );
    }
  }

  // Fall back to rules-based parsing
  fields = parseContactFields(rawText);
  const confidence = computeConfidence(fields);

  return { fields, confidence };
}
