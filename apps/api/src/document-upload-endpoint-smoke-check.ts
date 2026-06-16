import type { DocumentRecord, PrismaClient } from '@buildtrace/db';
import type { ActivityLogAction, DocumentCategory, DocumentLanguageCode } from '@buildtrace/shared';

import {
  createDocumentUploadFromMultipartRequest,
  MAX_DOCUMENT_UPLOAD_BYTES,
  type DocumentUploadHttpRequest,
  type DocumentUploadMultipartFile,
} from './document-upload-endpoint.js';
import type { DocumentUploadCommandDependencies } from './document-upload.js';
import type {
  DocumentStorageUploadResult,
  RemoveDocumentFromStorageInput,
  UploadDocumentToStorageInput,
} from './document-storage.js';

type CapturedCalls = {
  readonly uploadedStoragePaths: string[];
  readonly removedStoragePaths: string[];
  readonly activityActions: ActivityLogAction[];
  readonly categories: DocumentCategory[];
  readonly languages: DocumentLanguageCode[];
  readonly checksums: string[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-14T00:00:00.000Z');

function createFileStream(content: string): AsyncIterable<Uint8Array> {
  return {
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(content);
    },
  };
}

function createOversizedFileStream(): AsyncIterable<Uint8Array> {
  return {
    async *[Symbol.asyncIterator]() {
      yield Buffer.alloc(MAX_DOCUMENT_UPLOAD_BYTES + 1);
    },
  };
}

function createRequest(input: {
  readonly fileName?: string;
  readonly mimeType?: string;
  readonly content?: string;
  readonly fields?: Record<string, unknown>;
  readonly body?: unknown;
}): DocumentUploadHttpRequest {
  return {
    body: input.body,
    async file() {
      const multipartFile: DocumentUploadMultipartFile = {
        filename: input.fileName ?? 'Manual.pdf',
        mimetype: input.mimeType ?? 'application/pdf',
        file: createFileStream(input.content ?? 'document-body'),
      };

      return input.fields ? { ...multipartFile, fields: input.fields } : multipartFile;
    },
  };
}

function createOversizedRequest(): DocumentUploadHttpRequest {
  return {
    async file() {
      return {
        filename: 'Manual.pdf',
        mimetype: 'application/pdf',
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'manuals',
          },
        },
        file: createOversizedFileStream(),
      };
    },
  };
}

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
    suggestedCategory: null,
    classificationConfidence: null,
    classificationStatus: 'unclassified',
    classificationSource: null,
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
    uploadedStoragePaths: [],
    removedStoragePaths: [],
    activityActions: [],
    categories: [],
    languages: [],
    checksums: [],
  };
}

function createDependencies(capturedCalls: CapturedCalls): DocumentUploadCommandDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => ({
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
    }),
    readDocumentStorageConfig: () => ({
      supabaseUrl: 'https://buildtrace.example.supabase.co',
      serviceRoleKey: 'service-role-key',
      bucketName: 'buildtrace-documents',
      signedUrlTtlSeconds: 900,
    }),
    createDocumentStorageAdapter: () => ({
      from() {
        return {
          async createSignedUrl() {
            return {
              data: {
                signedUrl: 'https://storage.example/signed/manual.pdf',
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
    }),
    buildDocumentStoragePath: (input) =>
      `organizations/${input.organizationId}/machines/${input.machineId}/documents/${input.documentId}/${input.fileName}`,
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
      capturedCalls.categories.push(input.category);
      capturedCalls.languages.push(input.language ?? 'unknown');
      capturedCalls.checksums.push(input.checksum);

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

async function runDocumentUploadEndpointSuccessSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const response = await createDocumentUploadFromMultipartRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    request: createRequest({
      fields: {
        organizationId: {
          value: ' organization-1 ',
        },
        category: {
          value: ' manuals ',
        },
        language: {
          value: ' en ',
        },
      },
      fileName: ' Manual.pdf ',
      mimeType: ' application/pdf ',
      content: 'manual-content',
    }),
    dependencies: createDependencies(capturedCalls),
  });

  const runtimeResponse = response as unknown as Record<string, unknown>;

  assert(response.document.id === 'document-1', 'Upload endpoint returned wrong document ID.');
  assert(response.document.organizationId === 'organization-1', 'Organization was not normalized.');
  assert(response.document.machineId === 'machine-1', 'Machine was not normalized.');
  assert(response.document.fileName === 'Manual.pdf', 'File name was not normalized.');
  assert(!('storagePath' in runtimeResponse), 'Upload endpoint exposed raw storage path.');
  assert(capturedCalls.uploadedStoragePaths.length === 1, 'Upload command was not called.');
  assert(capturedCalls.removedStoragePaths.length === 0, 'Successful upload removed storage.');
  assert(capturedCalls.categories.join(',') === 'manuals', 'Category was not parsed.');
  assert(capturedCalls.languages.join(',') === 'en', 'Language was not parsed.');
  assert(capturedCalls.checksums.length === 1, 'Checksum was not calculated.');
  assert(
    capturedCalls.activityActions.join(',') === 'document.uploaded',
    'Upload activity was not logged.',
  );
}

async function runDocumentUploadEndpointValidationSmokeCheck(): Promise<void> {
  await expectThrows('missing file', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: {},
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('invalid category', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createRequest({
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'public',
          },
        },
      }),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('invalid language', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createRequest({
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'manuals',
          },
          language: {
            value: 'it',
          },
        },
      }),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('unsafe filename', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createRequest({
        fileName: '../Manual.pdf',
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'manuals',
          },
        },
      }),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('blocked extension', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createRequest({
        fileName: 'malware.exe',
        mimeType: 'application/octet-stream',
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'manuals',
          },
        },
      }),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('blocked mime type', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createRequest({
        fileName: 'Manual.pdf',
        mimeType: 'text/html',
        fields: {
          organizationId: {
            value: 'organization-1',
          },
          category: {
            value: 'manuals',
          },
        },
      }),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectThrows('oversized file', () =>
    createDocumentUploadFromMultipartRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      request: createOversizedRequest(),
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );
}

async function runDocumentUploadEndpointSmokeCheck(): Promise<void> {
  await runDocumentUploadEndpointSuccessSmokeCheck();
  await runDocumentUploadEndpointValidationSmokeCheck();
}

await runDocumentUploadEndpointSmokeCheck();

console.info('Document upload endpoint smoke check passed.');
