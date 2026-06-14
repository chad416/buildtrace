import type { DocumentRecord, PrismaClient } from '@buildtrace/db';
import type { ActivityLogAction, DocumentCategory, DocumentLanguageCode } from '@buildtrace/shared';

import {
  createDocumentUploadCommand,
  type DocumentUploadCommandDependencies,
} from './document-upload.js';
import type {
  DocumentStorageAdapter,
  DocumentStorageConfig,
  DocumentStorageUploadResult,
  RemoveDocumentFromStorageInput,
  UploadDocumentToStorageInput,
} from './document-storage.js';

type CapturedCalls = {
  readonly authOrganizations: string[];
  readonly storagePaths: string[];
  readonly uploadedStoragePaths: string[];
  readonly removedStoragePaths: string[];
  readonly documentRecords: string[];
  readonly activityActions: ActivityLogAction[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-14T00:00:00.000Z');

const fakeConfig: DocumentStorageConfig = {
  supabaseUrl: 'https://buildtrace.example.supabase.co',
  serviceRoleKey: 'service-role-key',
  bucketName: 'buildtrace-documents',
  signedUrlTtlSeconds: 900,
};

const fakeStorage: DocumentStorageAdapter = {
  from() {
    return {
      async createSignedUrl() {
        return {
          data: {
            signedUrl: 'https://storage.example/signed/document.pdf',
          },
          error: null,
        };
      },
      async upload(storagePath) {
        return {
          data: {
            path: storagePath,
          },
          error: null,
        };
      },
      async remove() {
        return {
          data: [],
          error: null,
        };
      },
    };
  },
};

function createDocumentRecord(input: {
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly fileType: string;
  readonly category: DocumentCategory;
  readonly checksum: string;
  readonly language?: DocumentLanguageCode;
  readonly uploadedByUserId?: string | null;
}): DocumentRecord {
  return {
    id: 'document-1',
    organizationId: input.organizationId,
    machineId: input.machineId,
    fileName: input.fileName,
    storagePath: input.storagePath,
    fileType: input.fileType,
    category: input.category,
    visibilityLevel: input.category === 'plc' ? 'sensitive-engineering' : 'internal',
    visibleToCustomer: false,
    language: input.language ?? 'unknown',
    checksum: input.checksum,
    uploadedByUserId: input.uploadedByUserId ?? null,
    uploadedAt: now,
    lastDownloadUrlIssuedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    authOrganizations: [],
    storagePaths: [],
    uploadedStoragePaths: [],
    removedStoragePaths: [],
    documentRecords: [],
    activityActions: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  overrides: Partial<DocumentUploadCommandDependencies> = {},
): DocumentUploadCommandDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.authOrganizations.push(input.organizationId);

      if (input.allowedRoles?.join(',') !== 'OWNER,ADMIN') {
        throw new Error('Upload command allowed roles were wrong.');
      }

      return {
        currentUser: {
          appUserId: 'app-user-1',
          authUserId: 'auth-user-1',
          email: 'builder@buildtrace.test',
          organizations: [
            {
              id: input.organizationId,
              role: 'OWNER',
            },
          ],
        },
        organizationAccess: {
          organizationId: input.organizationId,
          role: 'OWNER',
        },
      };
    },
    readDocumentStorageConfig: () => fakeConfig,
    createDocumentStorageAdapter: () => fakeStorage,
    buildDocumentStoragePath: (input) => {
      const storagePath = `organizations/${input.organizationId}/machines/${input.machineId}/documents/${input.documentId}/${input.fileName}`;
      capturedCalls.storagePaths.push(storagePath);

      return storagePath;
    },
    uploadDocumentToStorage: async (
      input: UploadDocumentToStorageInput,
    ): Promise<DocumentStorageUploadResult> => {
      capturedCalls.uploadedStoragePaths.push(input.storagePath);

      return {
        storagePath: input.storagePath,
      };
    },
    removeDocumentFromStorage: async (input: RemoveDocumentFromStorageInput) => {
      capturedCalls.removedStoragePaths.push(input.storagePath);
    },
    createDocumentRecord: async (input) => {
      capturedCalls.documentRecords.push(input.storagePath);

      return createDocumentRecord(input);
    },
    createActivityLog: async (input) => {
      capturedCalls.activityActions.push(input.action);

      return {
        id: 'activity-log-1',
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: now,
      };
    },
    createDocumentId: () => 'document-1',
    ...overrides,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

async function runDocumentUploadSuccessSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const result = await createDocumentUploadCommand({
    authorizationHeader: 'Bearer token-1',
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
    fileName: ' Manual.pdf ',
    fileType: ' application/pdf ',
    fileBody: new ArrayBuffer(8),
    category: 'plc',
    checksum: ' checksum-1 ',
    language: 'en',
    dependencies: createDependencies(capturedCalls),
  });

  assert(result.documentId === 'document-1', 'Upload result document ID was wrong.');
  assert(result.organizationId === 'organization-1', 'Upload result organization was wrong.');
  assert(result.machineId === 'machine-1', 'Upload result machine was wrong.');
  assert(result.fileName === 'Manual.pdf', 'Upload result file name was wrong.');

  assert(capturedCalls.authOrganizations.join(',') === 'organization-1', 'Tenant auth was wrong.');
  assert(capturedCalls.storagePaths.length === 1, 'Storage path was not built exactly once.');
  assert(capturedCalls.uploadedStoragePaths.length === 1, 'Storage upload was not called.');
  assert(capturedCalls.documentRecords.length === 1, 'Document metadata row was not created.');
  assert(capturedCalls.removedStoragePaths.length === 0, 'Successful upload removed storage.');
  assert(
    capturedCalls.activityActions.join(',') === 'document.uploaded',
    'Upload activity was not logged.',
  );
}

async function runDocumentUploadFailureSmokeCheck(): Promise<void> {
  const storageFailureCalls = createCapturedCalls();

  await expectThrows('storage upload failure', () =>
    createDocumentUploadCommand({
      authorizationHeader: 'Bearer token-1',
      organizationId: 'organization-1',
      machineId: 'machine-1',
      fileName: 'Manual.pdf',
      fileType: 'application/pdf',
      fileBody: new ArrayBuffer(8),
      category: 'manuals',
      checksum: 'checksum-1',
      dependencies: createDependencies(storageFailureCalls, {
        uploadDocumentToStorage: async () => {
          throw new Error('storage failed');
        },
      }),
    }),
  );

  assert(storageFailureCalls.documentRecords.length === 0, 'Storage failure created metadata.');
  assert(storageFailureCalls.activityActions.length === 0, 'Storage failure created activity log.');
  assert(storageFailureCalls.removedStoragePaths.length === 0, 'Storage failure removed nothing.');

  const metadataFailureCalls = createCapturedCalls();

  await expectThrows('metadata creation failure', () =>
    createDocumentUploadCommand({
      authorizationHeader: 'Bearer token-1',
      organizationId: 'organization-1',
      machineId: 'machine-1',
      fileName: 'Manual.pdf',
      fileType: 'application/pdf',
      fileBody: new ArrayBuffer(8),
      category: 'manuals',
      checksum: 'checksum-1',
      dependencies: createDependencies(metadataFailureCalls, {
        createDocumentRecord: async () => {
          throw new Error('metadata failed');
        },
      }),
    }),
  );

  assert(
    metadataFailureCalls.uploadedStoragePaths.length === 1,
    'Metadata failure did not upload first.',
  );
  assert(
    metadataFailureCalls.removedStoragePaths.length === 1,
    'Metadata failure did not clean storage.',
  );
  assert(
    metadataFailureCalls.activityActions.length === 0,
    'Metadata failure created activity log.',
  );
}

async function runDocumentUploadSmokeCheck(): Promise<void> {
  await runDocumentUploadSuccessSmokeCheck();
  await runDocumentUploadFailureSmokeCheck();
}

await runDocumentUploadSmokeCheck();

console.info('Document upload smoke check passed.');
