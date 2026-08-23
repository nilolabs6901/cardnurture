/**
 * Turns a scanned card into a LinkedIn link you can tap at the booth.
 *
 * There are two honest ways to do this and one dishonest one.
 *
 * Honest: the card printed a LinkedIn URL, so link straight to that profile.
 * Honest: it did not, so run a people search for the name and company and let
 * the human pick the right face out of the results.
 *
 * Dishonest, and deliberately not done here: guessing a profile slug from a
 * name. "linkedin.com/in/dana-reyes" resolves to *a* Dana Reyes, and there are
 * hundreds. At a trade show a wrong-profile link means sending a connection
 * request to a stranger while the actual person is standing in front of you.
 * A search that takes one extra tap beats a direct link to the wrong human.
 */

/** Matches a LinkedIn profile printed on a card, with or without scheme or www. */
const LINKEDIN_PROFILE_REGEX =
  /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i;

export interface LinkedInTarget {
  /** 'profile' when the card printed one; 'search' when we are guessing at nothing. */
  kind: 'profile' | 'search';
  url: string;
  /** What to put on the button, since the two cases promise different things. */
  label: string;
}

/**
 * OCR mangles printed URLs -- spaces get inserted, "/in/" becomes "/ in /". So
 * whitespace has to go before matching.
 *
 * But only WITHIN a line. Flattening the whole card into one string runs the
 * slug straight into whatever was printed underneath, and the captured profile
 * becomes "danareyes-mhe407-555-0142". Cards print a URL on its own line, so
 * line boundaries are exactly the right thing to preserve.
 */
function candidateLines(input: {
  name?: string;
  company?: string;
  rawOcrText?: string;
}): string[] {
  return [input.rawOcrText ?? '', input.name ?? '', input.company ?? '']
    .flatMap((v) => v.split(/[\r\n]+/))
    .map((line) => line.replace(/\s+/g, ''))
    .filter(Boolean);
}

export function linkedInTarget(input: {
  name?: string;
  company?: string;
  rawOcrText?: string;
}): LinkedInTarget | null {
  const name = (input.name ?? '').trim();

  // A profile printed on the card beats anything we could infer.
  for (const line of candidateLines(input)) {
    const printed = LINKEDIN_PROFILE_REGEX.exec(line);
    if (printed) {
      return {
        kind: 'profile',
        url: `https://www.linkedin.com/in/${printed[1]}`,
        label: 'Open LinkedIn profile',
      };
    }
  }

  // Without a name there is nothing to search for; a bare company search is not
  // what "connect with this person" means.
  if (!name) return null;

  const terms = [name, (input.company ?? '').trim()].filter(Boolean).join(' ');
  return {
    kind: 'search',
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(terms)}`,
    label: 'Find on LinkedIn',
  };
}
