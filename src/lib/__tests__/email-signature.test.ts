import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Drafts must not carry a fillable signature.
 *
 * Outlook appends the real one, so "[Your Name] / [Your Title] / [Your Phone]"
 * was three lines to delete on a phone before the mail could go out. Worse, it
 * is exactly the sort of thing that reaches a prospect verbatim when somebody is
 * in a hurry — the send route blocks any bracketed text for that reason, so
 * every draft was arriving pre-loaded with a reason it could not be sent.
 *
 * Asserted against the source because these are template literals inside a large
 * switch; testing the file is what actually stops one creeping back in.
 */
const source = readFileSync(join(process.cwd(), 'src/lib/email-templates.ts'), 'utf-8');

describe('draft sign-off', () => {
  it('has no [Your Name], [Your Title] or [Your Phone] placeholder in any template', () => {
    const matches = source.match(/`\[Your (Name|Title|Phone)\]`/g) ?? [];
    expect(matches).toEqual([]);
  });

  it('still signs off, so the letter does not end mid-thought', () => {
    expect(source).toContain('tone.signoff');
  });
});
