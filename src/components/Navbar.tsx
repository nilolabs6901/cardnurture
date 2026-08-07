'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/upload', label: 'Upload' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/prospects', label: 'Prospects' },
  { href: '/contacts/reference', label: 'Reference' },
];

export default function Navbar() {
  const pathname = usePathname();

  // Nothing here is reachable before unlocking.
  if (pathname === '/unlock') return null;

  return (
    <>
    {/* Mobile header. The bottom nav covers navigation on small screens, so
        this carries branding only -- there is no sign-out, because there is
        no sign-in. Revoking a device means rotating APP_ACCESS_KEY. */}
    <header className="md:hidden sticky top-0 z-50 flex items-center min-h-[3.5rem] px-4 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] pt-safe">
      <Link href="/" className="flex items-center min-h-[44px] -ml-1 pl-1 pr-2">
        <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
          Card
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)] mx-0.5 align-middle" />
          Nurture
        </span>
      </Link>
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
    </nav>
    </>
  );
}
