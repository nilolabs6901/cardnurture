import { Lock } from 'lucide-react';

/**
 * The way in. Submits as a plain GET to "/", so the typed key arrives as
 * ?key=... and the middleware handles it exactly like a pasted link -- no API
 * route and no client-side JavaScript involved.
 */
export default function UnlockPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const wrongKey = searchParams.error === 'key';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-orange-muted)] flex items-center justify-center mb-4">
            <Lock size={24} className="text-[var(--accent-orange)]" />
          </div>
          <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold text-[var(--text-primary)]">
            Card
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-orange)] mx-0.5 align-middle" />
            Nurture
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
            Enter your access key to continue. You only need to do this once on
            this device.
          </p>
        </div>

        <form action="/" method="GET" className="space-y-3">
          <input
            type="password"
            name="key"
            autoFocus
            autoComplete="current-password"
            placeholder="Access key"
            aria-label="Access key"
            aria-invalid={wrongKey}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full min-h-[44px]"
          />

          {wrongKey && (
            <p className="text-sm text-[var(--status-error)]">
              That key wasn&apos;t recognised. Check it against
              <span className="font-mono"> APP_ACCESS_KEY </span>
              in your hosting environment — a stray quote or trailing space
              around the stored value is the usual cause.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
