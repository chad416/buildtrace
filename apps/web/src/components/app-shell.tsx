import type { Locale } from '@buildtrace/i18n';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LanguageSwitcher } from './language-switcher';

type LanguageSwitcherMessages = {
  readonly label: string;
  readonly localeLabels: Readonly<Record<Locale, string>>;
};

type AppShellMessages = {
  readonly appName: string;
  readonly languageSwitcher: LanguageSwitcherMessages;
  readonly shell: {
    readonly header: {
      readonly ariaLabel: string;
      readonly statusLabel: string;
      readonly navigationLabel: string;
      readonly navItems: {
        readonly overview: string;
        readonly evidence: string;
        readonly documentation: string;
      };
    };
    readonly footer: {
      readonly ariaLabel: string;
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
  const navItems = [
    { href: '#overview', label: messages.shell.header.navItems.overview },
    { href: '#evidence-readiness', label: messages.shell.header.navItems.evidence },
    { href: '#documentation', label: messages.shell.header.navItems.documentation },
  ] as const;

  const footerLinks = [
    { href: '#privacy', label: messages.shell.footer.links.privacy },
    { href: '#security', label: messages.shell.footer.links.security },
    { href: '#data-protection', label: messages.shell.footer.links.dataProtection },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-stone-50">
      <header
        aria-label={messages.shell.header.ariaLabel}
        className="border-b border-emerald-500/20 bg-neutral-950"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href={`/${currentLocale}`}
              className="text-lg font-semibold tracking-normal text-white"
            >
              {messages.appName}
            </Link>
            <p className="text-sm font-medium text-amber-200">
              {messages.shell.header.statusLabel}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <nav aria-label={messages.shell.header.navigationLabel}>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="rounded-full border border-stone-700 px-3 py-1.5 text-sm font-medium text-stone-200 transition hover:border-emerald-400 hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <LanguageSwitcher currentLocale={currentLocale} messages={messages.languageSwitcher} />
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-t border-stone-800 bg-neutral-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-stone-300">
            {messages.shell.footer.positioning}
          </p>

          <nav aria-label={messages.shell.footer.ariaLabel}>
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-stone-300 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
