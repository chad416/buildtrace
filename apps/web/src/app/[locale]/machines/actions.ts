'use server';

import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
  machineStatuses,
  supportedLocales,
  type DocumentCategory,
  type DocumentLanguageCode,
  type DocumentVisibilityLevel,
  type MachineStatus,
  type SupportedLocale,
} from '@buildtrace/shared';
import { redirect } from 'next/navigation';

import {
  createCustomerHandoverExport,
  createCustomerHandoverExportDownloadUrl,
  createCustomerHandoverExportPdfDownloadUrl,
} from '@/customer-handover-export-api';
import {
  applyDocumentClassificationSuggestion,
  confirmDocumentClassificationSuggestion,
  createDocumentDownloadUrl,
  updateDocumentCategory,
  updateDocumentVisibility,
  uploadDocument,
  type ApplyDocumentClassificationSuggestionApiInput,
  type ConfirmDocumentClassificationSuggestionApiInput,
  type CreateDocumentDownloadUrlApiInput,
  type UpdateDocumentCategoryApiInput,
  type UpdateDocumentVisibilityApiInput,
  type UploadDocumentApiInput,
} from '@/document-records-api';
import {
  createCustomer,
  createMachineModel,
  createMachineRecord,
  updateMachineRecord,
  type CreateCustomerApiInput,
  type CreateMachineModelApiInput,
  type CreateMachineRecordApiInput,
  type UpdateMachineRecordApiInput,
} from '@/machine-records-api';
import { readMachineRecordsSession } from '@/machine-records-session';

function formatActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown machine record action error.';
}

function redirectWithError(locale: string, queryName: string, message: string): never {
  redirect(`/${locale}/machines?${queryName}=${encodeURIComponent(message)}`);
}

function redirectMachineDetailWithError(locale: string, machineId: string, message: string): never {
  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?machineUpdateError=${encodeURIComponent(
      message,
    )}`,
  );
}

function readRequiredFormText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);

  if (typeof value !== 'string') {
    throw new Error(`${label} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

function readOptionalFormText(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if (value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readOptionalPreferredLocale(formData: FormData): SupportedLocale | undefined {
  const preferredLocale = readOptionalFormText(formData, 'preferredLocale');

  if (!preferredLocale) {
    return undefined;
  }

  if (!supportedLocales.includes(preferredLocale as SupportedLocale)) {
    throw new Error(`Preferred locale is not supported: ${preferredLocale}`);
  }

  return preferredLocale as SupportedLocale;
}

function readOptionalMachineStatus(formData: FormData): MachineStatus | undefined {
  const status = readOptionalFormText(formData, 'status');

  if (!status) {
    return undefined;
  }

  if (!machineStatuses.includes(status as MachineStatus)) {
    throw new Error(`Machine status is not supported: ${status}`);
  }

  return status as MachineStatus;
}

export async function createCustomerRecordAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'customerCreateError',
      'Customer creation needs a signed-in workspace.',
    );
  }

  try {
    const contactName = readOptionalFormText(formData, 'contactName');
    const email = readOptionalFormText(formData, 'email');
    const phone = readOptionalFormText(formData, 'phone');
    const country = readOptionalFormText(formData, 'country');
    const preferredLocale = readOptionalPreferredLocale(formData);

    const input: CreateCustomerApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      companyName: readRequiredFormText(formData, 'companyName', 'Customer company name'),
      ...(contactName ? { contactName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(country ? { country } : {}),
      ...(preferredLocale ? { preferredLocale } : {}),
    };

    await createCustomer(input);
  } catch (error) {
    redirectWithError(redirectLocale, 'customerCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?customerCreate=created`);
}

export async function createMachineModelRecordAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'machineModelCreateError',
      'Machine model creation needs a signed-in workspace.',
    );
  }

  try {
    const description = readOptionalFormText(formData, 'description');

    const input: CreateMachineModelApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      modelName: readRequiredFormText(formData, 'modelName', 'Machine model name'),
      ...(description ? { description } : {}),
    };

    await createMachineModel(input);
  } catch (error) {
    redirectWithError(redirectLocale, 'machineModelCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?machineModelCreate=created`);
}

export async function createMachineRecordAction(locale: string, formData: FormData): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'machineCreateError',
      'Machine creation needs a signed-in workspace.',
    );
  }

  try {
    const deliveryDate = readOptionalFormText(formData, 'deliveryDate');
    const plcType = readOptionalFormText(formData, 'plcType');
    const hmiType = readOptionalFormText(formData, 'hmiType');
    const status = readOptionalMachineStatus(formData);

    const input: CreateMachineRecordApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      customerId: readRequiredFormText(formData, 'customerId', 'Customer'),
      machineModelId: readRequiredFormText(formData, 'machineModelId', 'Machine model'),
      machineName: readRequiredFormText(formData, 'machineName', 'Machine name'),
      serialNumber: readRequiredFormText(formData, 'serialNumber', 'Serial number'),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(plcType ? { plcType } : {}),
      ...(hmiType ? { hmiType } : {}),
      ...(status ? { status } : {}),
    };

    await createMachineRecord(input);
  } catch (error) {
    redirectWithError(redirectLocale, 'machineCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?machineCreate=created`);
}

export async function updateMachineRecordAction(
  locale: string,
  machineId: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = machineId.trim();

  if (!normalizedMachineId) {
    redirectWithError(redirectLocale, 'machineUpdateError', 'Machine ID is required.');
  }

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Machine update needs a signed-in workspace.',
    );
  }

  try {
    const deliveryDate = readOptionalFormText(formData, 'deliveryDate');
    const plcType = readOptionalFormText(formData, 'plcType');
    const hmiType = readOptionalFormText(formData, 'hmiType');
    const status = readOptionalMachineStatus(formData);

    const input: UpdateMachineRecordApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      customerId: readRequiredFormText(formData, 'customerId', 'Customer'),
      machineModelId: readRequiredFormText(formData, 'machineModelId', 'Machine model'),
      machineName: readRequiredFormText(formData, 'machineName', 'Machine name'),
      serialNumber: readRequiredFormText(formData, 'serialNumber', 'Serial number'),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(plcType ? { plcType } : {}),
      ...(hmiType ? { hmiType } : {}),
      ...(status ? { status } : {}),
    };

    await updateMachineRecord(input);
  } catch (error) {
    redirectMachineDetailWithError(redirectLocale, normalizedMachineId, formatActionError(error));
  }

  redirect(
    `/${redirectLocale}/machines/${encodeURIComponent(normalizedMachineId)}?machineUpdate=updated`,
  );
}

function redirectMachineDocumentActionWithError({
  locale,
  machineId,
  errorQueryName,
  error,
}: {
  readonly locale: string;
  readonly machineId: string;
  readonly errorQueryName: string;
  readonly error: unknown;
}): never {
  redirect(
    `/${encodeURIComponent(locale)}/machines/${encodeURIComponent(machineId)}?${errorQueryName}=${encodeURIComponent(
      formatActionError(error),
    )}`,
  );
}

function readRequiredDocumentCategory(formData: FormData): DocumentCategory {
  const category = readRequiredFormText(formData, 'category', 'Document category');

  if (!documentCategories.includes(category as DocumentCategory)) {
    throw new Error('Document category is not supported.');
  }

  return category as DocumentCategory;
}

function readOptionalDocumentLanguage(formData: FormData): DocumentLanguageCode | undefined {
  const language = readOptionalFormText(formData, 'language');

  if (!language) {
    return undefined;
  }

  if (!documentLanguageCodes.includes(language as DocumentLanguageCode)) {
    throw new Error('Document language is not supported.');
  }

  return language as DocumentLanguageCode;
}

function readRequiredDocumentVisibilityLevel(formData: FormData): DocumentVisibilityLevel {
  const visibilityLevel = readRequiredFormText(
    formData,
    'visibilityLevel',
    'Document visibility level',
  );

  if (!documentVisibilityLevels.includes(visibilityLevel as DocumentVisibilityLevel)) {
    throw new Error('Document visibility level is not supported.');
  }

  return visibilityLevel as DocumentVisibilityLevel;
}

function readRequiredDocumentFile(formData: FormData): File {
  const value = formData.get('file');

  if (!(value instanceof File)) {
    throw new Error('Document file is required.');
  }

  if (value.size <= 0) {
    throw new Error('Document file must not be empty.');
  }

  if (!value.name.trim()) {
    throw new Error('Document file name is required.');
  }

  return value;
}

function normalizeDocumentActionId(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

export async function uploadMachineDocumentAction(
  locale: string,
  machineId: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document action needs a signed-in workspace.',
    );
  }

  try {
    const file = readRequiredDocumentFile(formData);
    const language = readOptionalDocumentLanguage(formData);

    const input: UploadDocumentApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      file,
      fileName: file.name,
      category: readRequiredDocumentCategory(formData),
      ...(language ? { language } : {}),
    };

    await uploadDocument(input);
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentUploadError',
      error,
    });
  }

  redirect(
    `/${encodeURIComponent(redirectLocale)}/machines/${encodeURIComponent(
      normalizedMachineId,
    )}?documentUpload=uploaded`,
  );
}

export async function updateMachineDocumentCategoryAction(
  locale: string,
  machineId: string,
  documentId: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');
  const normalizedDocumentId = normalizeDocumentActionId(documentId, 'Document id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document action needs a signed-in workspace.',
    );
  }

  try {
    const input: UpdateDocumentCategoryApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      documentId: normalizedDocumentId,
      category: readRequiredDocumentCategory(formData),
    };

    await updateDocumentCategory(input);
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentCategoryError',
      error,
    });
  }

  redirect(
    `/${encodeURIComponent(redirectLocale)}/machines/${encodeURIComponent(
      normalizedMachineId,
    )}?documentCategory=updated`,
  );
}

export async function updateMachineDocumentVisibilityAction(
  locale: string,
  machineId: string,
  documentId: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');
  const normalizedDocumentId = normalizeDocumentActionId(documentId, 'Document id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document action needs a signed-in workspace.',
    );
  }

  try {
    const input: UpdateDocumentVisibilityApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      documentId: normalizedDocumentId,
      visibilityLevel: readRequiredDocumentVisibilityLevel(formData),
    };

    await updateDocumentVisibility(input);
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentVisibilityError',
      error,
    });
  }

  redirect(
    `/${encodeURIComponent(redirectLocale)}/machines/${encodeURIComponent(
      normalizedMachineId,
    )}?documentVisibility=updated`,
  );
}

export async function createMachineDocumentDownloadUrlAction(
  locale: string,
  machineId: string,
  documentId: string,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');
  const normalizedDocumentId = normalizeDocumentActionId(documentId, 'Document id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document action needs a signed-in workspace.',
    );
  }

  let downloadUrl: string;

  try {
    const input: CreateDocumentDownloadUrlApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      documentId: normalizedDocumentId,
    };

    downloadUrl = (await createDocumentDownloadUrl(input)).downloadUrl;
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentDownloadError',
      error,
    });
  }

  redirect(downloadUrl);
}
export async function refreshMachineDocumentClassificationSuggestionAction(
  locale: string,
  machineId: string,
  documentId: string,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');
  const normalizedDocumentId = normalizeDocumentActionId(documentId, 'Document id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document classification refresh needs a signed-in workspace.',
    );
  }

  try {
    const input: ApplyDocumentClassificationSuggestionApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      documentId: normalizedDocumentId,
    };

    await applyDocumentClassificationSuggestion(input);
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentClassificationError',
      error,
    });
  }

  redirect(
    `/${encodeURIComponent(redirectLocale)}/machines/${encodeURIComponent(
      normalizedMachineId,
    )}?documentClassification=refreshed`,
  );
}
export async function confirmMachineDocumentClassificationSuggestionAction(
  locale: string,
  machineId: string,
  documentId: string,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const normalizedMachineId = normalizeDocumentActionId(machineId, 'Machine id');
  const normalizedDocumentId = normalizeDocumentActionId(documentId, 'Document id');

  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectMachineDetailWithError(
      redirectLocale,
      normalizedMachineId,
      'Document classification confirmation needs a signed-in workspace.',
    );
  }

  try {
    const input: ConfirmDocumentClassificationSuggestionApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      machineId: normalizedMachineId,
      documentId: normalizedDocumentId,
    };

    await confirmDocumentClassificationSuggestion(input);
  } catch (error) {
    redirectMachineDocumentActionWithError({
      locale: redirectLocale,
      machineId: normalizedMachineId,
      errorQueryName: 'documentClassificationError',
      error,
    });
  }

  redirect(
    `/${encodeURIComponent(redirectLocale)}/machines/${encodeURIComponent(
      normalizedMachineId,
    )}?documentClassification=confirmed`,
  );
}

export async function createCustomerHandoverExportAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const requestedLocale = ((formData.get('locale') as string | null) ?? '').trim();
  const locale = supportedLocales.includes(requestedLocale as SupportedLocale)
    ? (requestedLocale as SupportedLocale)
    : 'en';
  const documentIds = formData.getAll('documentIds') as string[];

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportError=${encodeURIComponent('Session required')}`,
    );
  }

  if (documentIds.length === 0) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportError=${encodeURIComponent('No documents selected')}`,
    );
  }

  let result;
  try {
    result = await createCustomerHandoverExport({
      organizationId: session.organizationId,
      machineId,
      documentIds,
      locale,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  if (result.sensitiveCategories && result.sensitiveCategories.length > 0) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExport=created&handoverExportSensitiveCategories=${encodeURIComponent(result.sensitiveCategories.join(','))}`,
    );
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?handoverExport=created`);
}

export async function createCustomerHandoverExportDownloadUrlAction(
  formData: FormData,
): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const exportId = (formData.get('exportId') as string).trim();
  const locale = ((formData.get('locale') as string | null) ?? '').trim() || 'en';

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadError=${encodeURIComponent('Session required')}`,
    );
  }

  let downloadUrl: string;
  let expiresInSeconds: number;

  try {
    const result = await createCustomerHandoverExportDownloadUrl({
      organizationId: session.organizationId,
      machineId,
      exportId,
      accessToken: session.accessToken,
    });
    downloadUrl = result.downloadUrl;
    expiresInSeconds = result.expiresInSeconds;
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadUrl=${encodeURIComponent(downloadUrl)}&handoverExportDownloadExpiry=${encodeURIComponent(String(expiresInSeconds))}`,
  );
}

export async function createCustomerHandoverExportPdfDownloadUrlAction(
  formData: FormData,
): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const exportId = (formData.get('exportId') as string).trim();
  const locale = ((formData.get('locale') as string | null) ?? '').trim() || 'en';

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadError=${encodeURIComponent('Session required')}`,
    );
  }

  let downloadUrl: string;

  try {
    const result = await createCustomerHandoverExportPdfDownloadUrl({
      organizationId: session.organizationId,
      machineId,
      exportId,
      accessToken: session.accessToken,
    });
    downloadUrl = result.downloadUrl;
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportPdfDownloadUrl=${encodeURIComponent(downloadUrl)}`,
  );
}
