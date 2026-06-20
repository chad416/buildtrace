import { isSupportedLocale, locales, qrPortalCopy, type Locale } from '@buildtrace/i18n';
import Link from 'next/link';

import { getQrPortalMachine, type QrPortalMachineApiModel } from '@/qr-portal-api';

type PortalPageProps = {
  params: Promise<{
    qrToken: string;
  }>;
  searchParams?: Promise<{
    lang?: string | readonly string[];
  }>;
};

function readLocale(value: string | readonly string[] | undefined): Locale {
  return typeof value === 'string' && isSupportedLocale(value) ? value : 'en';
}

function LanguageSwitcher({
  qrToken,
  locale,
  label,
}: {
  readonly qrToken: string;
  readonly locale: Locale;
  readonly label: string;
}) {
  return (
    <nav aria-label={label}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {locales.map((language) => (
          <Link
            key={language}
            href={`/portal/${encodeURIComponent(qrToken)}?lang=${language}`}
            aria-current={language === locale ? 'page' : undefined}
            className={
              language === locale
                ? 'rounded-full border border-emerald-400 bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-neutral-950'
                : 'rounded-full border border-stone-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-stone-300 transition hover:border-emerald-400/70 hover:text-white'
            }
          >
            {language.toUpperCase()}
          </Link>
        ))}
      </div>
    </nav>
  );
}

async function loadPortalMachine(qrToken: string): Promise<QrPortalMachineApiModel | null> {
  try {
    return await getQrPortalMachine({ qrToken });
  } catch {
    return null;
  }
}

export default async function QrPortalPage({ params, searchParams }: PortalPageProps) {
  const { qrToken } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale = readLocale(resolvedSearchParams?.lang);
  const copy = qrPortalCopy[locale];
  const machine = await loadPortalMachine(qrToken);

  if (!machine) {
    return (
      <main
        lang={locale}
        className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-12 sm:px-8"
      >
        <section className="w-full rounded-2xl border border-red-500/25 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            {copy.title}
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            {copy.notFoundMessage}
          </h1>
          <div className="mt-8 border-t border-stone-800 pt-6">
            <LanguageSwitcher
              qrToken={qrToken}
              locale={locale}
              label={copy.languageSwitcherLabel}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      lang={locale}
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-12"
    >
      <header className="flex flex-col gap-5 border-b border-stone-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            {copy.title}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {machine.machineName}
          </h1>
          <p className="mt-3 text-sm text-stone-400">
            <span className="font-medium text-stone-300">{copy.serialLabel}:</span>{' '}
            {machine.serialNumber}
          </p>
        </div>

        <LanguageSwitcher qrToken={qrToken} locale={locale} label={copy.languageSwitcherLabel} />
      </header>

      <section className="py-8 sm:py-10">
        <p className="max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
          {copy.portalDescription}
        </p>
      </section>

      <section
        aria-labelledby="portal-documents-title"
        className="rounded-2xl border border-stone-800 bg-neutral-900/70 p-5 shadow-xl shadow-black/20 sm:p-7"
      >
        <h2 id="portal-documents-title" className="text-xl font-semibold text-white sm:text-2xl">
          {copy.documentsTitle}
        </h2>
        <div className="mt-5 rounded-xl border border-dashed border-stone-700 bg-neutral-950/60 p-6">
          <p className="text-sm leading-6 text-stone-400">{copy.noDocumentsMessage}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label={copy.title}>
        <Link
          href="#ticket"
          className="rounded-xl bg-emerald-400 px-5 py-3.5 text-center text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
        >
          {copy.ticketButtonLabel}
        </Link>
        <Link
          href="#feedback"
          className="rounded-xl border border-stone-700 bg-neutral-900 px-5 py-3.5 text-center text-sm font-semibold text-white transition hover:border-emerald-400/70"
        >
          {copy.feedbackButtonLabel}
        </Link>
      </section>
    </main>
  );
}
