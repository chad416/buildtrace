'use client';

import type { Locale } from '@buildtrace/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AppNavMessages = {
  readonly home: string;
  readonly dashboard: string;
  readonly machines: string;
  readonly documents: string;
  readonly tickets: string;
  readonly spareParts: string;
  readonly feedback: string;
  readonly settings: string;
  readonly login: string;
};

type AppNavProps = {
  readonly currentLocale: Locale;
  readonly label: string;
  readonly navItems: AppNavMessages;
};

export function AppNav({ currentLocale, label, navItems }: AppNavProps) {
  const pathname = usePathname();

  const items = [
    { href: `/${currentLocale}`, label: navItems.home },
    { href: `/${currentLocale}/dashboard`, label: navItems.dashboard },
    { href: `/${currentLocale}/machines`, label: navItems.machines },
    { href: `/${currentLocale}/documents`, label: navItems.documents },
    { href: `/${currentLocale}/tickets`, label: navItems.tickets },
    { href: `/${currentLocale}/spare-parts`, label: navItems.spareParts },
    { href: `/${currentLocale}/feedback`, label: navItems.feedback },
    { href: `/${currentLocale}/settings`, label: navItems.settings },
    { href: `/${currentLocale}/login`, label: navItems.login },
  ] as const;

  return (
    <nav aria-label={label}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((item) => {
          const isCurrent =
            item.href === `/${currentLocale}`
              ? pathname === item.href || pathname === `${item.href}/`
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                href={item.href}
                className={[
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  isCurrent
                    ? 'border-emerald-300 bg-emerald-300 text-neutral-950'
                    : 'border-stone-700 text-stone-200 hover:border-emerald-400 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
