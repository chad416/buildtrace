'use server';

import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
  machineStatuses,
  sparePartCriticalities,
  softwareTypes,
  supportedLocales,
  ticketPriorities,
  ticketStatuses,
  type DocumentCategory,
  type DocumentLanguageCode,
  type DocumentVisibilityLevel,
  type MachineStatus,
  type SparePartCriticality,
  type SoftwareType,
  type SupportedLocale,
  type TicketPriority,
  type TicketStatus,
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
import {
  assignMachineQrToken,
  disableMachineQrPortal,
  rotateMachineQrToken,
} from '@/qr-portal-builder-api';
import {
  addTicketComment,
  createServiceTicket,
  createTicketCommentAttachmentDownloadUrl,
  updateTicketMeetingLink,
  updateTicketStatus,
} from '@/service-tickets-api';
import { createSparePart, updateSparePart } from '@/spare-parts-api';
import {
  createSoftwareVersion,
  createSoftwareVersionFileDownloadUrl,
  markVersionAsCurrent,
  markVersionAsDelivered,
} from '@/software-versions-api';
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

export async function assignMachineQrTokenAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const requestedLocale = ((formData.get('locale') as string | null) ?? '').trim();
  const locale = supportedLocales.includes(requestedLocale as SupportedLocale)
    ? (requestedLocale as SupportedLocale)
    : 'en';

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    await assignMachineQrToken({
      organizationId: session.organizationId,
      machineId,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalAction=assigned`);
}

export async function rotateMachineQrTokenAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const requestedLocale = ((formData.get('locale') as string | null) ?? '').trim();
  const locale = supportedLocales.includes(requestedLocale as SupportedLocale)
    ? (requestedLocale as SupportedLocale)
    : 'en';

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    await rotateMachineQrToken({
      organizationId: session.organizationId,
      machineId,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalAction=rotated`);
}

export async function disableMachineQrPortalAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const machineId = (formData.get('machineId') as string).trim();
  const requestedLocale = ((formData.get('locale') as string | null) ?? '').trim();
  const locale = supportedLocales.includes(requestedLocale as SupportedLocale)
    ? (requestedLocale as SupportedLocale)
    : 'en';

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    await disableMachineQrPortal({
      organizationId: session.organizationId,
      machineId,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?qrPortalAction=disabled`);
}

function redirectMachineTicketActionWithError(
  locale: string,
  machineId: string,
  error: unknown,
): never {
  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent(formatActionError(error))}`,
  );
}

function readLocaleFromForm(formData: FormData): SupportedLocale {
  const requestedLocale = ((formData.get('locale') as string | null) ?? '').trim();
  return supportedLocales.includes(requestedLocale as SupportedLocale)
    ? (requestedLocale as SupportedLocale)
    : 'en';
}

function redirectMachineSparePartActionWithError(
  locale: string,
  machineId: string,
  error: unknown,
): never {
  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?sparePartError=${encodeURIComponent(formatActionError(error))}`,
  );
}

function readOptionalNullableFormText(formData: FormData, name: string): string | null | undefined {
  const value = formData.get(name);

  if (value === null || typeof value !== 'string') {
    return undefined;
  }

  return value.trim() || null;
}

function readOptionalPositiveIntegerFormNumber(
  formData: FormData,
  name: string,
  label: string,
): number | undefined {
  const value = readOptionalFormText(formData, name);

  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsedValue;
}

function readOptionalNullableDecimalFormText(
  formData: FormData,
  name: string,
  label: string,
): string | null | undefined {
  const value = formData.get(name);

  if (value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!Number.isFinite(Number(normalizedValue))) {
    throw new Error(`${label} must be a valid decimal value.`);
  }

  return normalizedValue;
}

function readOptionalSparePartCriticality(formData: FormData): SparePartCriticality | undefined {
  const criticality = readOptionalFormText(formData, 'criticality');

  if (criticality === undefined) {
    return undefined;
  }

  if (!(sparePartCriticalities as readonly string[]).includes(criticality)) {
    throw new Error(`Invalid criticality: ${criticality}`);
  }

  return criticality as SparePartCriticality;
}

export async function createSparePartAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?sparePartError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const manufacturer = readOptionalNullableFormText(formData, 'manufacturer');
    const partNumber = readOptionalNullableFormText(formData, 'partNumber');
    const quantity = readOptionalPositiveIntegerFormNumber(formData, 'quantity', 'Quantity');
    const category = readOptionalFormText(formData, 'category');
    const criticality = readOptionalSparePartCriticality(formData);
    const estimatedPrice = readOptionalNullableDecimalFormText(
      formData,
      'estimatedPrice',
      'Estimated price',
    );
    const currency = readOptionalFormText(formData, 'currency');
    const customerVisiblePrice = readOptionalNullableDecimalFormText(
      formData,
      'customerVisiblePrice',
      'Customer price',
    );
    const notes = readOptionalNullableFormText(formData, 'notes');

    await createSparePart({
      organizationId: session.organizationId,
      machineId: readRequiredFormText(formData, 'machineId', 'Machine ID'),
      partName: readRequiredFormText(formData, 'partName', 'Part name'),
      ...(manufacturer !== undefined ? { manufacturer } : {}),
      ...(partNumber !== undefined ? { partNumber } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(criticality !== undefined ? { criticality } : {}),
      ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(customerVisiblePrice !== undefined ? { customerVisiblePrice } : {}),
      ...(notes !== undefined ? { notes } : {}),
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineSparePartActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?sparePartAction=created`);
}

export async function updateSparePartAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?sparePartError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const partName = readOptionalFormText(formData, 'partName');
    const manufacturer = readOptionalNullableFormText(formData, 'manufacturer');
    const partNumber = readOptionalNullableFormText(formData, 'partNumber');
    const quantity = readOptionalPositiveIntegerFormNumber(formData, 'quantity', 'Quantity');
    const category = readOptionalFormText(formData, 'category');
    const criticality = readOptionalSparePartCriticality(formData);
    const estimatedPrice = readOptionalNullableDecimalFormText(
      formData,
      'estimatedPrice',
      'Estimated price',
    );
    const currency = readOptionalFormText(formData, 'currency');
    const customerVisiblePrice = readOptionalNullableDecimalFormText(
      formData,
      'customerVisiblePrice',
      'Customer price',
    );
    const notes = readOptionalNullableFormText(formData, 'notes');

    await updateSparePart({
      organizationId: session.organizationId,
      sparePartId: readRequiredFormText(formData, 'sparePartId', 'Spare part ID'),
      ...(partName !== undefined ? { partName } : {}),
      ...(manufacturer !== undefined ? { manufacturer } : {}),
      ...(partNumber !== undefined ? { partNumber } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(criticality !== undefined ? { criticality } : {}),
      ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(customerVisiblePrice !== undefined ? { customerVisiblePrice } : {}),
      ...(notes !== undefined ? { notes } : {}),
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineSparePartActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?sparePartAction=updated`);
}

function redirectMachineSoftwareVersionActionWithError(
  locale: string,
  machineId: string,
  error: unknown,
): never {
  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?versionError=${encodeURIComponent(formatActionError(error))}`,
  );
}

function readRequiredSoftwareType(formData: FormData): SoftwareType {
  const softwareType = readRequiredFormText(formData, 'softwareType', 'Software type');

  if (!(softwareTypes as readonly string[]).includes(softwareType)) {
    throw new Error(`Invalid software type: ${softwareType}`);
  }

  return softwareType as SoftwareType;
}

export async function createSoftwareVersionAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?versionError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const notes = readOptionalFormText(formData, 'notes');

    await createSoftwareVersion({
      organizationId: session.organizationId,
      machineId: readRequiredFormText(formData, 'machineId', 'Machine ID'),
      versionName: readRequiredFormText(formData, 'versionName', 'Version name'),
      softwareType: readRequiredSoftwareType(formData),
      ...(notes !== undefined ? { notes } : {}),
      isDeliveredVersion: formData.get('isDeliveredVersion') === 'on',
      isCurrentKnownVersion: formData.get('isCurrentKnownVersion') === 'on',
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineSoftwareVersionActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?versionAction=created`);
}

export async function markVersionAsCurrentAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?versionError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    await markVersionAsCurrent({
      organizationId: session.organizationId,
      machineId: readRequiredFormText(formData, 'machineId', 'Machine ID'),
      versionId: readRequiredFormText(formData, 'versionId', 'Version ID'),
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineSoftwareVersionActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?versionAction=marked-current`);
}

export async function markVersionAsDeliveredAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?versionError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    await markVersionAsDelivered({
      organizationId: session.organizationId,
      machineId: readRequiredFormText(formData, 'machineId', 'Machine ID'),
      versionId: readRequiredFormText(formData, 'versionId', 'Version ID'),
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineSoftwareVersionActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?versionAction=marked-delivered`);
}

export async function createSoftwareVersionFileDownloadUrlAction(
  formData: FormData,
): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?versionError=${encodeURIComponent('Session required')}`,
    );
  }

  let downloadUrl: string;

  try {
    const result = await createSoftwareVersionFileDownloadUrl({
      organizationId: session.organizationId,
      versionId: readRequiredFormText(formData, 'versionId', 'Version ID'),
      accessToken: session.accessToken,
    });

    downloadUrl = result.downloadUrl;
  } catch (error) {
    redirectMachineSoftwareVersionActionWithError(locale, machineId, error);
  }

  redirect(downloadUrl);
}

export async function createServiceTicketAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const title = readRequiredFormText(formData, 'title', 'Title');
    const description = readRequiredFormText(formData, 'description', 'Description');
    const priorityValue = readOptionalFormText(formData, 'priority');

    let priority: TicketPriority | undefined;

    if (priorityValue !== undefined) {
      if (!(ticketPriorities as readonly string[]).includes(priorityValue)) {
        throw new Error(`Invalid priority: ${priorityValue}`);
      }

      priority = priorityValue as TicketPriority;
    }

    await createServiceTicket({
      organizationId: session.organizationId,
      machineId,
      title,
      description,
      ...(priority !== undefined ? { priority } : {}),
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineTicketActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?ticketAction=created`);
}

export async function updateTicketStatusAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const ticketId = readRequiredFormText(formData, 'ticketId', 'Ticket ID');
    const statusValue = readRequiredFormText(formData, 'status', 'Status');

    if (!(ticketStatuses as readonly string[]).includes(statusValue)) {
      throw new Error(`Invalid status: ${statusValue}`);
    }

    await updateTicketStatus({
      organizationId: session.organizationId,
      ticketId,
      status: statusValue as TicketStatus,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineTicketActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?ticketAction=status-updated`);
}

export async function updateTicketMeetingLinkAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const ticketId = readRequiredFormText(formData, 'ticketId', 'Ticket ID');
    const meetingLink = readOptionalFormText(formData, 'meetingLink') ?? null;
    const meetingNotes = readOptionalFormText(formData, 'meetingNotes') ?? null;

    await updateTicketMeetingLink({
      organizationId: session.organizationId,
      ticketId,
      meetingLink,
      meetingNotes,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineTicketActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?ticketAction=meeting-updated`);
}

export async function addTicketCommentAction(formData: FormData): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent('Session required')}`,
    );
  }

  try {
    const ticketId = readRequiredFormText(formData, 'ticketId', 'Ticket ID');
    const message = readRequiredFormText(formData, 'message', 'Message');
    const internalOnly = formData.get('internalOnly') === 'on';

    await addTicketComment({
      organizationId: session.organizationId,
      ticketId,
      message,
      internalOnly,
      accessToken: session.accessToken,
    });
  } catch (error) {
    redirectMachineTicketActionWithError(locale, machineId, error);
  }

  redirect(`/${locale}/machines/${encodeURIComponent(machineId)}?ticketAction=comment-added`);
}

export async function createTicketCommentAttachmentDownloadUrlAction(
  formData: FormData,
): Promise<void> {
  const session = await readMachineRecordsSession();
  const locale = readLocaleFromForm(formData);
  const machineId = ((formData.get('machineId') as string | null) ?? '').trim();

  if (session.status === 'missing') {
    redirect(
      `/${locale}/machines/${encodeURIComponent(machineId)}?ticketError=${encodeURIComponent('Session required')}`,
    );
  }

  let downloadUrl: string;

  try {
    const ticketId = readRequiredFormText(formData, 'ticketId', 'Ticket ID');
    const commentId = readRequiredFormText(formData, 'commentId', 'Comment ID');
    const result = await createTicketCommentAttachmentDownloadUrl({
      organizationId: session.organizationId,
      ticketId,
      commentId,
      accessToken: session.accessToken,
    });
    downloadUrl = result.downloadUrl;
  } catch (error) {
    redirectMachineTicketActionWithError(locale, machineId, error);
  }

  redirect(
    `/${locale}/machines/${encodeURIComponent(machineId)}?handoverExportDownloadUrl=${encodeURIComponent(downloadUrl)}`,
  );
}
