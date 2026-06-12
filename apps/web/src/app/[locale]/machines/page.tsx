import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  listCustomers,
  listMachineModels,
  listMachineRecords,
  type CustomerRecordApiModel,
  type MachineModelRecordApiModel,
  type MachineRecordApiModel,
} from '@/machine-records-api';
import { machineRecordsPageCopy } from '@/machine-records-page-copy';
import {
  readMachineRecordsSession,
  type MachineRecordsSessionMissingField,
} from '@/machine-records-session';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type MachineRecordsLoadState =
  | {
      readonly status: 'auth-required';
      readonly missingFields: readonly MachineRecordsSessionMissingField[];
    }
  | {
      readonly status: 'error';
      readonly message: string;
    }
  | {
      readonly status: 'ready';
      readonly customers: readonly CustomerRecordApiModel[];
      readonly machineModels: readonly MachineModelRecordApiModel[];
      readonly machines: readonly MachineRecordApiModel[];
    };

const statusClassNames = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  MAINTENANCE: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  OUT_OF_SERVICE: 'border-red-500/40 bg-red-950/30 text-red-200',
  ARCHIVED: 'border-stone-600 bg-stone-900 text-stone-300',
} satisfies Record<MachineRecordApiModel['status'], string>;

function formatLoadError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown API error.';
}

function formatDate(value: string | null, locale: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(date);
}

function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function renderMissingFields(
  missingFields: readonly MachineRecordsSessionMissingField[],
  copy: (typeof machineRecordsPageCopy)['en'],
) {
  return (
    <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-stone-400">
      {copy.session.missingFieldsLabel}{' '}
      <span className="text-stone-200">
        {missingFields.map((field) => copy.session.missingFieldLabels[field]).join(', ')}
      </span>
    </p>
  );
}

function renderStatePanel({
  eyebrow,
  title,
  body,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">{body}</p>
      {children}
    </section>
  );
}

function renderReadinessSummary({
  customers,
  machineModels,
  machines,
  locale,
  copy,
}: {
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly machines: readonly MachineRecordApiModel[];
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
}) {
  const summaryItems = [
    {
      label: copy.records.customersCountLabel,
      value: customers.length,
    },
    {
      label: copy.records.modelsCountLabel,
      value: machineModels.length,
    },
    {
      label: copy.records.machinesCountLabel,
      value: machines.length,
    },
  ];

  return (
    <section className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
          {copy.records.contextEyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-normal text-white">
          {copy.records.contextTitle}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-stone-300">{copy.records.contextBody}</p>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-md border border-stone-800 bg-black/20 p-4">
            <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
              {item.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {formatCount(item.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function renderPrerequisitePanel({
  customers,
  machineModels,
  copy,
}: {
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly copy: (typeof machineRecordsPageCopy)['en'];
}) {
  const missingPrerequisites = [
    ...(customers.length === 0 ? [copy.prerequisites.customerMissingLabel] : []),
    ...(machineModels.length === 0 ? [copy.prerequisites.modelMissingLabel] : []),
  ];

  if (missingPrerequisites.length === 0) {
    return null;
  }

  return renderStatePanel({
    eyebrow: copy.prerequisites.eyebrow,
    title: copy.prerequisites.title,
    body: copy.prerequisites.body,
    children: (
      <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-stone-400">
        {copy.prerequisites.missingLabel}{' '}
        <span className="text-stone-200">{missingPrerequisites.join(', ')}</span>
      </p>
    ),
  });
}

function renderMachineCard({
  machine,
  locale,
  copy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
}) {
  return (
    <article className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
            {machine.customer.companyName}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            {machine.machineName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {copy.records.modelLabel}: {machine.machineModel.modelName}
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
            statusClassNames[machine.status]
          }`}
        >
          {copy.statusLabels[machine.status]}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.serialLabel}
          </dt>
          <dd className="mt-1 text-stone-200">{machine.serialNumber}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.deliveryDateLabel}
          </dt>
          <dd className="mt-1 text-stone-200">
            {formatDate(machine.deliveryDate, locale, copy.records.unavailableLabel)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.updatedAtLabel}
          </dt>
          <dd className="mt-1 text-stone-200">
            {formatDate(machine.updatedAt, locale, copy.records.unavailableLabel)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.plcLabel}
          </dt>
          <dd className="mt-1 text-stone-200">
            {machine.plcType ?? copy.records.unavailableLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.hmiLabel}
          </dt>
          <dd className="mt-1 text-stone-200">
            {machine.hmiType ?? copy.records.unavailableLabel}
          </dd>
        </div>
      </dl>

      <Link
        href={`/${locale}/machines/${encodeURIComponent(machine.id)}`}
        className="mt-5 inline-flex w-fit rounded-md border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
      >
        {copy.records.detailsLabel}
      </Link>
    </article>
  );
}

export default async function MachinesPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.machines;
  const copy = machineRecordsPageCopy[locale];
  const session = await readMachineRecordsSession();

  let loadState: MachineRecordsLoadState;

  if (session.status === 'missing') {
    loadState = {
      status: 'auth-required',
      missingFields: session.missingFields,
    };
  } else {
    try {
      const [machines, customers, machineModels] = await Promise.all([
        listMachineRecords({
          organizationId: session.organizationId,
          accessToken: session.accessToken,
        }),
        listCustomers({
          organizationId: session.organizationId,
          accessToken: session.accessToken,
        }),
        listMachineModels({
          organizationId: session.organizationId,
          accessToken: session.accessToken,
        }),
      ]);

      loadState = {
        status: 'ready',
        customers,
        machineModels,
        machines,
      };
    } catch (error) {
      loadState = {
        status: 'error',
        message: formatLoadError(error),
      };
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 md:py-14 lg:px-8">
      <section aria-labelledby="machines-title" className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="machines-title"
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
            eyebrow: copy.session.eyebrow,
            title: copy.session.title,
            body: copy.session.body,
            children: (
              <>
                {renderMissingFields(loadState.missingFields, copy)}
                <Link
                  href={`/${locale}/login`}
                  className="mt-5 inline-flex w-fit rounded-md border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                >
                  {copy.session.loginLabel}
                </Link>
              </>
            ),
          })
        : null}

      {loadState.status === 'error'
        ? renderStatePanel({
            eyebrow: copy.error.eyebrow,
            title: copy.error.title,
            body: `${copy.error.body} ${loadState.message}`,
          })
        : null}

      {loadState.status === 'ready'
        ? renderReadinessSummary({
            customers: loadState.customers,
            machineModels: loadState.machineModels,
            machines: loadState.machines,
            locale,
            copy,
          })
        : null}

      {loadState.status === 'ready'
        ? renderPrerequisitePanel({
            customers: loadState.customers,
            machineModels: loadState.machineModels,
            copy,
          })
        : null}

      {loadState.status === 'ready' &&
      loadState.customers.length > 0 &&
      loadState.machineModels.length > 0 &&
      loadState.machines.length === 0
        ? renderStatePanel({
            eyebrow: copy.records.eyebrow,
            title: copy.records.emptyTitle,
            body: copy.records.emptyBody,
          })
        : null}

      {loadState.status === 'ready' && loadState.machines.length > 0 ? (
        <section aria-label={messages.emptyState.ariaLabel} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
                {copy.records.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                {formatCount(loadState.machines.length, locale)} {copy.records.countLabel}
              </h2>
            </div>
          </div>

          <div className="grid gap-4">
            {loadState.machines.map((machine) =>
              renderMachineCard({
                machine,
                locale,
                copy,
              }),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
