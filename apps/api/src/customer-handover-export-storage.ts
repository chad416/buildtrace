import {
  buildPrivateCustomerHandoverExportStoragePath,
  buildPrivateCustomerHandoverPdfSummaryStoragePath,
  type CustomerHandoverExportStorageScope,
} from '@buildtrace/shared';

import type {
  DocumentStorageAdapter,
  DocumentStorageConfig,
  DocumentStorageSignedUrlResult,
} from './document-storage.js';

export type UploadCustomerHandoverExportInput = CustomerHandoverExportStorageScope & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly archiveBody: ArrayBuffer;
};

export type RemoveCustomerHandoverExportInput = CustomerHandoverExportStorageScope & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
};

export type CreateCustomerHandoverExportSignedUrlInput = CustomerHandoverExportStorageScope & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
};

export type UploadCustomerHandoverPdfSummaryInput = CustomerHandoverExportStorageScope & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly pdfBody: ArrayBuffer;
};

export type CreateCustomerHandoverPdfSummarySignedUrlInput = CustomerHandoverExportStorageScope & {
  readonly config: DocumentStorageConfig;
  readonly storage: DocumentStorageAdapter;
  readonly pdfStoragePath: string;
};

export const buildCustomerHandoverExportStoragePath = buildPrivateCustomerHandoverExportStoragePath;
export const buildCustomerHandoverPdfSummaryStoragePath =
  buildPrivateCustomerHandoverPdfSummaryStoragePath;

export async function uploadCustomerHandoverExport({
  config,
  storage,
  organizationId,
  machineId,
  exportId,
  archiveBody,
}: UploadCustomerHandoverExportInput): Promise<void> {
  if (archiveBody.byteLength === 0) {
    throw new Error('Customer handover ZIP must not be empty.');
  }

  const storagePath = buildCustomerHandoverExportStoragePath({
    organizationId,
    machineId,
    exportId,
  });

  const response = await storage.from(config.bucketName).upload(storagePath, archiveBody, {
    contentType: 'application/zip',
    upsert: false,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data?.path?.trim() !== storagePath) {
    throw new Error('Customer handover ZIP upload returned an unexpected storage path.');
  }
}

export async function removeCustomerHandoverExport({
  config,
  storage,
  organizationId,
  machineId,
  exportId,
}: RemoveCustomerHandoverExportInput): Promise<void> {
  const storagePath = buildCustomerHandoverExportStoragePath({
    organizationId,
    machineId,
    exportId,
  });

  const response = await storage.from(config.bucketName).remove([storagePath]);

  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function uploadCustomerHandoverPdfSummary({
  config,
  storage,
  organizationId,
  machineId,
  exportId,
  pdfBody,
}: UploadCustomerHandoverPdfSummaryInput): Promise<string> {
  if (pdfBody.byteLength === 0) {
    throw new Error('Customer handover PDF summary must not be empty.');
  }

  const storagePath = buildCustomerHandoverPdfSummaryStoragePath({
    organizationId,
    machineId,
    exportId,
  });

  const response = await storage.from(config.bucketName).upload(storagePath, pdfBody, {
    contentType: 'application/pdf',
    upsert: false,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data?.path?.trim() !== storagePath) {
    throw new Error('Customer handover PDF upload returned an unexpected storage path.');
  }

  return storagePath;
}

export async function createCustomerHandoverExportSignedUrl({
  config,
  storage,
  organizationId,
  machineId,
  exportId,
}: CreateCustomerHandoverExportSignedUrlInput): Promise<DocumentStorageSignedUrlResult> {
  const storagePath = buildCustomerHandoverExportStoragePath({
    organizationId,
    machineId,
    exportId,
  });

  const response = await storage
    .from(config.bucketName)
    .createSignedUrl(storagePath, config.signedUrlTtlSeconds);

  if (response.error || !response.data?.signedUrl) {
    throw new Error(response.error?.message ?? 'Customer handover ZIP URL could not be created.');
  }

  return {
    signedUrl: response.data.signedUrl,
    expiresInSeconds: config.signedUrlTtlSeconds,
  };
}

export async function createCustomerHandoverPdfSummarySignedUrl({
  config,
  storage,
  organizationId,
  machineId,
  exportId,
  pdfStoragePath,
}: CreateCustomerHandoverPdfSummarySignedUrlInput): Promise<DocumentStorageSignedUrlResult> {
  const expectedStoragePath = buildCustomerHandoverPdfSummaryStoragePath({
    organizationId,
    machineId,
    exportId,
  });

  if (pdfStoragePath.trim() !== expectedStoragePath) {
    throw new Error('Customer handover PDF path does not match the export tenant scope.');
  }

  const response = await storage
    .from(config.bucketName)
    .createSignedUrl(expectedStoragePath, config.signedUrlTtlSeconds);

  if (response.error || !response.data?.signedUrl) {
    throw new Error(response.error?.message ?? 'Customer handover PDF URL could not be created.');
  }

  return {
    signedUrl: response.data.signedUrl,
    expiresInSeconds: config.signedUrlTtlSeconds,
  };
}
