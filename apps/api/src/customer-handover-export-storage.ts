import {
  buildPrivateCustomerHandoverExportStoragePath,
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

export const buildCustomerHandoverExportStoragePath = buildPrivateCustomerHandoverExportStoragePath;

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
