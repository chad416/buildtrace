import {
  documentLabels,
  isSupportedLocale,
  locales,
  qrPortalCopy,
  quoteRequestsCopy,
  type Locale,
} from '@buildtrace/i18n';
import { quoteRequestTypes, ticketPriorities, type DocumentCategory } from '@buildtrace/shared';
import Link from 'next/link';

import { createPortalQuoteRequestAction, createPortalServiceTicketAction } from '../actions';
import {
  getQrPortalMachine,
  listQrPortalDocuments,
  type QrPortalMachineApiModel,
} from '@/qr-portal-api';
import { createQrPortalDocumentDownloadUrlAction } from '../actions';

type PortalPageProps = {
  params: Promise<{
    qrToken: string;
  }>;
  searchParams?: Promise<{
    lang?: string | readonly string[];
    downloadError?: string | readonly string[];
    ticketCreated?: string | readonly string[];
    ticketError?: string | readonly string[];
    ticketRef?: string | readonly string[];
    quoteCreated?: string | readonly string[];
    quoteError?: string | readonly string[];
    quoteRef?: string | readonly string[];
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

export default async function QrPortalPage({ params, searchParams }: PortalPageProps) {
  const { qrToken } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale = readLocale(resolvedSearchParams?.lang);
  const copy = qrPortalCopy[locale];
  const quoteCopy = quoteRequestsCopy[locale];
  const downloadError =
    typeof resolvedSearchParams?.downloadError === 'string'
      ? resolvedSearchParams.downloadError
      : undefined;
  const ticketCreated =
    typeof resolvedSearchParams?.ticketCreated === 'string'
      ? resolvedSearchParams.ticketCreated
      : undefined;
  const ticketError =
    typeof resolvedSearchParams?.ticketError === 'string'
      ? resolvedSearchParams.ticketError
      : undefined;
  const ticketRef =
    typeof resolvedSearchParams?.ticketRef === 'string'
      ? resolvedSearchParams.ticketRef
      : undefined;
  const quoteCreated =
    typeof resolvedSearchParams?.quoteCreated === 'string'
      ? resolvedSearchParams.quoteCreated
      : undefined;
  const quoteError =
    typeof resolvedSearchParams?.quoteError === 'string'
      ? resolvedSearchParams.quoteError
      : undefined;
  const quoteRef =
    typeof resolvedSearchParams?.quoteRef === 'string' ? resolvedSearchParams.quoteRef : undefined;

  let machine: QrPortalMachineApiModel | null = null;
  let documents: ReadonlyArray<{
    id: string;
    fileName: string;
    category: string;
    language: string;
    uploadedAt: string;
  }> = [];

  try {
    const [machineResult, docsResult] = await Promise.all([
      getQrPortalMachine({ qrToken }),
      listQrPortalDocuments({ qrToken }),
    ]);
    machine = machineResult;
    documents = docsResult.documents;
  } catch {
    try {
      machine = await getQrPortalMachine({ qrToken });
    } catch {
      machine = null;
    }
  }

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

        {downloadError ? (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-950/20 p-4 text-sm text-red-200">
            {downloadError}
          </div>
        ) : null}

        {documents.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-stone-700 bg-neutral-950/60 p-6">
            <p className="text-sm leading-6 text-stone-400">{copy.noDocumentsMessage}</p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-stone-800">
            {documents.map((document) => {
              const localizedCategory =
                documentLabels[locale].categories[document.category as DocumentCategory] ||
                document.category;

              return (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{document.fileName}</p>
                    <p className="mt-1 text-xs text-stone-400">{localizedCategory}</p>
                  </div>
                  <form action={createQrPortalDocumentDownloadUrlAction}>
                    <input type="hidden" name="qrToken" value={qrToken} />
                    <input type="hidden" name="documentId" value={document.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300"
                    >
                      {copy.downloadButtonLabel}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
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

      <section
        id="ticket"
        aria-labelledby="portal-ticket-title"
        className="mt-6 rounded-2xl border border-stone-800 bg-neutral-900/70 p-5 shadow-xl shadow-black/20 sm:p-7"
      >
        <h2 id="portal-ticket-title" className="text-xl font-semibold text-white sm:text-2xl">
          {copy.ticketSectionTitle}
        </h2>

        {ticketCreated ? (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-100">
            {copy.ticketCreatedMessage}
            <span className="break-all font-semibold">{ticketRef}</span>
          </div>
        ) : null}

        {ticketError ? (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-950/20 p-4 text-sm text-red-200">
            <p className="font-semibold">{copy.ticketErrorTitle}</p>
            <p className="mt-1 break-words">{ticketError}</p>
          </div>
        ) : null}

        <form action={createPortalServiceTicketAction} className="mt-5 grid gap-5">
          <input type="hidden" name="qrToken" value={qrToken} />
          <input type="hidden" name="machineId" value={machine.machineId} />
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-2">
            <label
              htmlFor="portal-ticket-title-input"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {copy.ticketTitleLabel}
            </label>
            <input
              id="portal-ticket-title-input"
              name="title"
              type="text"
              required
              className="rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="portal-ticket-description"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {copy.ticketDescriptionLabel}
            </label>
            <textarea
              id="portal-ticket-description"
              name="description"
              required
              rows={5}
              className="resize-y rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="portal-ticket-priority"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {copy.ticketPriorityLabel}
            </label>
            <select
              id="portal-ticket-priority"
              name="priority"
              defaultValue="normal"
              className="rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {copy.priorityLabels[priority]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300 sm:w-fit"
          >
            {copy.ticketSubmitLabel}
          </button>
        </form>
      </section>

      <section
        id="quote"
        aria-labelledby="portal-quote-title"
        className="mt-6 rounded-2xl border border-stone-800 bg-neutral-900/70 p-5 shadow-xl shadow-black/20 sm:p-7"
      >
        <h2 id="portal-quote-title" className="text-xl font-semibold text-white sm:text-2xl">
          {quoteCopy.portalSectionTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {quoteCopy.portalSectionDescription}
        </p>

        {quoteCreated ? (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-100">
            {quoteCopy.portalCreatedMessage}
            <span className="break-all font-semibold">{quoteRef}</span>
          </div>
        ) : null}

        {quoteError ? (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-950/20 p-4 text-sm text-red-200">
            <p className="font-semibold">{quoteCopy.portalErrorTitle}</p>
            <p className="mt-1 break-words">{quoteError}</p>
          </div>
        ) : null}

        <form action={createPortalQuoteRequestAction} className="mt-5 grid gap-5">
          <input type="hidden" name="qrToken" value={qrToken} />
          <input type="hidden" name="machineId" value={machine.machineId} />
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-2">
            <label
              htmlFor="portal-quote-title-input"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {quoteCopy.titleLabel}
            </label>
            <input
              id="portal-quote-title-input"
              name="title"
              type="text"
              required
              className="rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="portal-quote-type"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {quoteCopy.typeLabel}
            </label>
            <select
              id="portal-quote-type"
              name="type"
              defaultValue="spare-part"
              className="rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {quoteRequestTypes.map((type) => (
                <option key={type} value={type}>
                  {quoteCopy.typeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="portal-quote-currency"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {quoteCopy.currencyLabel}
            </label>
            <input
              id="portal-quote-currency"
              name="currency"
              type="text"
              defaultValue="EUR"
              className="rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="portal-quote-description"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {quoteCopy.descriptionLabel}
            </label>
            <textarea
              id="portal-quote-description"
              name="description"
              rows={5}
              className="resize-y rounded-xl border border-stone-700 bg-neutral-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300 sm:w-fit"
          >
            {quoteCopy.portalSubmitLabel}
          </button>
        </form>
      </section>
    </main>
  );
}
