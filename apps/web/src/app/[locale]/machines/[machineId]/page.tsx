import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { machineStatuses } from '@buildtrace/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { updateMachineRecordAction } from '../actions';
import {
  getMachineRecord,
  listCustomers,
  listMachineModels,
  type CustomerRecordApiModel,
  type MachineModelRecordApiModel,
  type MachineRecordApiModel,
} from '@/machine-records-api';
import { machineRecordsCreateCopy } from '@/machine-records-create-copy';
import { machineRecordsPageCopy } from '@/machine-records-page-copy';
import {
  readMachineRecordsSession,
  type MachineRecordsSessionMissingField,
} from '@/machine-records-session';

type RawSearchParams = Record<string, string | readonly string[] | undefined>;

type MachineDetailSearchParams = {
  readonly machineUpdate?: string;
  readonly machineUpdateError?: string;
};

type PageProps = {
  params: Promise<{
    locale: string;
    machineId: string;
  }>;
  searchParams?: Promise<RawSearchParams>;
};

type MachineDetailLoadState =
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
      readonly machine: MachineRecordApiModel;
      readonly customers: readonly CustomerRecordApiModel[];
      readonly machineModels: readonly MachineModelRecordApiModel[];
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

function normalizeSearchParams(
  searchParams: RawSearchParams | undefined,
): MachineDetailSearchParams {
  const machineUpdate = searchParams?.machineUpdate;
  const machineUpdateError = searchParams?.machineUpdateError;

  return {
    ...(typeof machineUpdate === 'string' ? { machineUpdate } : {}),
    ...(typeof machineUpdateError === 'string' ? { machineUpdateError } : {}),
  };
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

function formatDateInput(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.slice(0, 10);
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
      ? 'rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-5 sm:p-6'
      : 'rounded-lg border border-red-500/40 bg-red-950/20 p-5 sm:p-6';

  return (
    <section className={className}>
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">{title}</p>
      <p className="mt-3 text-sm leading-6 text-stone-200">{body}</p>
    </section>
  );
}

function renderDetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5">
      <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">{label}</dt>
      <dd className="mt-2 text-base font-medium text-stone-100">{value}</dd>
    </div>
  );
}

function renderMachineEditForm({
  machine,
  customers,
  machineModels,
  locale,
  createCopy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly locale: string;
  readonly createCopy: (typeof machineRecordsCreateCopy)['en'];
}) {
  const updateAction = updateMachineRecordAction.bind(null, locale, machine.id);

  return (
    <section className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        Update machine
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
        Edit machine record
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
        Save machine changes through the web server action and API PATCH boundary.
      </p>

      <form action={updateAction} className="mt-6 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.customerLabel}
            <select
              name="customerId"
              defaultValue={machine.customerId}
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.modelLabel}
            <select
              name="machineModelId"
              defaultValue={machine.machineModelId}
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            >
              {machineModels.map((machineModel) => (
                <option key={machineModel.id} value={machineModel.id}>
                  {machineModel.modelName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.machineNameLabel}
            <input
              name="machineName"
              defaultValue={machine.machineName}
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.serialNumberLabel}
            <input
              name="serialNumber"
              defaultValue={machine.serialNumber}
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.statusLabel}
            <select
              name="status"
              defaultValue={machine.status}
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            >
              {machineStatuses.map((status) => (
                <option key={status} value={status}>
                  {createCopy.statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.deliveryDateLabel}
            <input
              type="date"
              name="deliveryDate"
              defaultValue={formatDateInput(machine.deliveryDate)}
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.plcLabel}
            <input
              name="plcType"
              defaultValue={machine.plcType ?? ''}
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            {createCopy.form.hmiLabel}
            <input
              name="hmiType"
              defaultValue={machine.hmiType ?? ''}
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
        >
          Save machine changes
        </button>
      </form>
    </section>
  );
}

function renderMachineDetail({
  machine,
  customers,
  machineModels,
  locale,
  copy,
  createCopy,
  sections,
  sectionsAriaLabel,
}: {
  readonly machine: MachineRecordApiModel;
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
  readonly createCopy: (typeof machineRecordsCreateCopy)['en'];
  readonly sections: readonly {
    readonly id: string;
    readonly titleId: string;
    readonly messages: {
      readonly eyebrow: string;
      readonly title: string;
      readonly body: string;
    };
  }[];
  readonly sectionsAriaLabel: string;
}) {
  return (
    <>
      <section
        aria-labelledby="machine-record-detail-title"
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-start"
      >
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            {machine.customer.companyName}
          </p>
          <h1
            id="machine-record-detail-title"
            className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl md:text-5xl"
          >
            {machine.machineName}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
            {copy.records.modelLabel}: {machine.machineModel.modelName}
          </p>
        </div>

        <aside
          aria-label={copy.records.statusLabel}
          className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
            {copy.records.statusLabel}
          </p>
          <span
            className={`mt-3 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
              statusClassNames[machine.status]
            }`}
          >
            {copy.statusLabels[machine.status]}
          </span>
          <p className="mt-5 text-sm leading-6 text-stone-300">
            {copy.records.updatedAtLabel}:{' '}
            {formatDate(machine.updatedAt, locale, copy.records.unavailableLabel)}
          </p>
        </aside>
      </section>

      <section aria-label={copy.records.eyebrow}>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {renderDetailField({
            label: copy.records.customerLabel,
            value: machine.customer.companyName,
          })}
          {renderDetailField({
            label: copy.records.modelLabel,
            value: machine.machineModel.modelName,
          })}
          {renderDetailField({
            label: copy.records.serialLabel,
            value: machine.serialNumber,
          })}
          {renderDetailField({
            label: copy.records.deliveryDateLabel,
            value: formatDate(machine.deliveryDate, locale, copy.records.unavailableLabel),
          })}
          {renderDetailField({
            label: copy.records.plcLabel,
            value: machine.plcType ?? copy.records.unavailableLabel,
          })}
          {renderDetailField({
            label: copy.records.hmiLabel,
            value: machine.hmiType ?? copy.records.unavailableLabel,
          })}
        </dl>
      </section>

      {renderMachineEditForm({
        machine,
        customers,
        machineModels,
        locale,
        createCopy,
      })}

      <section aria-label={sectionsAriaLabel} className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.id}
            id={section.id}
            aria-labelledby={section.titleId}
            className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
              {section.messages.eyebrow}
            </p>
            <h2
              id={section.titleId}
              className="mt-3 text-xl font-semibold tracking-normal text-white"
            >
              {section.messages.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{section.messages.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export default async function MachineDetailPage({ params, searchParams }: PageProps) {
  const { locale, machineId } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const normalizedSearchParams = normalizeSearchParams(resolvedSearchParams);
  const messages = appMessages[locale].pages.machineDetail;
  const copy = machineRecordsPageCopy[locale];
  const createCopy = machineRecordsCreateCopy[locale];
  const session = await readMachineRecordsSession();

  const sections = [
    {
      id: 'machine-overview',
      titleId: 'machine-overview-title',
      messages: messages.sections.overview,
    },
    {
      id: 'handover-readiness',
      titleId: 'machine-handover-readiness-title',
      messages: messages.sections.handoverReadiness,
    },
    {
      id: 'documents',
      titleId: 'machine-documents-title',
      messages: messages.sections.documents,
    },
    {
      id: 'tickets',
      titleId: 'machine-tickets-title',
      messages: messages.sections.tickets,
    },
    {
      id: 'software-timeline',
      titleId: 'machine-software-timeline-title',
      messages: messages.sections.softwareTimeline,
    },
    {
      id: 'spare-parts',
      titleId: 'machine-spare-parts-title',
      messages: messages.sections.spareParts,
    },
  ] as const;

  let loadState: MachineDetailLoadState;

  if (session.status === 'missing') {
    loadState = {
      status: 'auth-required',
      missingFields: session.missingFields,
    };
  } else {
    try {
      const [machine, customers, machineModels] = await Promise.all([
        getMachineRecord({
          organizationId: session.organizationId,
          machineId,
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
        machine,
        customers,
        machineModels,
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

      {loadState.status === 'ready' && normalizedSearchParams.machineUpdate === 'updated'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Machine record updated',
            body: 'The machine was updated through the API PATCH boundary and the detail view has refreshed.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.machineUpdateError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Machine record could not be updated',
            body: normalizedSearchParams.machineUpdateError,
          })
        : null}

      {loadState.status === 'ready'
        ? renderMachineDetail({
            machine: loadState.machine,
            customers: loadState.customers,
            machineModels: loadState.machineModels,
            locale,
            copy,
            createCopy,
            sections,
            sectionsAriaLabel: messages.sectionsAriaLabel,
          })
        : null}
    </div>
  );
}
