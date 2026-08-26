import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeDraft } from '../draft-writer';

const contact = { name: 'Rodrigo Dall Orsoletta', company: "D'OR", title: 'Co-Founder' };

function mockModel(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  });
}

describe('writeDraft', () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => { process.env.LLM_API_KEY = 'test-key'; });
  afterEach(() => { globalThis.fetch = realFetch; delete process.env.LLM_API_KEY; });

  it('returns null with no API key, so the caller falls back to the template', async () => {
    delete process.env.LLM_API_KEY;
    expect(await writeDraft(contact)).toBeNull();
  });

  /**
   * The guard that matters. The send route refuses any draft containing square
   * brackets, so a model that leaves a placeholder in produces a draft that looks
   * finished and cannot be sent. Rejecting it here falls back to the template
   * instead of handing over a dead end.
   */
  it('rejects a draft that still contains a placeholder', async () => {
    globalThis.fetch = mockModel({
      subject: 'Great meeting you',
      body: 'Hi Rodrigo,\n\nGreat to meet you at [event].\n\nBest regards,',
    }) as never;
    expect(await writeDraft(contact)).toBeNull();
  });

  it('accepts a clean draft', async () => {
    globalThis.fetch = mockModel({
      subject: 'Great meeting you',
      body: 'Hi Rodrigo,\n\nGood to meet you yesterday.\n\nBest regards,',
    }) as never;
    const d = await writeDraft(contact);
    expect(d?.subject).toBe('Great meeting you');
    expect(d?.body).toContain('Best regards,');
  });

  it('tells the model in the prompt when the meeting was not recorded', async () => {
    const spy = mockModel({ subject: 'Hello', body: 'Hi.\n\nBest regards,' });
    globalThis.fetch = spy as never;
    await writeDraft(contact);
    const sent = JSON.parse((spy.mock.calls[0]![1] as { body: string }).body);
    const prompt = sent.messages[1].content as string;
    expect(prompt).toContain('NOT RECORDED');
    expect(prompt).toContain('do not reference any conversation topic');
  });

  it('passes the real details through when they were recorded', async () => {
    const spy = mockModel({ subject: 'Hello', body: 'Hi.\n\nBest regards,' });
    globalThis.fetch = spy as never;
    await writeDraft({ ...contact, metAt: 'the Combilift booth at MODEX', metNote: 'six branches, slow quotes' });
    const prompt = JSON.parse((spy.mock.calls[0]![1] as { body: string }).body).messages[1].content as string;
    expect(prompt).toContain('the Combilift booth at MODEX');
    expect(prompt).toContain('six branches, slow quotes');
    expect(prompt).not.toContain('NOT RECORDED');
  });

  it('returns null rather than throwing when the model errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as never;
    expect(await writeDraft(contact)).toBeNull();
  });
});

/**
 * Anthropic's API is not OpenAI-compatible — different endpoint, auth header and
 * response shape, and no JSON mode. JSON is forced by prefilling the assistant
 * turn with "{", which is why the brace has to be put back before parsing. Get
 * that wrong and every draft silently falls back to the template.
 */
describe('provider selection', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_API_KEY;
  });

  it('prefers Anthropic, and prefills the brace so the reply is parseable JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const spy = vi.fn().mockResolvedValue({
      ok: true,
      // Note the missing opening brace — that is what a prefilled turn returns.
      json: async () => ({ content: [{ text: '"subject":"Hi","body":"Hello.\\n\\nBest regards,"}' }] }),
    });
    globalThis.fetch = spy as never;

    const d = await writeDraft({ name: 'Rodrigo Dall Orsoletta' });
    expect(d?.subject).toBe('Hi');

    const [url, init] = spy.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-ant-test');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    const sent = JSON.parse(init.body);
    expect(sent.messages.at(-1)).toEqual({ role: 'assistant', content: '{' });
  });

  it('falls back to an OpenAI-compatible endpoint when only that key is set', async () => {
    process.env.LLM_API_KEY = 'sk-openai-test';
    const spy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"subject":"Hi","body":"Hello.\\n\\nBest regards,"}' } }] }),
    });
    globalThis.fetch = spy as never;

    expect((await writeDraft({ name: 'Rodrigo Dall Orsoletta' }))?.subject).toBe('Hi');
    expect(spy.mock.calls[0]![0]).toContain('/v1/chat/completions');
  });
});
