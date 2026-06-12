import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getMachineRecord, type MachineRecordApiModel } from '@/machine-records-api';
import { machineRecordsPageCopy } from '@/machine-records-page-copy';
import {
  readMachineRecordsSession,
  type MachineRecordsSessionMissingField,
} from '@/machine-records-session';

type PageProps = {
  params: Promise<{
    locale: string;
    machineId: string;
  }>;
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

function renderDetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5">
      <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">{label}</dt>
      <dd className="mt-2 text-base font-medium text-stone-100">{value}</dd>
    </div>
  );
}

function renderMachineDetail({
  machine,
  locale,
  copy,
  sections,
  sectionsAriaLabel,
}: {
  readonly machine: MachineRecordApiModel;
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
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

export default async function MachineDetailPage({ params }: PageProps) {
  const { locale, machineId } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.machineDetail;
  const copy = machineRecordsPageCopy[locale];
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
      loadState = {
        status: 'ready',
        machine: await getMachineRecord({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
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

      {loadState.status === 'ready'
        ? renderMachineDetail({
            machine: loadState.machine,
            locale,
            copy,
            sections,
            sectionsAriaLabel: messages.sectionsAriaLabel,
          })
        : null}
    </div>
  );
}
