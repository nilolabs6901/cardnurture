'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Users, Target, ListOrdered } from 'lucide-react';

const tabs = [
  { href: '/upload', label: 'Upload', icon: Camera },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/prospects', label: 'Prospects', icon: Target },
  { href: '/contacts/reference', label: 'Reference', icon: ListOrdered },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)] pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-3 py-1 transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'text-[var(--accent-orange)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
