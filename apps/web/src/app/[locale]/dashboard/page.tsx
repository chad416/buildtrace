import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  formatWorkspaceCount,
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

function renderReadyDashboard(
  loadState: Extract<WorkspaceOverviewLoadState, { status: 'ready' }>,
  locale: string,
) {
  const customerVisibleDocuments = loadState.documents.filter(
    ({ document }) => document.visibleToCustomer,
  ).length;
  const openTickets = loadState.tickets.filter(({ ticket }) => ticket.status !== 'resolved').length;
  const latestDocuments = [...loadState.documents]
    .sort(
      (first, second) =>
        new Date(second.document.uploadedAt).getTime() -
        new Date(first.document.uploadedAt).getTime(),
    )
    .slice(0, 5);
  const latestTickets = [...loadState.tickets]
    .sort(
      (first, second) =>
        new Date(second.ticket.updatedAt).getTime() - new Date(first.ticket.updatedAt).getTime(),
    )
    .slice(0, 5);

  const metrics = [
    { label: 'Machines', value: loadState.machines.length },
    { label: 'Customers', value: loadState.customers.length },
    { label: 'Documents', value: loadState.documents.length },
    { label: 'Customer-visible docs', value: customerVisibleDocuments },
    { label: 'Open tickets', value: openTickets },
    { label: 'Spare parts', value: loadState.spareParts.length },
  ];

  return (
    <>
      <section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatWorkspaceCount(metric.value, locale)}
            </p>
          </article>
        ))}
      </section>

      {loadState.machines.length === 0
        ? renderStatePanel({
            title: 'No machines yet',
            body: 'Create a customer, machine model, and machine record to start building live handover evidence.',
            href: `/${locale}/machines`,
            label: 'Create machine records',
          })
        : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                Documents
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                Latest uploads
              </h2>
            </div>
            <Link
              href={`/${locale}/documents`}
              className="text-sm font-semibold text-emerald-200 transition hover:text-white"
            >
              View all
            </Link>
          </div>

          {latestDocuments.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {latestDocuments.map(({ document, machine }) => (
                <Link
                  key={document.id}
                  href={`/${locale}/machines/${encodeURIComponent(machine.id)}`}
                  className="rounded-md border border-stone-800 bg-black/20 p-4 transition hover:border-emerald-500/50"
                >
                  <p className="text-sm font-semibold text-white">{document.fileName}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-400">
                    {machine.machineName} · {formatWorkspaceDate(document.uploadedAt, locale)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-stone-300">
              Uploaded machine documents will appear here.
            </p>
          )}
        </article>

        <article className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                Tickets
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                Recent service activity
              </h2>
            </div>
            <Link
              href={`/${locale}/tickets`}
              className="text-sm font-semibold text-emerald-200 transition hover:text-white"
            >
              View all
            </Link>
          </div>

          {latestTickets.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {latestTickets.map(({ ticket, machine }) => (
                <Link
                  key={ticket.id}
                  href={`/${locale}/machines/${encodeURIComponent(machine.id)}?ticketId=${encodeURIComponent(ticket.id)}`}
                  className="rounded-md border border-stone-800 bg-black/20 p-4 transition hover:border-emerald-500/50"
                >
                  <p className="text-sm font-semibold text-white">{ticket.title}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-400">
                    {machine.machineName} · {ticket.status} ·{' '}
                    {formatWorkspaceDate(ticket.updatedAt, locale)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-stone-300">
              Service tickets raised from machines or QR portals will appear here.
            </p>
          )}
        </article>
      </section>
    </>
  );
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.dashboard;
  const loadState = await loadWorkspaceOverview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="dashboard-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="dashboard-title"
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
            title: 'Sign in to see the live dashboard',
            body: `Missing session fields: ${loadState.missingFields.join(', ')}.`,
            href: `/${locale}/login`,
            label: 'Sign in',
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            title: 'Dashboard data could not be loaded',
            body: loadState.message,
          })
        : null}

      {loadState.status === 'ready' ? renderReadyDashboard(loadState, locale) : null}
    </div>
  );
}
