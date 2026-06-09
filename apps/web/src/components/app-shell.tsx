import type { Locale } from '@buildtrace/i18n';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AppNav } from '@/components/app-nav';
import { LanguageSwitcher } from './language-switcher';

type AppShellMessages = {
  readonly appName: string;
  readonly phaseName: string;
  readonly languageSwitcher: {
    readonly label: string;
    readonly localeLabels: Record<Locale, string>;
  };
  readonly shell: {
    readonly header: {
      readonly ariaLabel: string;
      readonly statusLabel: string;
      readonly navigationLabel: string;
      readonly navItems: {
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
    };
    readonly footer: {
      readonly positioning: string;
      readonly links: {
        readonly privacy: string;
        readonly security: string;
        readonly dataProtection: string;
      };
    };
  };
};

type AppShellProps = {
  readonly children: ReactNode;
  readonly currentLocale: Locale;
  readonly messages: AppShellMessages;
};

export function AppShell({ children, currentLocale, messages }: AppShellProps) {
  const footerLinks = [
    {
      href: `/${currentLocale}#privacy`,
      label: messages.shell.footer.links.privacy,
    },
    {
      href: `/${currentLocale}#security`,
      label: messages.shell.footer.links.security,
    },
    {
      href: `/${currentLocale}#data-protection`,
      label: messages.shell.footer.links.dataProtection,
    },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-stone-50">
      <header
        aria-label={messages.shell.header.ariaLabel}
        className="border-b border-stone-800 bg-neutral-950/95"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {messages.shell.header.statusLabel}
              </p>

              <Link
                href={`/${currentLocale}`}
                className="inline-flex text-2xl font-semibold text-white transition hover:text-emerald-200"
              >
                {messages.appName}
              </Link>

              <p className="text-sm text-stone-400">{messages.phaseName}</p>
            </div>

            <LanguageSwitcher currentLocale={currentLocale} messages={messages.languageSwitcher} />
          </div>

          <AppNav
            currentLocale={currentLocale}
            label={messages.shell.header.navigationLabel}
            navItems={messages.shell.header.navItems}
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-stone-800 bg-neutral-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="max-w-3xl text-sm text-stone-400">{messages.shell.footer.positioning}</p>

          <nav>
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-stone-300 transition hover:text-emerald-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
