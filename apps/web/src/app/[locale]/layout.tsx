import { AppShell } from '@/components/app-shell';
import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale];

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-neutral-950 text-stone-50 antialiased">
        <AppShell currentLocale={locale} messages={messages}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
