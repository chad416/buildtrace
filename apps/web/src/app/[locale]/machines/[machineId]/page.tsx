import {
  appMessages,
  documentLabels,
  handoverCompletenessCopy,
  isSupportedLocale,
  qrPortalBuilderCopy,
  serviceTicketsCopy,
  type DocumentLabels,
  type HandoverCompletenessCopy,
  type QrPortalBuilderCopy,
  type ServiceTicketsCopy,
} from '@buildtrace/i18n';
import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
  machineStatuses,
  ticketPriorities,
  ticketStatuses,
  type CustomerHandoverCompleteness,
  type DocumentClassificationStatus,
  type DocumentVisibilityLevel,
} from '@buildtrace/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  addTicketCommentAction,
  assignMachineQrTokenAction,
  confirmMachineDocumentClassificationSuggestionAction,
  createCustomerHandoverExportAction,
  createCustomerHandoverExportDownloadUrlAction,
  createCustomerHandoverExportPdfDownloadUrlAction,
  createMachineDocumentDownloadUrlAction,
  createServiceTicketAction,
  disableMachineQrPortalAction,
  refreshMachineDocumentClassificationSuggestionAction,
  rotateMachineQrTokenAction,
  updateMachineDocumentCategoryAction,
  updateMachineDocumentVisibilityAction,
  updateMachineRecordAction,
  updateTicketStatusAction,
  uploadMachineDocumentAction,
} from '../actions';
import {
  listCustomerHandoverExports,
  type ListCustomerHandoverExportsResponse,
} from '@/customer-handover-export-api';
import { listDocuments, type DocumentMetadataApiModel } from '@/document-records-api';
import { getHandoverCompleteness } from '@/handover-completeness-api';
import { getMachineQrToken } from '@/qr-portal-builder-api';
import {
  listServiceTickets,
  listTicketComments,
  type ServiceTicketApiModel,
  type TicketCommentApiModel,
} from '@/service-tickets-api';
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
  readonly documentUpload?: string;
  readonly documentUploadError?: string;
  readonly documentCategory?: string;
  readonly documentCategoryError?: string;
  readonly documentVisibility?: string;
  readonly documentVisibilityError?: string;
  readonly documentDownloadError?: string;
  readonly documentClassification?: string;
  readonly documentClassificationError?: string;
  readonly handoverExport?: string;
  readonly handoverExportError?: string;
  readonly handoverExportDownloadUrl?: string;
  readonly handoverExportPdfDownloadUrl?: string;
  readonly handoverExportDownloadExpiry?: string;
  readonly handoverExportDownloadError?: string;
  readonly handoverExportSensitiveCategories?: string;
  readonly qrPortalAction?: string;
  readonly qrPortalError?: string;
  readonly ticketAction?: string;
  readonly ticketError?: string;
  readonly ticketId?: string;
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
      readonly documents: readonly DocumentMetadataApiModel[];
      readonly handoverCompleteness: CustomerHandoverCompleteness;
      readonly exportHistory: ListCustomerHandoverExportsResponse['exports'];
      readonly qrToken: string | null;
      readonly tickets: readonly ServiceTicketApiModel[];
      readonly ticketComments: readonly TicketCommentApiModel[];
    };

const statusClassNames = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  MAINTENANCE: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  OUT_OF_SERVICE: 'border-red-500/40 bg-red-950/30 text-red-200',
  ARCHIVED: 'border-stone-600 bg-stone-900 text-stone-300',
} satisfies Record<MachineRecordApiModel['status'], string>;

const documentVisibilityClassNames = {
  'customer-visible': 'border-sky-500/40 bg-sky-950/30 text-sky-200',
  internal: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  'sensitive-engineering': 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  restricted: 'border-red-500/40 bg-red-950/30 text-red-200',
} satisfies Record<DocumentVisibilityLevel, string>;

const documentClassificationStatusClassNames = {
  unclassified: 'border-stone-700 bg-stone-950/40 text-stone-300',
  classified: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  'needs-review': 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  'manually-confirmed': 'border-sky-500/40 bg-sky-950/30 text-sky-200',
} satisfies Record<DocumentClassificationStatus, string>;
function formatLoadError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown API error.';
}

function readStringSearchParam(
  searchParams: RawSearchParams | undefined,
  name: keyof MachineDetailSearchParams,
): string | undefined {
  const value = searchParams?.[name];

  return typeof value === 'string' ? value : undefined;
}

function normalizeSearchParams(
  searchParams: RawSearchParams | undefined,
): MachineDetailSearchParams {
  const machineUpdate = readStringSearchParam(searchParams, 'machineUpdate');
  const machineUpdateError = readStringSearchParam(searchParams, 'machineUpdateError');
  const documentUpload = readStringSearchParam(searchParams, 'documentUpload');
  const documentUploadError = readStringSearchParam(searchParams, 'documentUploadError');
  const documentCategory = readStringSearchParam(searchParams, 'documentCategory');
  const documentCategoryError = readStringSearchParam(searchParams, 'documentCategoryError');
  const documentVisibility = readStringSearchParam(searchParams, 'documentVisibility');
  const documentVisibilityError = readStringSearchParam(searchParams, 'documentVisibilityError');
  const documentDownloadError = readStringSearchParam(searchParams, 'documentDownloadError');
  const documentClassification = readStringSearchParam(searchParams, 'documentClassification');
  const documentClassificationError = readStringSearchParam(
    searchParams,
    'documentClassificationError',
  );
  const handoverExport = readStringSearchParam(searchParams, 'handoverExport');
  const handoverExportError = readStringSearchParam(searchParams, 'handoverExportError');
  const handoverExportDownloadUrl = readStringSearchParam(
    searchParams,
    'handoverExportDownloadUrl',
  );
  const handoverExportPdfDownloadUrl = readStringSearchParam(
    searchParams,
    'handoverExportPdfDownloadUrl',
  );
  const handoverExportDownloadExpiry = readStringSearchParam(
    searchParams,
    'handoverExportDownloadExpiry',
  );
  const handoverExportDownloadError = readStringSearchParam(
    searchParams,
    'handoverExportDownloadError',
  );
  const handoverExportSensitiveCategories = readStringSearchParam(
    searchParams,
    'handoverExportSensitiveCategories',
  );
  const qrPortalAction = readStringSearchParam(searchParams, 'qrPortalAction');
  const qrPortalError = readStringSearchParam(searchParams, 'qrPortalError');
  const ticketAction = readStringSearchParam(searchParams, 'ticketAction');
  const ticketError = readStringSearchParam(searchParams, 'ticketError');
  const ticketId = readStringSearchParam(searchParams, 'ticketId');

  return {
    ...(machineUpdate ? { machineUpdate } : {}),
    ...(machineUpdateError ? { machineUpdateError } : {}),
    ...(documentUpload ? { documentUpload } : {}),
    ...(documentUploadError ? { documentUploadError } : {}),
    ...(documentCategory ? { documentCategory } : {}),
    ...(documentCategoryError ? { documentCategoryError } : {}),
    ...(documentVisibility ? { documentVisibility } : {}),
    ...(documentVisibilityError ? { documentVisibilityError } : {}),
    ...(documentDownloadError ? { documentDownloadError } : {}),
    ...(documentClassification ? { documentClassification } : {}),
    ...(documentClassificationError ? { documentClassificationError } : {}),
    ...(handoverExport ? { handoverExport } : {}),
    ...(handoverExportError ? { handoverExportError } : {}),
    ...(handoverExportDownloadUrl ? { handoverExportDownloadUrl } : {}),
    ...(handoverExportPdfDownloadUrl ? { handoverExportPdfDownloadUrl } : {}),
    ...(handoverExportDownloadExpiry ? { handoverExportDownloadExpiry } : {}),
    ...(handoverExportDownloadError ? { handoverExportDownloadError } : {}),
    ...(handoverExportSensitiveCategories ? { handoverExportSensitiveCategories } : {}),
    ...(qrPortalAction ? { qrPortalAction } : {}),
    ...(qrPortalError ? { qrPortalError } : {}),
    ...(ticketAction ? { ticketAction } : {}),
    ...(ticketError ? { ticketError } : {}),
    ...(ticketId ? { ticketId } : {}),
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

function formatArchiveBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function buildPortalLink(qrToken: string): string {
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  return `${appBaseUrl}/portal/${encodeURIComponent(qrToken)}`;
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

function renderDocumentsSection({
  machine,
  documents,
  locale,
  copy,
  labels,
}: {
  readonly machine: MachineRecordApiModel;
  readonly documents: readonly DocumentMetadataApiModel[];
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
  readonly labels: DocumentLabels;
}) {
  const uploadAction = uploadMachineDocumentAction.bind(null, locale, machine.id);

  return (
    <section
      id="machine-documents"
      aria-labelledby="machine-documents-title"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        Document dump
      </p>
      <h2 id="machine-documents-title" className="mt-3 text-2xl font-semibold text-white">
        Machine documents
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
        Upload private machine files through the API boundary. Documents stay internal by default,
        and downloads use signed temporary URLs.
      </p>

      <form action={uploadAction} className="mt-6 grid gap-5">
        <div className="grid gap-5 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-200 md:col-span-3">
            File
            <input
              type="file"
              name="file"
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Category
            <select
              name="category"
              defaultValue="manuals"
              required
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            >
              {documentCategories.map((category) => (
                <option key={category} value={category}>
                  {labels.categories[category]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-200">
            Language
            <select
              name="language"
              defaultValue="unknown"
              className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
            >
              {documentLanguageCodes.map((language) => (
                <option key={language} value={language}>
                  {labels.languages[language]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
        >
          Upload document
        </button>
      </form>

      <div className="mt-8 grid gap-4">
        <h3 className="text-lg font-semibold text-white">{documents.length} documents loaded</h3>

        {documents.length === 0 ? (
          <p className="rounded-lg border border-stone-800 bg-black/30 p-4 text-sm leading-6 text-stone-300">
            No documents have been uploaded for this machine yet.
          </p>
        ) : null}

        {documents.map((document) => {
          const updateCategoryAction = updateMachineDocumentCategoryAction.bind(
            null,
            locale,
            machine.id,
            document.id,
          );
          const updateVisibilityAction = updateMachineDocumentVisibilityAction.bind(
            null,
            locale,
            machine.id,
            document.id,
          );
          const downloadAction = createMachineDocumentDownloadUrlAction.bind(
            null,
            locale,
            machine.id,
            document.id,
          );
          const refreshClassificationAction =
            refreshMachineDocumentClassificationSuggestionAction.bind(
              null,
              locale,
              machine.id,
              document.id,
            );
          const confirmClassificationAction =
            confirmMachineDocumentClassificationSuggestionAction.bind(
              null,
              locale,
              machine.id,
              document.id,
            );
          const canConfirmClassificationSuggestion =
            document.suggestedCategory !== null &&
            document.classificationStatus !== 'manually-confirmed';

          return (
            <article
              key={document.id}
              className="rounded-lg border border-stone-800 bg-black/30 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{document.fileName}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {labels.categories[document.category]}
                    {' - '}
                    {labels.languages[document.language]}
                    {' - uploaded '}
                    {formatDate(document.uploadedAt, locale, copy.records.unavailableLabel)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                    documentVisibilityClassNames[document.visibilityLevel]
                  }`}
                >
                  {labels.visibilityLevels[document.visibilityLevel]}
                </span>
              </div>

              <div className="mt-5 grid gap-3 border-t border-stone-800 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                      Classification suggestion
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-300">
                      Suggested category:{' '}
                      <span className="font-semibold text-stone-100">
                        {document.suggestedCategory
                          ? labels.categories[document.suggestedCategory]
                          : 'No suggestion'}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                      documentClassificationStatusClassNames[document.classificationStatus]
                    }`}
                  >
                    {labels.classificationStatuses[document.classificationStatus]}
                  </span>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                      Confidence
                    </dt>
                    <dd className="mt-1 text-sm text-stone-200">
                      {document.classificationConfidence === null
                        ? 'No confidence'
                        : `${document.classificationConfidence}%`}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                      Source
                    </dt>
                    <dd className="mt-1 text-sm text-stone-200">
                      {document.classificationSource
                        ? labels.classificationSources[document.classificationSource]
                        : 'No source'}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3">
                  <form action={refreshClassificationAction}>
                    <button
                      type="submit"
                      className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
                    >
                      Refresh suggestion
                    </button>
                  </form>

                  {canConfirmClassificationSuggestion ? (
                    <form action={confirmClassificationAction}>
                      <button
                        type="submit"
                        className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                      >
                        Confirm suggested category
                      </button>
                    </form>
                  ) : null}
                </div>

                {canConfirmClassificationSuggestion ? (
                  <p className="text-xs leading-5 text-amber-200">
                    Confirmation applies the suggested category only. Visibility stays unchanged.
                  </p>
                ) : null}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                <form
                  key={`${document.id}-${document.category}-category`}
                  action={updateCategoryAction}
                  className="grid gap-2"
                >
                  <label className="grid gap-2 text-sm font-semibold text-stone-200">
                    Category
                    <select
                      name="category"
                      defaultValue={document.category}
                      className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
                    >
                      {documentCategories.map((category) => (
                        <option key={category} value={category}>
                          {labels.categories[category]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs leading-5 text-amber-200">
                    Changing category applies that category&apos;s default visibility. Review
                    visibility before sharing with customers.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
                  >
                    Save category
                  </button>
                </form>

                <form
                  key={`${document.id}-${document.visibilityLevel}-visibility`}
                  action={updateVisibilityAction}
                  className="grid gap-2"
                >
                  <label className="grid gap-2 text-sm font-semibold text-stone-200">
                    Visibility
                    <select
                      name="visibilityLevel"
                      defaultValue={document.visibilityLevel}
                      className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
                    >
                      {documentVisibilityLevels.map((visibilityLevel) => (
                        <option key={visibilityLevel} value={visibilityLevel}>
                          {labels.visibilityLevels[visibilityLevel]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
                  >
                    Save visibility
                  </button>
                </form>

                <form action={downloadAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                  >
                    Create signed download
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
function renderHandoverCompleteness({
  completeness,
  copy,
  labels,
}: {
  readonly completeness: CustomerHandoverCompleteness;
  readonly copy: HandoverCompletenessCopy;
  readonly labels: DocumentLabels;
}) {
  const isComplete = completeness.missingCategories.length === 0;

  return (
    <section
      id="handover-readiness"
      aria-labelledby="machine-handover-readiness-title"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
            {copy.eyebrow}
          </p>
          <h2
            id="machine-handover-readiness-title"
            className="mt-3 text-2xl font-semibold text-white"
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">{copy.description}</p>
        </div>

        <p className="text-4xl font-semibold tracking-tight text-white">
          {completeness.percentage}%
        </p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-stone-300">
          <span className="font-semibold text-white">{completeness.completedCount}</span>{' '}
          {copy.completedLabel}
          {' / '}
          <span className="font-semibold text-white">{completeness.requiredCount}</span>{' '}
          {copy.requiredLabel}
        </p>

        <div
          role="progressbar"
          aria-label={copy.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completeness.percentage}
          className="mt-3 h-2 overflow-hidden rounded-full bg-stone-800"
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width]"
            style={{ width: String(completeness.percentage) + '%' }}
          />
        </div>
      </div>

      {isComplete ? (
        <p className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-100">
          {copy.completeMessage}
        </p>
      ) : (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white">{copy.missingTitle}</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {completeness.missingCategories.map((category) => (
              <li
                key={category}
                className="rounded-md border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100"
              >
                {labels.categories[category]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
function renderHandoverExportSection({
  machine,
  documents,
  handoverCopy,
  locale,
}: {
  readonly machine: MachineRecordApiModel;
  readonly documents: readonly DocumentMetadataApiModel[];
  readonly handoverCopy: HandoverCompletenessCopy;
  readonly locale: string;
}) {
  const eligibleDocuments = documents.filter(
    (doc) => doc.visibilityLevel === 'customer-visible' && doc.visibleToCustomer === true,
  );

  return (
    <section
      id="handover-export"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        {handoverCopy.export.sectionTitle}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
        {handoverCopy.export.sectionDescription}
      </p>

      {eligibleDocuments.length === 0 ? (
        <p className="mt-6 rounded-lg border border-stone-800 bg-black/30 p-4 text-sm leading-6 text-stone-300">
          {handoverCopy.export.noDocumentsMessage}
        </p>
      ) : (
        <form action={createCustomerHandoverExportAction} className="mt-6 grid gap-5">
          <input type="hidden" name="machineId" value={machine.id} />
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-3">
            {eligibleDocuments.map((document) => (
              <label key={document.id} className="flex items-center gap-3 text-sm text-stone-200">
                <input
                  type="checkbox"
                  name="documentIds"
                  value={document.id}
                  className="rounded border-stone-700 bg-black"
                />
                {document.fileName}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {handoverCopy.export.generateButtonLabel}
          </button>
        </form>
      )}
    </section>
  );
}

function renderHandoverExportHistory({
  exportHistory,
  machine,
  handoverCopy,
  locale,
}: {
  readonly exportHistory: ListCustomerHandoverExportsResponse['exports'];
  readonly machine: MachineRecordApiModel;
  readonly handoverCopy: HandoverCompletenessCopy;
  readonly locale: string;
}) {
  return (
    <section
      id="handover-export-history"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        {handoverCopy.export.historyTitle}
      </p>

      {exportHistory.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {handoverCopy.export.noHistoryMessage}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {exportHistory.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-stone-800 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-white">
                    {formatDate(entry.completedAt, locale, entry.createdAt)}
                  </p>
                  <p className="text-xs text-stone-400">
                    {entry.documentCount} {handoverCopy.export.documentsLabel}
                    {' · '}
                    {formatArchiveBytes(entry.archiveByteLength)} {handoverCopy.export.sizeLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={createCustomerHandoverExportDownloadUrlAction}>
                    <input type="hidden" name="machineId" value={machine.id} />
                    <input type="hidden" name="exportId" value={entry.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center rounded-md border border-sky-500/50 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:border-sky-300 hover:text-white"
                    >
                      {handoverCopy.export.downloadButtonLabel}
                    </button>
                  </form>
                  <form action={createCustomerHandoverExportPdfDownloadUrlAction}>
                    <input type="hidden" name="machineId" value={machine.id} />
                    <input type="hidden" name="exportId" value={entry.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center rounded-md border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                    >
                      {handoverCopy.export.downloadPdfButtonLabel}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function renderQrPortalSection({
  machine,
  qrToken,
  locale,
  copy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly qrToken: string | null;
  readonly locale: string;
  readonly copy: QrPortalBuilderCopy;
}) {
  const portalLink = qrToken ? buildPortalLink(qrToken) : null;

  return (
    <section
      id="qr-portal"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        {copy.sectionTitle}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">{copy.sectionDescription}</p>

      {qrToken === null ? (
        <div className="mt-6 grid gap-5">
          <p className="rounded-lg border border-stone-800 bg-black/30 p-4 text-sm leading-6 text-stone-300">
            {copy.noTokenMessage}
          </p>
          <form action={assignMachineQrTokenAction} className="grid gap-5">
            <input type="hidden" name="machineId" value={machine.id} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              {copy.assignButtonLabel}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
              {copy.qrTokenLabel}
            </p>
            <p className="mt-2 break-all font-mono text-sm text-stone-100">{qrToken}</p>
          </div>

          {portalLink ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-stone-500">
                {copy.portalLinkLabel}
              </p>
              <a
                href={portalLink}
                className="mt-2 inline-flex break-all text-sm font-semibold text-sky-200 transition hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                {portalLink}
              </a>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <form action={rotateMachineQrTokenAction}>
              <input type="hidden" name="machineId" value={machine.id} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-stone-700 px-5 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
              >
                {copy.rotateButtonLabel}
              </button>
            </form>

            <form action={disableMachineQrPortalAction}>
              <input type="hidden" name="machineId" value={machine.id} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-amber-500/50 bg-amber-950/30 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-white"
              >
                {copy.disableButtonLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function renderServiceTicketsSection({
  machine,
  tickets,
  ticketComments,
  ticketId,
  locale,
  copy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly tickets: readonly ServiceTicketApiModel[];
  readonly ticketComments: readonly TicketCommentApiModel[];
  readonly ticketId: string | undefined;
  readonly locale: string;
  readonly copy: ServiceTicketsCopy;
}) {
  return (
    <section
      id="service-tickets"
      className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
        {copy.sectionTitle}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">{copy.sectionDescription}</p>

      <div className="mt-6 grid gap-6">
        <div className="rounded-lg border border-stone-700 bg-black/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-normal text-stone-400">
            {copy.newTicketTitle}
          </p>
          <form action={createServiceTicketAction} className="mt-4 grid gap-4">
            <input type="hidden" name="machineId" value={machine.id} />
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-normal text-stone-400">
                {copy.titleLabel}
              </label>
              <input
                name="title"
                required
                className="rounded-md border border-stone-700 bg-black/30 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-normal text-stone-400">
                {copy.descriptionLabel}
              </label>
              <textarea
                name="description"
                required
                rows={3}
                className="rounded-md border border-stone-700 bg-black/30 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-normal text-stone-400">
                {copy.priorityLabel}
              </label>
              <select
                name="priority"
                defaultValue="normal"
                className="rounded-md border border-stone-700 bg-black/30 px-3 py-2 text-sm text-stone-100 focus:border-emerald-500/50 focus:outline-none"
              >
                {ticketPriorities.map((p) => (
                  <option key={p} value={p}>
                    {copy.priorityLabels[p]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              {copy.submitButtonLabel}
            </button>
          </form>
        </div>

        {tickets.length === 0 ? (
          <p className="rounded-lg border border-stone-800 bg-black/30 p-4 text-sm leading-6 text-stone-300">
            {copy.noTicketsMessage}
          </p>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => {
              const isSelected = ticketId === ticket.id;
              return (
                <article
                  key={ticket.id}
                  className="rounded-lg border border-stone-700 bg-black/20 p-5"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-100">{ticket.title}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {formatDate(ticket.createdAt, locale, '')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-950/30 px-2 py-0.5 text-xs font-semibold text-sky-200">
                        {copy.statusLabels[ticket.status]}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-stone-600 bg-stone-900 px-2 py-0.5 text-xs font-semibold text-stone-300">
                        {copy.priorityLabels[ticket.priority]}
                      </span>
                      {ticket.createdFromPortal ? (
                        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-xs font-semibold text-amber-200">
                          {copy.createdFromPortalBadgeLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-stone-300">{ticket.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <form action={updateTicketStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="machineId" value={machine.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <select
                        name="status"
                        defaultValue={ticket.status}
                        className="rounded-md border border-stone-700 bg-black/30 px-3 py-1.5 text-xs text-stone-100 focus:border-emerald-500/50 focus:outline-none"
                      >
                        {ticketStatuses.map((s) => (
                          <option key={s} value={s}>
                            {copy.statusLabels[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-white"
                      >
                        {copy.updateStatusLabel}
                      </button>
                    </form>

                    <Link
                      href={`/${locale}/machines/${encodeURIComponent(machine.id)}?ticketId=${encodeURIComponent(ticket.id)}`}
                      className="text-xs font-semibold text-sky-300 transition hover:text-white"
                    >
                      {copy.commentsTitle}
                    </Link>
                  </div>

                  {isSelected ? (
                    <div className="mt-5 border-t border-stone-700 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-normal text-stone-400">
                        {copy.commentsTitle}
                      </p>

                      {ticketComments.length === 0 ? (
                        <p className="mt-3 text-sm text-stone-400">{copy.noCommentsMessage}</p>
                      ) : (
                        <div className="mt-3 grid gap-3">
                          {ticketComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-md border border-stone-700 bg-black/20 p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase text-stone-400">
                                  {comment.authorType}
                                </span>
                                {comment.internalOnly ? (
                                  <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-950/30 px-2 py-0.5 text-xs font-semibold text-red-200">
                                    {copy.internalBadgeLabel}
                                  </span>
                                ) : null}
                                <span className="ml-auto text-xs text-stone-500">
                                  {formatDate(comment.createdAt, locale, '')}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-stone-200">
                                {comment.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form action={addTicketCommentAction} className="mt-4 grid gap-4">
                        <input type="hidden" name="machineId" value={machine.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <div className="grid gap-2">
                          <label className="text-xs font-semibold uppercase tracking-normal text-stone-400">
                            {copy.commentMessageLabel}
                          </label>
                          <textarea
                            name="message"
                            required
                            rows={3}
                            className="rounded-md border border-stone-700 bg-black/30 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/50 focus:outline-none"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-stone-300">
                          <input
                            type="checkbox"
                            name="internalOnly"
                            value="on"
                            className="rounded border-stone-600"
                          />
                          {copy.internalOnlyLabel}
                        </label>
                        <button
                          type="submit"
                          className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-stone-700 px-5 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
                        >
                          {copy.addCommentButtonLabel}
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function renderMachineDetail({
  machine,
  customers,
  machineModels,
  documents,
  locale,
  copy,
  createCopy,
  handoverCompleteness,
  handoverCopy,
  exportHistory,
  qrToken,
  qrPortalCopy,
  labels,
  sections,
  sectionsAriaLabel,
  tickets,
  ticketComments,
  ticketId,
  ticketsCopy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly documents: readonly DocumentMetadataApiModel[];
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
  readonly createCopy: (typeof machineRecordsCreateCopy)['en'];
  readonly handoverCompleteness: CustomerHandoverCompleteness;
  readonly handoverCopy: HandoverCompletenessCopy;
  readonly exportHistory: ListCustomerHandoverExportsResponse['exports'];
  readonly qrToken: string | null;
  readonly qrPortalCopy: QrPortalBuilderCopy;
  readonly labels: DocumentLabels;
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
  readonly tickets: readonly ServiceTicketApiModel[];
  readonly ticketComments: readonly TicketCommentApiModel[];
  readonly ticketId: string | undefined;
  readonly ticketsCopy: ServiceTicketsCopy;
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

      {renderHandoverCompleteness({
        completeness: handoverCompleteness,
        copy: handoverCopy,
        labels,
      })}

      {renderHandoverExportSection({
        machine,
        documents,
        handoverCopy,
        locale,
      })}

      {renderHandoverExportHistory({
        exportHistory,
        machine,
        handoverCopy,
        locale,
      })}

      {renderQrPortalSection({
        machine,
        qrToken,
        locale,
        copy: qrPortalCopy,
      })}

      {renderServiceTicketsSection({
        machine,
        tickets,
        ticketComments,
        ticketId,
        locale,
        copy: ticketsCopy,
      })}

      {renderMachineEditForm({
        machine,
        customers,
        machineModels,
        locale,
        createCopy,
      })}

      {renderDocumentsSection({
        machine,
        documents,
        locale,
        copy,
        labels,
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
  const labels = documentLabels[locale];
  const handoverCopy = handoverCompletenessCopy[locale];
  const qrPortalCopy = qrPortalBuilderCopy[locale];
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
      const [
        machine,
        customers,
        machineModels,
        documents,
        handoverCompleteness,
        exportHistoryResponse,
        machineQrTokenResponse,
        ticketsResponse,
      ] = await Promise.all([
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
        listDocuments({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
        getHandoverCompleteness({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
        listCustomerHandoverExports({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
        getMachineQrToken({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
        listServiceTickets({
          organizationId: session.organizationId,
          machineId,
          accessToken: session.accessToken,
        }),
      ]);

      let ticketComments: readonly TicketCommentApiModel[] = [];

      if (normalizedSearchParams.ticketId) {
        try {
          const commentsResponse = await listTicketComments({
            organizationId: session.organizationId,
            ticketId: normalizedSearchParams.ticketId,
            accessToken: session.accessToken,
          });
          ticketComments = commentsResponse.comments;
        } catch {
          ticketComments = [];
        }
      }

      loadState = {
        status: 'ready',
        machine,
        customers,
        machineModels,
        documents,
        handoverCompleteness,
        exportHistory: exportHistoryResponse.exports,
        qrToken: machineQrTokenResponse.qrToken,
        tickets: ticketsResponse.tickets,
        ticketComments,
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

      {loadState.status === 'ready' && normalizedSearchParams.documentUpload === 'uploaded'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Document uploaded',
            body: 'The document was uploaded through the private API storage boundary.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentCategory === 'updated'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Document category updated',
            body: 'The document category was updated through the API boundary.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentVisibility === 'updated'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Document visibility updated',
            body: 'The document visibility was updated through the API boundary.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentClassification === 'confirmed'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Document classification confirmed',
            body: 'The suggested category was applied explicitly without changing visibility.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentClassification === 'refreshed'
        ? renderFeedbackPanel({
            tone: 'success',
            title: 'Document classification refreshed',
            body: 'The suggestion was recalculated without changing category or visibility.',
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentClassificationError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Document classification could not be refreshed',
            body: normalizedSearchParams.documentClassificationError,
          })
        : null}
      {loadState.status === 'ready' && normalizedSearchParams.documentUploadError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Document could not be uploaded',
            body: normalizedSearchParams.documentUploadError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentCategoryError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Document category could not be updated',
            body: normalizedSearchParams.documentCategoryError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentVisibilityError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Document visibility could not be updated',
            body: normalizedSearchParams.documentVisibilityError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.documentDownloadError
        ? renderFeedbackPanel({
            tone: 'error',
            title: 'Signed download could not be created',
            body: normalizedSearchParams.documentDownloadError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.handoverExport === 'created'
        ? renderFeedbackPanel({
            tone: 'success',
            title: handoverCopy.export.sectionTitle,
            body: handoverCopy.export.createdMessage,
          })
        : null}

      {loadState.status === 'ready' &&
      normalizedSearchParams.handoverExport === 'created' &&
      normalizedSearchParams.handoverExportSensitiveCategories ? (
        <section className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-300">
            {handoverCopy.export.sensitiveWarning}
          </p>
          <p className="mt-3 text-sm leading-6 text-stone-200">
            {normalizedSearchParams.handoverExportSensitiveCategories
              .split(',')
              .map((category) => {
                const trimmed = category.trim();
                return labels.categories[trimmed as keyof typeof labels.categories] ?? trimmed;
              })
              .join(', ')}
          </p>
        </section>
      ) : null}

      {loadState.status === 'ready' && normalizedSearchParams.handoverExportError
        ? renderFeedbackPanel({
            tone: 'error',
            title: handoverCopy.export.errorTitle,
            body: normalizedSearchParams.handoverExportError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.handoverExportDownloadUrl ? (
        <section className="rounded-lg border border-sky-500/40 bg-sky-950/20 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-normal text-sky-300">
            {handoverCopy.export.downloadButtonLabel}
          </p>
          <a
            href={normalizedSearchParams.handoverExportDownloadUrl}
            className="mt-3 inline-flex items-center rounded-md border border-sky-500/50 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {handoverCopy.export.downloadButtonLabel}
          </a>
        </section>
      ) : null}

      {loadState.status === 'ready' && normalizedSearchParams.handoverExportPdfDownloadUrl ? (
        <section className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
            {handoverCopy.export.downloadPdfButtonLabel}
          </p>
          <a
            href={normalizedSearchParams.handoverExportPdfDownloadUrl}
            className="mt-3 inline-flex items-center rounded-md border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {handoverCopy.export.downloadPdfButtonLabel}
          </a>
        </section>
      ) : null}

      {loadState.status === 'ready' && normalizedSearchParams.handoverExportDownloadError
        ? renderFeedbackPanel({
            tone: 'error',
            title: handoverCopy.export.errorTitle,
            body: normalizedSearchParams.handoverExportDownloadError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.qrPortalAction === 'assigned'
        ? renderFeedbackPanel({
            tone: 'success',
            title: qrPortalCopy.sectionTitle,
            body: qrPortalCopy.assignedMessage,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.qrPortalAction === 'rotated'
        ? renderFeedbackPanel({
            tone: 'success',
            title: qrPortalCopy.sectionTitle,
            body: qrPortalCopy.rotatedMessage,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.qrPortalAction === 'disabled'
        ? renderFeedbackPanel({
            tone: 'success',
            title: qrPortalCopy.sectionTitle,
            body: qrPortalCopy.disabledMessage,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.qrPortalError
        ? renderFeedbackPanel({
            tone: 'error',
            title: qrPortalCopy.errorTitle,
            body: normalizedSearchParams.qrPortalError,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.ticketAction
        ? renderFeedbackPanel({
            tone: 'success',
            title: serviceTicketsCopy[locale].sectionTitle,
            body: normalizedSearchParams.ticketAction,
          })
        : null}

      {loadState.status === 'ready' && normalizedSearchParams.ticketError
        ? renderFeedbackPanel({
            tone: 'error',
            title: serviceTicketsCopy[locale].errorTitle,
            body: normalizedSearchParams.ticketError,
          })
        : null}

      {loadState.status === 'ready'
        ? renderMachineDetail({
            machine: loadState.machine,
            customers: loadState.customers,
            machineModels: loadState.machineModels,
            documents: loadState.documents,
            locale,
            copy,
            createCopy,
            handoverCompleteness: loadState.handoverCompleteness,
            handoverCopy,
            exportHistory: loadState.exportHistory,
            qrToken: loadState.qrToken,
            qrPortalCopy,
            labels,
            sections: sections.filter(
              (section) => section.id !== 'documents' && section.id !== 'handover-readiness',
            ),
            sectionsAriaLabel: messages.sectionsAriaLabel,
            tickets: loadState.tickets,
            ticketComments: loadState.ticketComments,
            ticketId: normalizedSearchParams.ticketId,
            ticketsCopy: serviceTicketsCopy[locale],
          })
        : null}
    </div>
  );
}
