import { randomUUID } from 'node:crypto';
import { createActivityLog, createDocumentRecord, type PrismaClient } from '@buildtrace/db';
import {
  activityLogActions,
  type DocumentCategory,
  type DocumentLanguageCode,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';
import {
  buildDocumentStoragePath,
  createSupabaseDocumentStorageAdapter,
  readDocumentStorageConfig,
  removeDocumentFromStorage,
  uploadDocumentToStorage,
  type DocumentStorageAdapter,
  type DocumentStorageConfig,
  type DocumentStorageUploadResult,
} from './document-storage.js';

export type CreateDocumentUploadCommandInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly fileBody: ArrayBuffer;
  readonly category: DocumentCategory;
  readonly checksum: string;
  readonly language?: DocumentLanguageCode;
  readonly dependencies?: Partial<DocumentUploadCommandDependencies>;
};

export type DocumentUploadCommandResult = {
  readonly documentId: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly storagePath: string;
  readonly fileName: string;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly ('OWNER' | 'ADMIN' | 'MEMBER')[];
}) => Promise<AuthenticatedTenantContext>;

export type DocumentUploadCommandDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly readDocumentStorageConfig: () => DocumentStorageConfig;
  readonly createDocumentStorageAdapter: (config: DocumentStorageConfig) => DocumentStorageAdapter;
  readonly buildDocumentStoragePath: typeof buildDocumentStoragePath;
  readonly uploadDocumentToStorage: typeof uploadDocumentToStorage;
  readonly removeDocumentFromStorage: typeof removeDocumentFromStorage;
  readonly createDocumentRecord: typeof createDocumentRecord;
  readonly createActivityLog: typeof createActivityLog;
  readonly createDocumentId: () => string;
};

function readNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function createDefaultDocumentId(): string {
  return randomUUID();
}

function createDefaultDependencies(db: PrismaClient): DocumentUploadCommandDependencies {
  return {
    db,
    resolveAuthenticatedTenantContext,
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
    buildDocumentStoragePath,
    uploadDocumentToStorage,
    removeDocumentFromStorage,
    createDocumentRecord,
    createActivityLog,
    createDocumentId: createDefaultDocumentId,
  };
}

export async function createDocumentUploadCommand({
  authorizationHeader,
  organizationId,
  machineId,
  fileName,
  fileType,
  fileBody,
  category,
  checksum,
  language = 'unknown',
  dependencies,
}: CreateDocumentUploadCommandInput & {
  readonly dependencies: Partial<DocumentUploadCommandDependencies> & {
    readonly db: PrismaClient;
  };
}): Promise<DocumentUploadCommandResult> {
  const resolvedDependencies = {
    ...createDefaultDependencies(dependencies.db),
    ...dependencies,
  };

  const normalizedOrganizationId = readNonEmptyText(organizationId, 'organizationId');
  const normalizedMachineId = readNonEmptyText(machineId, 'machineId');
  const normalizedFileName = readNonEmptyText(fileName, 'fileName');
  const normalizedFileType = readNonEmptyText(fileType, 'fileType');
  const normalizedChecksum = readNonEmptyText(checksum, 'checksum');
  const documentId = resolvedDependencies.createDocumentId();

  const tenantContext = await resolvedDependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId: normalizedOrganizationId,
    db: resolvedDependencies.db,
    allowedRoles: ['OWNER', 'ADMIN'],
  });

  const config = resolvedDependencies.readDocumentStorageConfig();
  const storage = resolvedDependencies.createDocumentStorageAdapter(config);

  const storagePath = resolvedDependencies.buildDocumentStoragePath({
    organizationId: normalizedOrganizationId,
    machineId: normalizedMachineId,
    documentId,
    fileName: normalizedFileName,
  });

  let uploadedDocument: DocumentStorageUploadResult | null = null;

  try {
    uploadedDocument = await resolvedDependencies.uploadDocumentToStorage({
      config,
      storage,
      organizationId: normalizedOrganizationId,
      machineId: normalizedMachineId,
      storagePath,
      fileBody,
      fileType: normalizedFileType,
    });

    const document = await resolvedDependencies.createDocumentRecord({
      db: resolvedDependencies.db,
      organizationId: normalizedOrganizationId,
      machineId: normalizedMachineId,
      fileName: normalizedFileName,
      storagePath: uploadedDocument.storagePath,
      fileType: normalizedFileType,
      category,
      checksum: normalizedChecksum,
      language,
      uploadedByUserId: tenantContext.currentUser.appUserId,
    });

    await resolvedDependencies.createActivityLog({
      db: resolvedDependencies.db,
      organizationId: normalizedOrganizationId,
      action: activityLogActions.documentUploaded,
      actorUserId: tenantContext.currentUser.appUserId,
      targetType: 'document',
      targetId: document.id,
    });

    return {
      documentId: document.id,
      organizationId: document.organizationId,
      machineId: document.machineId,
      storagePath: document.storagePath,
      fileName: document.fileName,
    };
  } catch (error) {
    const uploadedStoragePath = uploadedDocument?.storagePath;

    if (uploadedStoragePath) {
      await resolvedDependencies.removeDocumentFromStorage({
        config,
        storage,
        organizationId: normalizedOrganizationId,
        machineId: normalizedMachineId,
        storagePath: uploadedStoragePath,
      });
    }

    throw error;
  }
}
