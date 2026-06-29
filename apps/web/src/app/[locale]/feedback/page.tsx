import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { ticketPriorities } from '@buildtrace/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createFeedbackTicketAction } from './actions';
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
  searchParams: Promise<{
    feedback?: string | readonly string[];
    feedbackError?: string | readonly string[];
  }>;
};

function readSearchParam(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

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

function renderFeedbackPanel({
  tone,
  title,
  body,
}: {
  readonly tone: 'success' | 'error';
  readonly title: string;
  readonly body: string;
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-950/20'
      : 'border-red-500/40 bg-red-950/20';

  return (
    <section className={`rounded-lg border p-5 sm:p-6 ${className}`}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-200">{body}</p>
    </section>
  );
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderReadyFeedback(
  loadState: Extract<WorkspaceOverviewLoadState, { status: 'ready' }>,
  locale: string,
) {
  const feedbackAction = createFeedbackTicketAction.bind(null, locale);
  const recentTickets = [...loadState.tickets]
    .sort(
      (first, second) =>
        new Date(second.ticket.updatedAt).getTime() - new Date(first.ticket.updatedAt).getTime(),
    )
    .slice(0, 6);

  if (loadState.machines.length === 0) {
    return renderStatePanel({
      title: 'Create a machine before sending feedback',
      body: 'Feedback and service issues are linked to a machine so the team can trace documents, parts, tickets, and customer context together.',
      href: `/${locale}/machines`,
      label: 'Create machine records',
    });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form
        action={feedbackAction}
        className="rounded-lg border border-emerald-500/20 bg-neutral-900/80 p-5 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
          New feedback
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
          Send a machine-linked issue
        </h2>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Machine
            <select
              name="machineId"
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm font-normal text-white outline-none transition focus:border-emerald-400"
            >
              {loadState.machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.machineName} · {machine.customer.companyName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Title
            <input
              name="title"
              required
              placeholder="What needs attention?"
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm font-normal text-white outline-none transition placeholder:text-stone-600 focus:border-emerald-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Priority
            <select
              name="priority"
              defaultValue="normal"
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm font-normal text-white outline-none transition focus:border-emerald-400"
            >
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Description
            <textarea
              name="description"
              required
              rows={6}
              placeholder="Describe the problem, missing information, or requested improvement."
              className="min-h-32 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm font-normal text-white outline-none transition placeholder:text-stone-600 focus:border-emerald-400"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
        >
          Send feedback
        </button>
      </form>

      <section className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
              Recent activity
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
              Service and feedback tickets
            </h2>
          </div>
          <Link
            href={`/${locale}/tickets`}
            className="text-sm font-semibold text-emerald-200 transition hover:text-white"
          >
            View all tickets
          </Link>
        </div>

        {recentTickets.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {recentTickets.map(({ ticket, machine }) => (
              <Link
                key={ticket.id}
                href={`/${locale}/machines/${encodeURIComponent(machine.id)}?ticketId=${encodeURIComponent(ticket.id)}`}
                className="rounded-md border border-stone-800 bg-black/20 p-4 transition hover:border-emerald-500/50"
              >
                <p className="text-sm font-semibold text-white">{ticket.title}</p>
                <p className="mt-2 text-xs leading-5 text-stone-400">
                  {machine.machineName} · {formatLabel(ticket.status)} ·{' '}
                  {formatWorkspaceDate(ticket.updatedAt, locale)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-stone-300">
            Feedback and service tickets will appear here after they are created.
          </p>
        )}
      </section>
    </section>
  );
}

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.feedback;
  const loadState = await loadWorkspaceOverview();
  const feedback = readSearchParam(resolvedSearchParams.feedback);
  const feedbackError = readSearchParam(resolvedSearchParams.feedbackError);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="feedback-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="feedback-title"
          className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
          {messages.description}
        </p>
      </section>

      {feedback === 'created'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Feedback sent',
            body: 'The feedback was saved as a service ticket and is visible in the Tickets tab.',
          })
        : null}

      {feedbackError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Feedback could not be sent',
            body: feedbackError,
          })
        : null}

      {loadState.status === 'auth-required'
        ? renderStatePanel({
            title: 'Sign in to send feedback',
            body: `Missing session fields: ${loadState.missingFields.join(', ')}.`,
            href: `/${locale}/login`,
            label: 'Sign in',
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            title: 'Feedback data could not be loaded',
            body: loadState.message,
          })
        : null}

      {loadState.status === 'ready' ? renderReadyFeedback(loadState, locale) : null}
    </div>
  );
}
