import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { DocumentRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';

import {
  createDocumentDownloadUrlFromRequest,
  type DocumentMetadataResponse,
  type DocumentRecordsEndpointDependencies,
} from './document-records.controller.js';
import type { DocumentStorageAdapter, DocumentStorageConfig } from './document-storage.js';

type ResolveInput = Parameters<
  DocumentRecordsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];

type GetDocumentInput = Parameters<DocumentRecordsEndpointDependencies['getDocumentByMachine']>[0];

type MarkDocumentDownloadUrlIssuedInput = Parameters<
  DocumentRecordsEndpointDependencies['markDocumentDownloadUrlIssued']
>[0];

type CreateActivityLogInput = Parameters<
  DocumentRecordsEndpointDependencies['createActivityLog']
>[0];

type CreateSignedDocumentDownloadUrlInput = Parameters<
  DocumentRecordsEndpointDependencies['createSignedDocumentDownloadUrl']
>[0];

type CapturedResolveInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
};

type CapturedCalls = {
  readonly resolveInputs: CapturedResolveInput[];
  readonly getDocumentInputs: GetDocumentInput[];
  readonly markDocumentDownloadUrlIssuedInputs: MarkDocumentDownloadUrlIssuedInput[];
  readonly createActivityLogInputs: CreateActivityLogInput[];
  readonly storageConfigs: DocumentStorageConfig[];
  readonly signedUrlInputs: CreateSignedDocumentDownloadUrlInput[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-14T00:00:00.000Z');
const issuedAt = new Date('2026-06-14T00:01:00.000Z');

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
            signedUrl: 'https://storage.example/signed/manual.pdf',
          },
          error: null,
        };
      },
    };
  },
};

const fakeDocument: DocumentRecord = {
  id: 'document-1',
  organizationId: 'organization-1',
  machineId: 'machine-1',
  fileName: 'Manual.pdf',
  storagePath: 'organizations/organization-1/machines/machine-1/documents/document-1/Manual.pdf',
  fileType: 'application/pdf',
  category: 'manuals',
  visibilityLevel: 'internal',
  visibleToCustomer: false,
  language: 'en',
  checksum: 'checksum-1',
  uploadedByUserId: 'app-user-1',
  uploadedAt: now,
  lastDownloadUrlIssuedAt: null,
  createdAt: now,
  updatedAt: now,
};

function captureResolveInput(input: ResolveInput): CapturedResolveInput {
  return {
    authorizationHeader: input.authorizationHeader,
    organizationId: input.organizationId,
    db: input.db,
    ...(input.allowedRoles ? { allowedRoles: input.allowedRoles } : {}),
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    getDocumentInputs: [],
    markDocumentDownloadUrlIssuedInputs: [],
    createActivityLogInputs: [],
    storageConfigs: [],
    signedUrlInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  overrides: Partial<Omit<DocumentRecordsEndpointDependencies, 'db'>> = {},
): DocumentRecordsEndpointDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push(captureResolveInput(input));

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
    listDocumentsByMachine: async () => [fakeDocument],
    getDocumentByMachine: async (input) => {
      capturedCalls.getDocumentInputs.push(input);

      return fakeDocument;
    },
    updateDocumentCategory: async () => fakeDocument,
    updateDocumentVisibility: async () => fakeDocument,
    markDocumentDownloadUrlIssued: async (input) => {
      capturedCalls.markDocumentDownloadUrlIssuedInputs.push(input);

      return {
        ...fakeDocument,
        lastDownloadUrlIssuedAt: issuedAt,
      };
    },
    createActivityLog: async (input) => {
      capturedCalls.createActivityLogInputs.push(input);

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
    readDocumentStorageConfig: () => fakeConfig,
    createDocumentStorageAdapter: (config) => {
      capturedCalls.storageConfigs.push(config);

      return fakeStorage;
    },
    createSignedDocumentDownloadUrl: async (input) => {
      capturedCalls.signedUrlInputs.push(input);

      return {
        signedUrl: 'https://storage.example/signed/manual.pdf',
        expiresInSeconds: input.config.signedUrlTtlSeconds,
      };
    },
    ...overrides,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectException(
  name: string,
  expectedError: new (...args: never[]) => Error,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof expectedError) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw ${expectedError.name}.`);
}

function assertResolveInput(resolveInput: CapturedResolveInput | undefined): void {
  assert(resolveInput !== undefined, 'Auth tenant context dependency was not called.');
  assert(resolveInput.authorizationHeader === 'Bearer token-1', 'Auth header was not forwarded.');
  assert(resolveInput.organizationId === 'organization-1', 'Organization ID was not normalized.');
  assert(resolveInput.db === fakeDb, 'DB dependency was not forwarded to auth.');
  assert(
    resolveInput.allowedRoles?.join(',') === ['OWNER', 'ADMIN', 'MEMBER'].join(','),
    'Download URL allowed roles were wrong.',
  );
}

function assertSanitizedDocument(document: DocumentMetadataResponse): void {
  const runtimeDocument = document as Record<string, unknown>;

  assert(!('storagePath' in runtimeDocument), 'Download URL response exposed raw storage path.');
  assert(!('checksum' in runtimeDocument), 'Download URL response exposed checksum.');
}

async function runDownloadUrlSuccessSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const response = await createDocumentDownloadUrlFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    body: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(
    response.downloadUrl === 'https://storage.example/signed/manual.pdf',
    'Signed URL was wrong.',
  );
  assert(response.expiresInSeconds === 900, 'Signed URL TTL was wrong.');
  assert(response.document.id === 'document-1', 'Download response document was wrong.');
  assert(
    response.document.lastDownloadUrlIssuedAt?.toISOString() === issuedAt.toISOString(),
    'Download URL issued timestamp was not returned.',
  );
  assertSanitizedDocument(response.document);

  assertResolveInput(capturedCalls.resolveInputs[0]);

  const getInput = capturedCalls.getDocumentInputs[0];
  const signedUrlInput = capturedCalls.signedUrlInputs[0];
  const issuedInput = capturedCalls.markDocumentDownloadUrlIssuedInputs[0];
  const activityLogInput = capturedCalls.createActivityLogInputs[0];

  assert(getInput !== undefined, 'Document lookup dependency was not called.');
  assert(getInput.organizationId === 'organization-1', 'Document lookup organization was wrong.');
  assert(getInput.machineId === 'machine-1', 'Document lookup machine was wrong.');
  assert(getInput.documentId === 'document-1', 'Document lookup document was wrong.');

  assert(capturedCalls.storageConfigs[0] === fakeConfig, 'Storage config was not used.');
  assert(signedUrlInput !== undefined, 'Signed URL dependency was not called.');
  assert(signedUrlInput.config === fakeConfig, 'Signed URL config was not forwarded.');
  assert(signedUrlInput.storage === fakeStorage, 'Signed URL storage adapter was not forwarded.');
  assert(signedUrlInput.organizationId === 'organization-1', 'Signed URL organization was wrong.');
  assert(signedUrlInput.machineId === 'machine-1', 'Signed URL machine was wrong.');
  assert(
    signedUrlInput.storagePath === fakeDocument.storagePath,
    'Signed URL storage path was wrong.',
  );

  assert(issuedInput !== undefined, 'Download URL issued marker was not called.');
  assert(issuedInput.organizationId === 'organization-1', 'Issued marker organization was wrong.');
  assert(issuedInput.machineId === 'machine-1', 'Issued marker machine was wrong.');
  assert(issuedInput.documentId === 'document-1', 'Issued marker document was wrong.');

  assert(activityLogInput !== undefined, 'Activity log dependency was not called.');
  assert(activityLogInput.organizationId === 'organization-1', 'Activity organization was wrong.');
  assert(activityLogInput.action === 'document.download_url_issued', 'Activity action was wrong.');
  assert(activityLogInput.actorUserId === 'app-user-1', 'Activity actor was wrong.');
  assert(activityLogInput.targetType === 'document', 'Activity target type was wrong.');
  assert(activityLogInput.targetId === 'document-1', 'Activity target ID was wrong.');
}

async function runDownloadUrlValidationSmokeCheck(): Promise<void> {
  await expectException('missing organization ID', BadRequestException, () =>
    createDocumentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {},
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  const missingDocumentCalls = createCapturedCalls();

  await expectException('missing document', NotFoundException, () =>
    createDocumentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(missingDocumentCalls, {
        getDocumentByMachine: async (input) => {
          missingDocumentCalls.getDocumentInputs.push(input);

          return null;
        },
      }),
    }),
  );

  assert(
    missingDocumentCalls.signedUrlInputs.length === 0,
    'Missing document should not mint a signed URL.',
  );

  const storageFailureCalls = createCapturedCalls();

  await expectException('storage failure', InternalServerErrorException, () =>
    createDocumentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(storageFailureCalls, {
        createSignedDocumentDownloadUrl: async (input) => {
          storageFailureCalls.signedUrlInputs.push(input);

          throw new Error('storage failed');
        },
      }),
    }),
  );

  assert(
    storageFailureCalls.markDocumentDownloadUrlIssuedInputs.length === 0,
    'Storage failure should not mark a download URL as issued.',
  );
  assert(
    storageFailureCalls.createActivityLogInputs.length === 0,
    'Storage failure should not activity-log URL issuance.',
  );

  const missingIssuedDocumentCalls = createCapturedCalls();

  await expectException('issued document disappeared', NotFoundException, () =>
    createDocumentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(missingIssuedDocumentCalls, {
        markDocumentDownloadUrlIssued: async (input) => {
          missingIssuedDocumentCalls.markDocumentDownloadUrlIssuedInputs.push(input);

          return null;
        },
      }),
    }),
  );

  assert(
    missingIssuedDocumentCalls.createActivityLogInputs.length === 0,
    'Missing issued document should not activity-log URL issuance.',
  );
}

async function runDocumentDownloadUrlSmokeCheck(): Promise<void> {
  await runDownloadUrlSuccessSmokeCheck();
  await runDownloadUrlValidationSmokeCheck();
}

await runDocumentDownloadUrlSmokeCheck();

console.info('Document download URL smoke check passed.');
