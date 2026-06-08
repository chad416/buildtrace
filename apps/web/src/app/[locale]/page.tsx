import { LanguageSwitcher } from '@/components/language-switcher';
import { appMessages, isSupportedLocale, locales } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;

  if (!isSupportedLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam;
  const messages = appMessages[locale];

  return (
    <main>
      <LanguageSwitcher currentLocale={locale} messages={messages.languageSwitcher} />
      <h1>{messages.appName}</h1>
      <p>{messages.phaseName}</p>
    </main>
  );
}
