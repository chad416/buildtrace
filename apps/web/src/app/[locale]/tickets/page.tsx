import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

const ticketStatusClassNames = {
  open: 'border-sky-500/40 bg-sky-950/30 text-sky-200',
  'under-review': 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  'waiting-for-buyer': 'border-purple-500/40 bg-purple-950/30 text-purple-200',
  'quote-sent': 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  resolved: 'border-stone-600 bg-stone-900 text-stone-300',
} as const;

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

function formatTicketStatus(status: string): string {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderReadyTickets(
  loadState: Extract<WorkspaceOverviewLoadState, { status: 'ready' }>,
  locale: string,
) {
  const tickets = [...loadState.tickets].sort(
    (first, second) =>
      new Date(second.ticket.updatedAt).getTime() - new Date(first.ticket.updatedAt).getTime(),
  );

  if (tickets.length === 0) {
    return renderStatePanel({
      title: 'No service tickets yet',
      body: 'Raise a ticket from a machine detail page or from a public QR portal. It will appear here automatically.',
      href: `/${locale}/machines`,
      label: 'Open machines',
    });
  }

  return (
    <section aria-label="Workspace service tickets" className="grid gap-4">
      {tickets.map(({ ticket, machine }) => (
        <article
          key={ticket.id}
          className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                {machine.customer.companyName} · {machine.machineName}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-white">
                {ticket.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
                {ticket.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                  ticketStatusClassNames[ticket.status]
                }`}
              >
                {formatTicketStatus(ticket.status)}
              </span>
              <Link
                href={`/${locale}/machines/${encodeURIComponent(machine.id)}?ticketId=${encodeURIComponent(ticket.id)}`}
                className="inline-flex min-h-9 items-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-white"
              >
                Open ticket
              </Link>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Priority
              </dt>
              <dd className="mt-1 text-stone-200">{formatTicketStatus(ticket.priority)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Source
              </dt>
              <dd className="mt-1 text-stone-200">
                {ticket.createdFromPortal ? 'QR portal' : 'Workspace'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Created
              </dt>
              <dd className="mt-1 text-stone-200">
                {formatWorkspaceDate(ticket.createdAt, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Updated
              </dt>
              <dd className="mt-1 text-stone-200">
                {formatWorkspaceDate(ticket.updatedAt, locale)}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </section>
  );
}

export default async function TicketsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.tickets;
  const loadState = await loadWorkspaceOverview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="tickets-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="tickets-title"
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
            title: 'Sign in to see tickets',
            body: `Missing session fields: ${loadState.missingFields.join(', ')}.`,
            href: `/${locale}/login`,
            label: 'Sign in',
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            title: 'Tickets could not be loaded',
            body: loadState.message,
          })
        : null}

      {loadState.status === 'ready' ? renderReadyTickets(loadState, locale) : null}
    </div>
  );
}
