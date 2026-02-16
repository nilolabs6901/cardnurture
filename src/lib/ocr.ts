import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load env vars directly from .env file since Next.js API routes
 * sometimes don't receive custom env vars through process.env.
 */
function getEnvVar(key: string): string | undefined {
  // First try process.env
  if (process.env[key]) return process.env[key];

  // Fallback: read .env file directly
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

/**
 * Preprocess image for better OCR accuracy:
 * - Convert to grayscale
 * - Increase contrast
 * - Sharpen
 * - Normalize size
 */
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('[OCR] Preprocessing image...');
    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize()           // Auto-stretch contrast
      .sharpen({ sigma: 1.5 })
      .resize(2400, null, {  // Upscale for better OCR (width 2400px, preserve aspect)
        withoutEnlargement: false,
        fit: 'inside',
      })
      .png()
      .toBuffer();

    console.log(`[OCR] Preprocessed: ${imageBuffer.length} -> ${processed.length} bytes`);
    return processed;
  } catch (error) {
    console.warn('[OCR] Preprocessing failed, using original image:', error);
    return imageBuffer;
  }
}

/**
 * Extract text using Claude Vision API (Anthropic).
 * Returns null if not configured or fails.
 */
async function extractWithVisionAPI(imageBuffer: Buffer): Promise<string | null> {
  const apiKey = getEnvVar('ANTHROPIC_API_KEY');
  console.log('[OCR] ANTHROPIC_API_KEY check:', apiKey ? `SET (${apiKey.substring(0, 15)}...)` : 'NOT SET');
  if (!apiKey) return null;

  try {
    console.log('[OCR] Using Claude Vision API...');
    const base64Image = imageBuffer.toString('base64');

    // Detect media type from buffer magic bytes
    let mediaType = 'image/png';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      mediaType = 'image/jpeg';
    } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      mediaType = 'image/png';
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
      mediaType = 'image/webp';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Extract ALL text from this business card image. Return the text exactly as it appears on the card, preserving line breaks. Include the person's name, title, company name, phone number(s), email address, website, and physical address. Output ONLY the extracted text, nothing else.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[OCR] Vision API error: ${response.status} - ${errText}`);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    console.log(`[OCR] Vision API extracted ${text.length} chars:\n${text}`);
    return text.trim();
  } catch (error) {
    console.warn('[OCR] Vision API failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Extract text using an OpenAI-compatible Vision API.
 * Returns null if not configured or fails.
 */
async function extractWithOpenAIVision(imageBuffer: Buffer): Promise<string | null> {
  const apiKey = getEnvVar('LLM_API_KEY');
  const baseUrl = getEnvVar('LLM_BASE_URL');
  if (!apiKey || !baseUrl) return null;

  try {
    console.log('[OCR] Using OpenAI Vision API...');
    const base64Image = imageBuffer.toString('base64');

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
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: `Extract ALL text from this business card image. Return the text exactly as it appears on the card, preserving line breaks. Include the person's name, title, company name, phone number(s), email address, website, and physical address. Output ONLY the extracted text, nothing else.`,
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[OCR] OpenAI Vision API error: ${response.status} - ${errText}`);
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    console.log(`[OCR] OpenAI Vision API extracted ${text.length} chars:\n${text}`);
    return text.trim();
  } catch (error) {
    console.warn('[OCR] OpenAI Vision API failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Clean up common OCR artifacts from Tesseract output.
 */
function cleanOcrText(text: string): string {
  let cleaned = text;

  // Replace common OCR misreads for special characters
  cleaned = cleaned.replace(/[£€¥¢]/g, '');
  cleaned = cleaned.replace(/[|]/g, ' ');
  cleaned = cleaned.replace(/[=]/g, ' ');
  cleaned = cleaned.replace(/[~`]/g, '');
  cleaned = cleaned.replace(/\s*[«»]\s*/g, '');

  // Fix common OCR letter substitutions
  cleaned = cleaned.replace(/\bl\b/g, 'I');

  // Clean up multiple consecutive spaces
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // Clean up lines that are just punctuation/noise
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) return false;
      const alphaCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
      const ratio = alphaCount / line.length;
      return ratio >= 0.4 || line.includes('@');
    })
    .join('\n');

  return cleaned.trim();
}

/**
 * Extract text using Tesseract.js with preprocessed image.
 */
async function extractWithTesseract(imageBuffer: Buffer): Promise<string> {
  let worker: Tesseract.Worker | null = null;

  try {
    // Preprocess image for better Tesseract accuracy
    const processed = await preprocessImage(imageBuffer);

    console.log('[OCR] Creating Tesseract worker...');
    worker = await Tesseract.createWorker('eng', Tesseract.OEM.LSTM_ONLY, {
      logger: (m) => {
        if (m.status) {
          console.log(`[OCR] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    });

    console.log('[OCR] Starting Tesseract recognition...');
    const { data: { text } } = await worker.recognize(processed);

    console.log(`[OCR] Tesseract raw (${text.length} chars):\n${text}`);
    const cleaned = cleanOcrText(text);
    console.log(`[OCR] Tesseract cleaned (${cleaned.length} chars):\n${cleaned}`);

    return cleaned;
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch { /* ignore */ }
    }
  }
}

/**
 * Main entry point: tries Vision APIs first (much more accurate),
 * falls back to Tesseract.js.
 */
export async function extractText(imageBuffer: Buffer): Promise<string> {
  // 1. Try Anthropic Claude Vision API (best for business cards)
  const anthropicResult = await extractWithVisionAPI(imageBuffer);
  if (anthropicResult && anthropicResult.length > 5) {
    console.log('[OCR] Using Anthropic Vision result');
    return anthropicResult;
  }

  // 2. Try OpenAI-compatible Vision API
  const openaiResult = await extractWithOpenAIVision(imageBuffer);
  if (openaiResult && openaiResult.length > 5) {
    console.log('[OCR] Using OpenAI Vision result');
    return openaiResult;
  }

  // 3. Fall back to Tesseract.js with image preprocessing
  console.log('[OCR] No vision API configured, falling back to Tesseract.js');
  try {
    return await extractWithTesseract(imageBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OCR error';
    console.error('[OCR] Tesseract extraction failed:', message);
    throw new Error(`OCR extraction failed: ${message}`);
  }
}
