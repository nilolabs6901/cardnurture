/**
 * Open a composed message in a specific mail app.
 *
 * The button used to say "Outlook" and fire a plain `mailto:`. On a phone that
 * goes to whichever app is set as the system default — so on Kenny's iPhone the
 * Outlook button opened Mail with a Gmail account selected. The label promised
 * one thing and the link did another.
 *
 * Outlook registers its own URL scheme, so ask for Outlook by name. There is no
 * reliable way for a web page to know whether an app is installed, so the
 * fallback is timing: navigate to the scheme, and if we are still here a moment
 * later then nothing handled it, and we fall back to `mailto:`.
 *
 * The visibility check matters. When the scheme DOES work the browser is
 * backgrounded, timers keep running, and a naive timeout would fire `mailto:`
 * behind the user — leaving a second half-written draft in a different app.
 */

export interface Composed {
  to: string;
  subject: string;
  body: string;
}

/**
 * Query values are escaped with encodeURIComponent, NOT URLSearchParams.
 *
 * URLSearchParams uses form encoding, where a space becomes `+`. That is correct
 * for an HTML form post and wrong for these URLs: mail clients percent-decode the
 * value and do not translate `+` back into a space, so the draft arrives reading
 * "Hi+Michael,+It+was+great+meeting+you". Which is exactly what happened when I
 * first wrote this, and the test I wrote alongside it asserted `Hi+Michael` as
 * though that were the desired output — so the bug shipped with a green suite.
 *
 * encodeURIComponent produces %20 for a space, which every client decodes.
 */
function q(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

/** `mailto:` wants the address raw in the path; only the query values get escaped. */
export function mailtoUrl({ to, subject, body }: Composed): string {
  return `mailto:${to}?${q({ subject, body })}`;
}

export function outlookUrl({ to, subject, body }: Composed): string {
  return `ms-outlook://compose?${q({ to, subject, body })}`;
}

export function gmailUrl({ to, subject, body }: Composed): string {
  return `https://mail.google.com/mail/?${q({ view: "cm", to, su: subject, body })}`;
}

/** Try Outlook by name; fall back to the system default if it is not installed. */
export function openInOutlook(msg: Composed): void {
  let handled = false;

  const giveUp = () => {
    // Hidden page = Outlook opened and took focus. Do not also fire mailto, or
    // the user comes back to a second draft in another app.
    if (handled || document.hidden || document.visibilityState === "hidden") return;
    window.location.href = mailtoUrl(msg);
  };

  const onHide = () => {
    handled = true;
  };
  document.addEventListener("visibilitychange", onHide, { once: true });
  window.addEventListener("pagehide", onHide, { once: true });

  window.location.href = outlookUrl(msg);
  window.setTimeout(() => {
    giveUp();
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
  }, 1200);
}

export function openInDefaultMail(msg: Composed): void {
  window.location.href = mailtoUrl(msg);
}

export function openInGmail(msg: Composed): void {
  window.open(gmailUrl(msg), "_blank");
}
