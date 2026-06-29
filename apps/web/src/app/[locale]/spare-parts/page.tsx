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

const criticalityClassNames = {
  critical: 'border-red-500/40 bg-red-950/30 text-red-200',
  recommended: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  optional: 'border-stone-600 bg-stone-900 text-stone-300',
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

function formatText(value: string | null | undefined): string {
  return value?.trim() || 'Not set';
}

function formatCriticality(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderReadySpareParts(
  loadState: Extract<WorkspaceOverviewLoadState, { status: 'ready' }>,
  locale: string,
) {
  const spareParts = [...loadState.spareParts].sort(
    (first, second) =>
      new Date(second.sparePart.updatedAt).getTime() -
      new Date(first.sparePart.updatedAt).getTime(),
  );

  if (spareParts.length === 0) {
    return renderStatePanel({
      title: 'No spare parts yet',
      body: 'Add spare parts from a machine detail page. They will appear here automatically.',
      href: `/${locale}/machines`,
      label: 'Open machines',
    });
  }

  return (
    <section aria-label="Workspace spare parts" className="grid gap-4">
      {spareParts.map(({ sparePart, machine }) => (
        <article
          key={sparePart.id}
          className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                {machine.customer.companyName} · {machine.machineName}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-white">
                {sparePart.partName}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
                {formatText(sparePart.manufacturer)}
                {sparePart.partNumber ? ` · ${sparePart.partNumber}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                  criticalityClassNames[sparePart.criticality]
                }`}
              >
                {formatCriticality(sparePart.criticality)}
              </span>
              <Link
                href={`/${locale}/machines/${encodeURIComponent(machine.id)}#spare-parts`}
                className="inline-flex min-h-9 items-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-white"
              >
                Open machine
              </Link>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Quantity
              </dt>
              <dd className="mt-1 text-stone-200">{sparePart.quantity}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Category
              </dt>
              <dd className="mt-1 text-stone-200">{formatText(sparePart.category)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Estimated price
              </dt>
              <dd className="mt-1 text-stone-200">
                {sparePart.estimatedPrice
                  ? `${sparePart.estimatedPrice} ${sparePart.currency}`
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Customer price
              </dt>
              <dd className="mt-1 text-stone-200">
                {sparePart.customerVisiblePrice
                  ? `${sparePart.customerVisiblePrice} ${sparePart.currency}`
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                Updated
              </dt>
              <dd className="mt-1 text-stone-200">
                {formatWorkspaceDate(sparePart.updatedAt, locale)}
              </dd>
            </div>
          </dl>

          {sparePart.notes ? (
            <p className="mt-5 rounded-md border border-stone-800 bg-black/20 p-4 text-sm leading-6 text-stone-300">
              {sparePart.notes}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export default async function SparePartsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.spareParts;
  const loadState = await loadWorkspaceOverview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="spare-parts-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="spare-parts-title"
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
            title: 'Sign in to see spare parts',
            body: `Missing session fields: ${loadState.missingFields.join(', ')}.`,
            href: `/${locale}/login`,
            label: 'Sign in',
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            title: 'Spare parts could not be loaded',
            body: loadState.message,
          })
        : null}

      {loadState.status === 'ready' ? renderReadySpareParts(loadState, locale) : null}
    </div>
  );
}
