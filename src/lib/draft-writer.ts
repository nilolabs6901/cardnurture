/**
 * Writes the intro email from what is actually known.
 *
 * The templates left blanks — [event / location], [topic you discussed] — because
 * the app has no way to know either. This fills them from two facts typed at the
 * booth plus the research already on the contact, and asks a model to write the
 * rest.
 *
 * The rule that matters: **never claim a conversation happened.** If Kenny did not
 * record what they talked about, the email must not reference a topic. Reminding a
 * man of a chat you invented is worse than a plainer email, and it is the exact
 * failure that makes AI-written outreach recognisable.
 *
 * Falls back to the template when there is no model configured, so the feature
 * degrades to what it replaced rather than to nothing.
 */

export interface DraftInput {
  name: string;
  title?: string | null;
  company?: string | null;
  metAt?: string | null;
  metNote?: string | null;
  personalityType?: string | null;
  personalitySummary?: string | null;
  companyDescription?: string | null;
  industryVertical?: string | null;
  senderName?: string | null;
}

export interface WrittenDraft {
  subject: string;
  body: string;
}

const SYSTEM = `You write the short note a salesperson sends after meeting somebody in person.

You will be told what is known. Anything you are not told, you do not know, and you must not fill the gap.

NEVER:
- Name where you met unless you are told. Not a venue, not a city, and NOT their company — their company is where they work, not where you met them.
- Name a topic of conversation unless you are told what was discussed. You may say it was good to meet them and good to talk; you may NOT say what about.
- Say when you met. No "yesterday", no "last week", no "at the show" unless you were told.
- State a fact about their business or their problems that you were not given.
- Make a benefit claim about the product. No "maximize efficiency", no "tight spaces", no "improve workflow". With nothing specific to say, sell nothing.
- Use square brackets or placeholders.
- Write a sign-off block. End at "Best regards," and stop — the mail client adds the signature.
- Use any of: "I hope this email finds you well", "I wanted to reach out", "reach out", "circle back", "touch base", "leverage", "solutions", "in today's", or an exclamation mark.

ALWAYS:
- Plain text, American English, 40 to 85 words. Shorter is better.
- Sound like one person typing to another, not like marketing.
- Given nothing about the conversation, keep it genuinely short: good to meet them, glad to have the connection, happy to help if something comes up. That is the entire email — do not pad it into a pitch.

Return strict JSON: {"subject": "...", "body": "..."}`;

function userPrompt(i: DraftInput): string {
  const lines = [`Their name: ${i.name}`];
  if (i.title) lines.push(`Their title: ${i.title}`);
  if (i.company) lines.push(`Their company: ${i.company}`);
  if (i.industryVertical) lines.push(`Their industry: ${i.industryVertical}`);
  if (i.companyDescription) lines.push(`About the company: ${i.companyDescription.slice(0, 400)}`);
  if (i.personalitySummary) lines.push(`How they seem to communicate: ${i.personalitySummary.slice(0, 300)}`);

  if (i.metAt) lines.push(`Where we met: ${i.metAt}`);
  else lines.push(`Where we met: NOT RECORDED — do not say where you met. Open some other way.`);

  if (i.metNote) lines.push(`What we actually talked about: ${i.metNote}`);
  else lines.push(`What we talked about: NOT RECORDED — do not reference any conversation topic at all.`);

  lines.push(
    `The sender sells Combilift multi-directional forklifts and material handling equipment.`,
    `Write the follow-up. If you were told nothing about the conversation, write a short note that is simply pleased to have met them and open to staying in touch, and do not pretend otherwise.`,
  );
  return lines.join("\n");
}

/**
 * Anthropic's Messages API, which is not OpenAI-compatible: different endpoint,
 * different auth header, different response shape, and no JSON response mode.
 *
 * JSON is forced by prefilling the assistant turn with an opening brace, so the
 * model has already started an object and continues it. That is the documented
 * way to get structured output here, and it is why the brace is added back
 * before parsing.
 */
async function viaAnthropic(apiKey: string, prompt: string): Promise<WrittenDraft | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;

  const json = await res.json();
  const text = json?.content?.[0]?.text;
  if (typeof text !== "string") return null;
  return JSON.parse("{" + text) as WrittenDraft;
}

/** Any OpenAI-compatible endpoint, which does have a JSON response mode. */
async function viaOpenAiCompatible(apiKey: string, prompt: string): Promise<WrittenDraft | null> {
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com";
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;

  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") return null;
  return JSON.parse(raw) as WrittenDraft;
}

export async function writeDraft(input: DraftInput): Promise<WrittenDraft | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openAiKey = process.env.LLM_API_KEY;
  if (!anthropicKey && !openAiKey) return null;

  try {
    const prompt = userPrompt(input);
    const parsed = anthropicKey
      ? await viaAnthropic(anthropicKey, prompt)
      : await viaOpenAiCompatible(openAiKey!, prompt);

    if (!parsed?.subject?.trim() || !parsed?.body?.trim()) return null;
    const draft = { subject: parsed.subject.trim(), body: parsed.body.trim() };

    // The send route refuses any draft containing brackets. A model that slipped
    // one in would produce a draft that looks finished and cannot be sent, so
    // reject it here and fall back rather than handing over a dead end.
    if (/\[[^\]]+\]/.test(draft.subject) || /\[[^\]]+\]/.test(draft.body)) return null;

    return draft;
  } catch {
    return null;
  }
}
