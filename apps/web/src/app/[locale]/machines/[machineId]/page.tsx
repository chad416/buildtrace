import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
  machineStatuses,
  type DocumentCategory,
  type DocumentClassificationSource,
  type DocumentClassificationStatus,
  type DocumentLanguageCode,
  type DocumentVisibilityLevel,
} from '@buildtrace/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  confirmMachineDocumentClassificationSuggestionAction,
  createMachineDocumentDownloadUrlAction,
  refreshMachineDocumentClassificationSuggestionAction,
  updateMachineDocumentCategoryAction,
  updateMachineDocumentVisibilityAction,
  updateMachineRecordAction,
  uploadMachineDocumentAction,
} from '../actions';
import { listDocuments, type DocumentMetadataApiModel } from '@/document-records-api';
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
    };

const statusClassNames = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  MAINTENANCE: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  OUT_OF_SERVICE: 'border-red-500/40 bg-red-950/30 text-red-200',
  ARCHIVED: 'border-stone-600 bg-stone-900 text-stone-300',
} satisfies Record<MachineRecordApiModel['status'], string>;

const documentCategoryLabels = {
  plc: 'PLC',
  hmi: 'HMI',
  'mechanical-drawings': 'Mechanical drawings',
  'electrical-drawings': 'Electrical drawings',
  cad: 'CAD',
  'machine-photos': 'Machine photos',
  fat: 'FAT',
  sat: 'SAT',
  manuals: 'Manuals',
  'safety-instructions': 'Safety instructions',
  'supplier-documents': 'Supplier documents',
  'spare-parts-bom': 'Spare parts BOM',
  certificates: 'Certificates',
  'service-notes': 'Service notes',
  other: 'Other',
} satisfies Record<DocumentCategory, string>;

const documentVisibilityLabels = {
  'customer-visible': 'Customer visible',
  internal: 'Internal',
  'sensitive-engineering': 'Sensitive engineering',
  restricted: 'Restricted',
} satisfies Record<DocumentVisibilityLevel, string>;

const documentLanguageLabels = {
  en: 'English',
  cs: 'Czech',
  sk: 'Slovak',
  pl: 'Polish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  unknown: 'Unknown',
} satisfies Record<DocumentLanguageCode, string>;

const documentVisibilityClassNames = {
  'customer-visible': 'border-sky-500/40 bg-sky-950/30 text-sky-200',
  internal: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  'sensitive-engineering': 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  restricted: 'border-red-500/40 bg-red-950/30 text-red-200',
} satisfies Record<DocumentVisibilityLevel, string>;

const documentClassificationStatusLabels = {
  unclassified: 'Unclassified',
  classified: 'Suggested',
  'needs-review': 'Needs review',
  'manually-confirmed': 'Manually confirmed',
} satisfies Record<DocumentClassificationStatus, string>;

const documentClassificationSourceLabels = {
  'filename-type': 'Filename',
  manual: 'Manual',
} satisfies Record<DocumentClassificationSource, string>;

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

function renderDocumentsSection({
  machine,
  documents,
  locale,
  copy,
}: {
  readonly machine: MachineRecordApiModel;
  readonly documents: readonly DocumentMetadataApiModel[];
  readonly locale: string;
  readonly copy: (typeof machineRecordsPageCopy)['en'];
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
                  {documentCategoryLabels[category]}
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
                  {documentLanguageLabels[language]}
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
                    {documentCategoryLabels[document.category]}
                    {' - '}
                    {documentLanguageLabels[document.language]}
                    {' - uploaded '}
                    {formatDate(document.uploadedAt, locale, copy.records.unavailableLabel)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                    documentVisibilityClassNames[document.visibilityLevel]
                  }`}
                >
                  {documentVisibilityLabels[document.visibilityLevel]}
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
                          ? documentCategoryLabels[document.suggestedCategory]
                          : 'No suggestion'}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                      documentClassificationStatusClassNames[document.classificationStatus]
                    }`}
                  >
                    {documentClassificationStatusLabels[document.classificationStatus]}
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
                        ? documentClassificationSourceLabels[document.classificationSource]
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
                <form action={updateCategoryAction} className="grid gap-2">
                  <label className="grid gap-2 text-sm font-semibold text-stone-200">
                    Category
                    <select
                      name="category"
                      defaultValue={document.category}
                      className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
                    >
                      {documentCategories.map((category) => (
                        <option key={category} value={category}>
                          {documentCategoryLabels[category]}
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

                <form action={updateVisibilityAction} className="grid gap-2">
                  <label className="grid gap-2 text-sm font-semibold text-stone-200">
                    Visibility
                    <select
                      name="visibilityLevel"
                      defaultValue={document.visibilityLevel}
                      className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-emerald-400"
                    >
                      {documentVisibilityLevels.map((visibilityLevel) => (
                        <option key={visibilityLevel} value={visibilityLevel}>
                          {documentVisibilityLabels[visibilityLevel]}
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
function renderMachineDetail({
  machine,
  customers,
  machineModels,
  documents,
  locale,
  copy,
  createCopy,
  sections,
  sectionsAriaLabel,
}: {
  readonly machine: MachineRecordApiModel;
  readonly customers: readonly CustomerRecordApiModel[];
  readonly machineModels: readonly MachineModelRecordApiModel[];
  readonly documents: readonly DocumentMetadataApiModel[];
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

      {renderDocumentsSection({
        machine,
        documents,
        locale,
        copy,
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
      const [machine, customers, machineModels, documents] = await Promise.all([
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
      ]);

      loadState = {
        status: 'ready',
        machine,
        customers,
        machineModels,
        documents,
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

      {loadState.status === 'ready'
        ? renderMachineDetail({
            machine: loadState.machine,
            customers: loadState.customers,
            machineModels: loadState.machineModels,
            documents: loadState.documents,
            locale,
            copy,
            createCopy,
            sections: sections.filter((section) => section.id !== 'documents'),
            sectionsAriaLabel: messages.sectionsAriaLabel,
          })
        : null}
    </div>
  );
}
