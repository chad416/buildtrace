import { isSupportedLocale, locales, phaseZeroMessages } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = phaseZeroMessages[locale];

  return (
    <main>
      <h1>{messages.appName}</h1>
      <p>{messages.phaseName}</p>
    </main>
  );
}
