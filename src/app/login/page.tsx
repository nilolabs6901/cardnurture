'use client';

import { useState, useEffect, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error')) {
      setError('Something went wrong. Please try again.');
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        setTimeout(() => {
          window.location.replace('/upload');
        }, 100);
        return;
      }

      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center px-4 z-50">
      <div className="animate-fade-in-up w-full max-w-sm">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold text-[var(--text-primary)]">
              Card
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--accent-orange)] mx-0.5 align-middle"
                style={{ filter: 'drop-shadow(0 0 6px rgba(243, 111, 33, 0.5))' }}
              />
              Nurture
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm text-[var(--text-secondary)] font-medium"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                placeholder="you@company.com"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-[var(--status-error)] text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
