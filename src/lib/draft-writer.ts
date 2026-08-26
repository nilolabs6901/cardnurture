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

const SYSTEM = `You write short follow-up emails after meeting somebody in person.

Hard rules:
- Never invent a conversation. If you are not told what was discussed, do not
  reference a topic, a shared joke, or anything either person said.
- Never invent a fact about their business. Use only what you are given.
- No square brackets. No placeholders. The email must be ready to send as written.
- No sign-off block, no name, no title, no phone number. The sender's mail client
  adds a signature. End at "Best regards," and nothing after it.
- Plain text. No markdown, no bullet points, no links.
- Between 60 and 110 words in the body. Shorter is better.
- Warm and direct. No "I hope this email finds you well", no "I wanted to reach
  out", no "circle back", no "synergy", no exclamation marks.
- British spellings are wrong here. Use American English.

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

export async function writeDraft(input: DraftInput): Promise<WrittenDraft | null> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt(input) },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return null;

    const parsed = JSON.parse(raw) as Partial<WrittenDraft>;
    if (!parsed.subject?.trim() || !parsed.body?.trim()) return null;

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
