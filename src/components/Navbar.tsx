'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

const navLinks = [
  { href: '/upload', label: 'Upload' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/prospects', label: 'Prospects' },
  { href: '/contacts/reference', label: 'Reference' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
    {/* Mobile header. The bottom nav covers navigation on small screens, so
        this only carries branding and the sign-out affordance -- without it
        there is no way to sign out on a phone. */}
    <header className="md:hidden sticky top-0 z-50 flex items-center justify-between min-h-[3.5rem] px-4 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] pt-safe">
      <Link href="/" className="flex items-center min-h-[44px] -ml-1 pl-1 pr-2">
        <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
          Card
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)] mx-0.5 align-middle" />
          Nurture
        </span>
      </Link>
      {session?.user && (
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Sign out"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 rounded-lg text-[var(--text-secondary)] active:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <LogOut size={18} />
        </button>
      )}
    </header>

    <nav className="hidden md:flex sticky top-0 z-50 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] h-16 items-center px-6">
      {/* Left: Brand */}
      <Link href="/" className="flex items-center gap-2 mr-8">
        <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
          Card
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-orange)] mx-0.5 align-middle" />
          Nurture
        </span>
      </Link>

      {/* Center: Nav Links */}
      <div className="flex items-center gap-1 flex-1">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-[var(--accent-orange)] bg-[var(--accent-orange-muted)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right: User info + Sign Out */}
      <div className="flex items-center gap-4">
        {session?.user?.email && (
          <span className="text-xs text-[var(--text-tertiary)] hidden lg:block">
            {session.user.email}
          </span>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center"
        >
          <LogOut size={16} />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </nav>
    </>
  );
}
