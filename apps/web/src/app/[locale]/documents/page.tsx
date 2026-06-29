import { appMessages, documentLabels, isSupportedLocale, type Locale } from '@buildtrace/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createMachineDocumentDownloadUrlAction } from '../machines/actions';
import {
  formatWorkspaceDate,
  loadWorkspaceOverview,
  type WorkspaceOverviewLoadState,
} from '@/workspace-overview';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function renderStatePanel({
  title,
  body,
  href,
  label,
}: {
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly label?: string;
}) {
  return (
    <section className="rounded-lg border border-stone-800 bg-neutral-900/70 p-6">
      <h2 className="text-xl font-semibold tracking-normal text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">{body}</p>
      {href && label ? (
        <Link
          href={href}
          className="mt-5 inline-flex w-fit rounded-md border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
        >
          {label}
        </Link>
      ) : null}
    </section>
  );
}

function renderReadyDocuments(
  loadState: Extract<WorkspaceOverviewLoadState, { status: 'ready' }>,
  locale: Locale,
) {
  const labels = documentLabels[locale];
  const documents = [...loadState.documents].sort(
    (first, second) =>
      new Date(second.document.uploadedAt).getTime() -
      new Date(first.document.uploadedAt).getTime(),
  );

  if (documents.length === 0) {
    return renderStatePanel({
      title: 'No documents uploaded yet',
      body: 'Upload PDFs or other handover files from a machine detail page. They will appear here automatically.',
      href: `/${locale}/machines`,
      label: 'Open machines',
    });
  }

  return (
    <section aria-label="Workspace documents" className="grid gap-4">
      {documents.map(({ document, machine }) => {
        const downloadAction = createMachineDocumentDownloadUrlAction.bind(
          null,
          locale,
          machine.id,
          document.id,
        );

        return (
          <article
            key={document.id}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                  {machine.customer.companyName} · {machine.machineName}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-normal text-white">
                  {document.fileName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {labels.categories[document.category]} ·{' '}
                  {labels.visibilityLevels[document.visibilityLevel]} ·{' '}
                  {labels.languages[document.language]}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/machines/${encodeURIComponent(machine.id)}`}
                  className="inline-flex min-h-10 items-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-white"
                >
                  Open machine
                </Link>
                <form action={downloadAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    Download
                  </button>
                </form>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                  Uploaded
                </dt>
                <dd className="mt-1 text-stone-200">
                  {formatWorkspaceDate(document.uploadedAt, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                  Customer visible
                </dt>
                <dd className="mt-1 text-stone-200">{document.visibleToCustomer ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                  Classification
                </dt>
                <dd className="mt-1 text-stone-200">
                  {labels.classificationStatuses[document.classificationStatus]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                  File type
                </dt>
                <dd className="mt-1 text-stone-200">{document.fileType}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}

export default async function DocumentsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.documents;
  const loadState = await loadWorkspaceOverview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="documents-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="documents-title"
          className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
          {messages.description}
        </p>
      </section>

      {loadState.status === 'auth-required'
        ? renderStatePanel({
            title: 'Sign in to see documents',
            body: `Missing session fields: ${loadState.missingFields.join(', ')}.`,
            href: `/${locale}/login`,
            label: 'Sign in',
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            title: 'Documents could not be loaded',
            body: loadState.message,
          })
        : null}

      {loadState.status === 'ready' ? renderReadyDocuments(loadState, locale) : null}
    </div>
  );
}
