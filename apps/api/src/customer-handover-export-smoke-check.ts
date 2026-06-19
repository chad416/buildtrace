import { createHash } from 'node:crypto';

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@buildtrace/db';

import { buildCustomerHandoverZipArchive } from './customer-handover-zip-archive.js';
import {
  createCustomerHandoverExportDownloadUrlFromRequest,
  createCustomerHandoverExportFromRequest,
  maximumCustomerHandoverExportDocuments,
  type CustomerHandoverExportEndpointDependencies,
} from './customer-handover-export.controller.js';
import {
  buildCustomerHandoverExportStoragePath,
  createCustomerHandoverExportSignedUrl,
  removeCustomerHandoverExport,
  uploadCustomerHandoverExport,
} from './customer-handover-export-storage.js';
import type {
  DocumentStorageAdapter,
  DocumentStorageConfig,
  DocumentStorageDownloadAdapter,
} from './document-storage.js';

type PendingExport = Awaited<
  ReturnType<CustomerHandoverExportEndpointDependencies['createPendingCustomerHandoverExport']>
>;
type CompletedExport = Awaited<
  ReturnType<CustomerHandoverExportEndpointDependencies['finalizeCustomerHandoverExportSuccess']>
>;
type RevalidatedExport = Awaited<
  ReturnType<CustomerHandoverExportEndpointDependencies['revalidatePendingCustomerHandoverExport']>
>;

type StorageCall = {
  readonly operation: 'upload' | 'remove' | 'signed-url';
  readonly bucketName: string;
  readonly storagePath: string;
  readonly contentType?: string;
  readonly upsert?: false;
  readonly expiresInSeconds?: number;
};

type CapturedCalls = {
  readonly authorizationOrganizations: string[];
  readonly pendingInputs: Parameters<
    CustomerHandoverExportEndpointDependencies['createPendingCustomerHandoverExport']
  >[0][];
  readonly revalidationInputs: Parameters<
    CustomerHandoverExportEndpointDependencies['revalidatePendingCustomerHandoverExport']
  >[0][];
  readonly downloadPaths: string[];
  readonly archiveInputs: Parameters<
    CustomerHandoverExportEndpointDependencies['buildCustomerHandoverZipArchive']
  >[0][];
  readonly uploadExportIds: string[];
  readonly removeExportIds: string[];
  readonly successfulCompletionIds: string[];
  readonly failureCompletionIds: string[];
  readonly succeededLookupIds: string[];
  readonly signedUrlExportIds: string[];
  readonly activityActions: string[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-19T10:00:00.000Z');
const completedAt = new Date('2026-06-19T10:01:00.000Z');

const storageConfig: DocumentStorageConfig = {
  supabaseUrl: 'https://buildtrace.test',
  serviceRoleKey: 'service-role-key',
  bucketName: 'buildtrace-documents',
  signedUrlTtlSeconds: 900,
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectException(
  name: string,
  expected: new (...args: never[]) => Error,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof expected) {
      return;
    }

    throw error;
  }

  throw new Error(name + ' should throw ' + expected.name + '.');
}

function expectThrow(name: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(name + ' should throw.');
}

function bytes(value: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(value, 'utf8')).buffer;
}

function checksum(value: ArrayBuffer): string {
  return createHash('sha256').update(new Uint8Array(value)).digest('hex');
}

const manualBody = bytes('Machine manual');
const safetyBody = bytes('Safety instructions');

const revalidated: RevalidatedExport = {
  exportId: 'export-1',
  organizationId: 'organization-1',
  machineId: 'machine-1',
  checklistVersion: 'customer-handover-beta-v1',
  documents: [
    {
      documentId: 'document-1',
      fileName: 'Manual.txt',
      storagePath:
        'organizations/organization-1/machines/machine-1/documents/document-1/Manual.txt',
      checksum: checksum(manualBody),
      category: 'manuals',
      visibilityLevel: 'customer-visible',
      visibleToCustomer: true,
    },
    {
      documentId: 'document-2',
      fileName: 'Safety.txt',
      storagePath:
        'organizations/organization-1/machines/machine-1/documents/document-2/Safety.txt',
      checksum: checksum(safetyBody),
      category: 'safety-instructions',
      visibilityLevel: 'customer-visible',
      visibleToCustomer: true,
    },
  ],
};

const pendingExport = {
  id: 'export-1',
  organizationId: 'organization-1',
  machineId: 'machine-1',
  requestedByUserId: 'app-user-1',
  audience: 'CUSTOMER_HANDOVER',
  checklistVersion: 'customer-handover-beta-v1',
  manifest: {},
  result: 'PENDING',
  completedAt: null,
  createdAt: now,
  updatedAt: now,
} as PendingExport;

const completedExport = {
  ...pendingExport,
  result: 'SUCCEEDED',
  completedAt,
  updatedAt: completedAt,
} as CompletedExport;

function createStorageAdapter(
  calls: StorageCall[],
): DocumentStorageAdapter & DocumentStorageDownloadAdapter {
  return {
    from(bucketName) {
      return {
        async createSignedUrl(storagePath, expiresInSeconds) {
          calls.push({
            operation: 'signed-url',
            bucketName,
            storagePath,
            expiresInSeconds,
          });

          return {
            data: {
              signedUrl: 'https://storage.test/signed/customer-handover.zip',
            },
            error: null,
          };
        },
        async upload(storagePath, _fileBody, options) {
          calls.push({
            operation: 'upload',
            bucketName,
            storagePath,
            contentType: options.contentType,
            upsert: options.upsert,
          });

          return {
            data: {
              path: storagePath,
            },
            error: null,
          };
        },
        async download(storagePath) {
          const body = storagePath.includes('document-1') ? manualBody : safetyBody;

          return {
            data: new Blob([body]),
            error: null,
          };
        },
        async remove(storagePaths) {
          for (const storagePath of storagePaths) {
            calls.push({
              operation: 'remove',
              bucketName,
              storagePath,
            });
          }

          return {
            data: [],
            error: null,
          };
        },
      };
    },
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    authorizationOrganizations: [],
    pendingInputs: [],
    revalidationInputs: [],
    downloadPaths: [],
    archiveInputs: [],
    uploadExportIds: [],
    removeExportIds: [],
    successfulCompletionIds: [],
    failureCompletionIds: [],
    succeededLookupIds: [],
    signedUrlExportIds: [],
    activityActions: [],
  };
}

function createDependencies(
  calls: CapturedCalls,
  overrides: Partial<Omit<CustomerHandoverExportEndpointDependencies, 'db'>> = {},
): CustomerHandoverExportEndpointDependencies {
  const storage = createStorageAdapter([]);

  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      calls.authorizationOrganizations.push(input.organizationId);

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
    createPendingCustomerHandoverExport: async (input) => {
      calls.pendingInputs.push(input);

      return pendingExport;
    },
    revalidatePendingCustomerHandoverExport: async (input) => {
      calls.revalidationInputs.push(input);

      return revalidated;
    },
    failCustomerHandoverExport: async (input) => {
      calls.failureCompletionIds.push(input.exportId);

      return {
        ...pendingExport,
        result: 'FAILED',
        completedAt,
      } as PendingExport;
    },
    finalizeCustomerHandoverExportSuccess: async (input) => {
      calls.successfulCompletionIds.push(input.exportId);

      return completedExport;
    },
    getSucceededCustomerHandoverExportArtifact: async (input) => {
      calls.succeededLookupIds.push(input.exportId);

      return completedExport;
    },
    createActivityLog: async (input) => {
      calls.activityActions.push(input.action);

      return {
        id: 'activity-1',
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ipAddress: null,
        userAgent: null,
        createdAt: now,
      };
    },
    readDocumentStorageConfig: () => storageConfig,
    createDocumentStorageAdapter: () => storage,
    downloadDocumentFromStorage: async (input) => {
      calls.downloadPaths.push(input.storagePath);
      const fileBody = input.storagePath.includes('document-1') ? manualBody : safetyBody;

      return {
        fileBody,
        byteLength: fileBody.byteLength,
        contentType: 'text/plain',
      };
    },
    buildCustomerHandoverZipArchive: async (input) => {
      calls.archiveInputs.push(input);

      return buildCustomerHandoverZipArchive(input);
    },
    uploadCustomerHandoverExport: async (input) => {
      calls.uploadExportIds.push(input.exportId);
    },
    removeCustomerHandoverExport: async (input) => {
      calls.removeExportIds.push(input.exportId);
    },
    createCustomerHandoverExportSignedUrl: async (input) => {
      calls.signedUrlExportIds.push(input.exportId);

      return {
        signedUrl: 'https://storage.test/signed/customer-handover.zip',
        expiresInSeconds: 900,
      };
    },
    ...overrides,
  };
}

async function runStorageBoundaryCheck(): Promise<void> {
  const expectedPath =
    'organizations/organization-1/machines/machine-1/exports/export-1/customer-handover.zip';

  assert(
    buildCustomerHandoverExportStoragePath({
      organizationId: 'organization-1',
      machineId: 'machine-1',
      exportId: 'export-1',
    }) === expectedPath,
    'Export storage path is incorrect.',
  );

  expectThrow('export path traversal', () =>
    buildCustomerHandoverExportStoragePath({
      organizationId: '../organization-1',
      machineId: 'machine-1',
      exportId: 'export-1',
    }),
  );

  const calls: StorageCall[] = [];
  const storage = createStorageAdapter(calls);

  await uploadCustomerHandoverExport({
    config: storageConfig,
    storage,
    organizationId: 'organization-1',
    machineId: 'machine-1',
    exportId: 'export-1',
    archiveBody: bytes('zip'),
  });

  const signedUrl = await createCustomerHandoverExportSignedUrl({
    config: storageConfig,
    storage,
    organizationId: 'organization-1',
    machineId: 'machine-1',
    exportId: 'export-1',
  });

  await removeCustomerHandoverExport({
    config: storageConfig,
    storage,
    organizationId: 'organization-1',
    machineId: 'machine-1',
    exportId: 'export-1',
  });

  assert(
    calls.map((call) => call.operation).join('|') === 'upload|signed-url|remove',
    'Export storage operations were not executed in order.',
  );
  assert(
    calls.every((call) => call.storagePath === expectedPath),
    'Export path drifted.',
  );
  assert(calls[0]?.contentType === 'application/zip', 'Export MIME type is incorrect.');
  assert(calls[0]?.upsert === false, 'Export upload must not overwrite an existing artifact.');
  assert(signedUrl.expiresInSeconds === 900, 'Export signed URL TTL is incorrect.');

  await expectException('empty export upload', Error, () =>
    uploadCustomerHandoverExport({
      config: storageConfig,
      storage,
      organizationId: 'organization-1',
      machineId: 'machine-1',
      exportId: 'export-1',
      archiveBody: new ArrayBuffer(0),
    }),
  );
}

async function runSuccessfulCreationCheck(): Promise<void> {
  const calls = createCapturedCalls();

  const response = await createCustomerHandoverExportFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    body: {
      organizationId: ' organization-1 ',
      documentIds: [' document-1 ', 'document-2'],
    },
    dependencies: createDependencies(calls),
  });

  assert(response.export.id === 'export-1', 'Created export ID is incorrect.');
  assert(response.export.result === 'succeeded', 'Created export result is incorrect.');
  assert(response.export.documentCount === 2, 'Created export document count is incorrect.');
  assert(response.export.totalDocumentBytes === 33, 'Created export byte count is incorrect.');
  assert(response.export.archiveByteLength > 0, 'Created export archive is empty.');
  assert(
    response.export.completedAt.getTime() === completedAt.getTime(),
    'Created export completion time is incorrect.',
  );
  assert(!JSON.stringify(response).includes('storagePath'), 'Response exposed a storage path.');
  assert(!JSON.stringify(response).includes('checksum'), 'Response exposed a checksum.');

  assert(calls.authorizationOrganizations.join('|') === 'organization-1', 'Auth scope is wrong.');
  assert(calls.pendingInputs.length === 1, 'Pending export was not created exactly once.');
  assert(
    calls.pendingInputs[0]?.documentIds.join('|') === 'document-1|document-2',
    'Selected document IDs were not normalized.',
  );
  assert(
    calls.revalidationInputs.length === 1,
    'Export must perform one initial pre-download revalidation.',
  );
  assert(calls.downloadPaths.length === 2, 'Every export document must be downloaded.');
  assert(calls.archiveInputs.length === 1, 'ZIP archive must be generated exactly once.');
  assert(calls.uploadExportIds.join('|') === 'export-1', 'ZIP artifact was not uploaded.');
  assert(
    calls.successfulCompletionIds.join('|') === 'export-1',
    'Successful lifecycle completion was not called.',
  );
  assert(calls.failureCompletionIds.length === 0, 'Successful export was marked failed.');
}

async function runCreationFailureChecks(): Promise<void> {
  const finalizationCalls = createCapturedCalls();

  await expectException(
    'atomic finalization revalidation failure',
    InternalServerErrorException,
    () =>
      createCustomerHandoverExportFromRequest({
        authorizationHeader: 'Bearer token-1',
        machineId: 'machine-1',
        body: {
          organizationId: 'organization-1',
          documentIds: ['document-1', 'document-2'],
        },
        dependencies: createDependencies(finalizationCalls, {
          finalizeCustomerHandoverExportSuccess: async (input) => {
            finalizationCalls.successfulCompletionIds.push(input.exportId);

            throw new Error('visibility changed during atomic finalization');
          },
        }),
      }),
  );

  assert(
    finalizationCalls.uploadExportIds.join('|') === 'export-1',
    'Atomic finalization failure must happen after private upload.',
  );

  assert(
    finalizationCalls.removeExportIds.join('|') === 'export-1',
    'Atomic finalization failure must remove the uploaded artifact.',
  );

  assert(
    finalizationCalls.failureCompletionIds.join('|') === 'export-1',
    'Atomic finalization failure must record a failed export.',
  );

  const checksumCalls = createCapturedCalls();

  await expectException('checksum failure', InternalServerErrorException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1', 'document-2'],
      },
      dependencies: createDependencies(checksumCalls, {
        downloadDocumentFromStorage: async (input) => {
          checksumCalls.downloadPaths.push(input.storagePath);
          const fileBody = input.storagePath.includes('document-1')
            ? bytes('tampered manual')
            : safetyBody;

          return {
            fileBody,
            byteLength: fileBody.byteLength,
            contentType: 'text/plain',
          };
        },
      }),
    }),
  );

  assert(checksumCalls.uploadExportIds.length === 0, 'Checksum failure uploaded a ZIP.');
  assert(
    checksumCalls.failureCompletionIds.join('|') === 'export-1',
    'Checksum failure was not recorded.',
  );

  const completionCalls = createCapturedCalls();

  await expectException('success transaction failure', InternalServerErrorException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1', 'document-2'],
      },
      dependencies: createDependencies(completionCalls, {
        finalizeCustomerHandoverExportSuccess: async (input) => {
          completionCalls.successfulCompletionIds.push(input.exportId);
          throw new Error('transaction failed');
        },
      }),
    }),
  );

  assert(
    completionCalls.uploadExportIds.join('|') === 'export-1',
    'Completion failure must happen after artifact upload.',
  );
  assert(
    completionCalls.removeExportIds.join('|') === 'export-1',
    'Completion failure must remove the uploaded artifact.',
  );
  assert(
    completionCalls.failureCompletionIds.join('|') === 'export-1',
    'Completion failure must record a failed export.',
  );

  const ambiguousUploadCalls = createCapturedCalls();

  await expectException('ambiguous upload failure', InternalServerErrorException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1', 'document-2'],
      },
      dependencies: createDependencies(ambiguousUploadCalls, {
        uploadCustomerHandoverExport: async (input) => {
          ambiguousUploadCalls.uploadExportIds.push(input.exportId);

          throw new Error('Storage response was lost after upload.');
        },
      }),
    }),
  );

  assert(
    ambiguousUploadCalls.uploadExportIds.join('|') === 'export-1',
    'Ambiguous upload was not attempted.',
  );

  assert(
    ambiguousUploadCalls.removeExportIds.join('|') === 'export-1',
    'Ambiguous upload failure must attempt artifact removal.',
  );

  assert(
    ambiguousUploadCalls.failureCompletionIds.join('|') === 'export-1',
    'Ambiguous upload failure must mark the export failed.',
  );

  const recoveryFailureCalls = createCapturedCalls();
  const reportedRecoveryFailures: string[] = [];

  await expectException('observable recovery failure', InternalServerErrorException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1', 'document-2'],
      },
      dependencies: createDependencies(recoveryFailureCalls, {
        uploadCustomerHandoverExport: async (input) => {
          recoveryFailureCalls.uploadExportIds.push(input.exportId);

          throw new Error('Ambiguous storage failure.');
        },
        failCustomerHandoverExport: async (input) => {
          recoveryFailureCalls.failureCompletionIds.push(input.exportId);

          throw new Error('Failure transition unavailable.');
        },
        removeCustomerHandoverExport: async (input) => {
          recoveryFailureCalls.removeExportIds.push(input.exportId);

          throw new Error('Artifact cleanup unavailable.');
        },
        reportRecoveryFailure: (failure) => {
          reportedRecoveryFailures.push(
            [failure.operation, failure.organizationId, failure.machineId, failure.exportId].join(
              ':',
            ),
          );
        },
      }),
    }),
  );

  assert(
    reportedRecoveryFailures.join('|') ===
      'mark-export-failed:organization-1:machine-1:export-1|' +
        'remove-export-artifact:organization-1:machine-1:export-1',
    'Every failed recovery operation must be observable with tenant scope.',
  );

  const authCalls = createCapturedCalls();

  await expectException('authentication failure', Error, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer invalid',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1'],
      },
      dependencies: createDependencies(authCalls, {
        resolveAuthenticatedTenantContext: async () => {
          throw new Error('authentication failed');
        },
      }),
    }),
  );

  assert(authCalls.pendingInputs.length === 0, 'Authentication failure created export history.');
}

async function runCreationValidationChecks(): Promise<void> {
  await expectException('missing document IDs', BadRequestException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectException('duplicate document IDs', BadRequestException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: ['document-1', 'document-1'],
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectException('excessive document IDs', BadRequestException, () =>
    createCustomerHandoverExportFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'organization-1',
        documentIds: Array.from(
          { length: maximumCustomerHandoverExportDocuments + 1 },
          (_, index) => 'document-' + index,
        ),
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );
}

async function runDownloadUrlChecks(): Promise<void> {
  const successCalls = createCapturedCalls();

  const response = await createCustomerHandoverExportDownloadUrlFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    exportId: ' export-1 ',
    body: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(successCalls),
  });

  assert(response.exportId === 'export-1', 'Download URL export ID is incorrect.');
  assert(response.expiresInSeconds === 900, 'Download URL TTL is incorrect.');
  assert(response.downloadUrl.includes('signed'), 'Download URL was not returned.');
  assert(successCalls.succeededLookupIds.join('|') === 'export-1', 'Export lookup was not scoped.');
  assert(successCalls.signedUrlExportIds.join('|') === 'export-1', 'Signed URL was not created.');
  assert(
    successCalls.activityActions.join('|') === 'customer_handover_export.download_url_issued',
    'Signed URL issuance was not activity-logged.',
  );

  const missingCalls = createCapturedCalls();

  await expectException('cross-tenant or missing export', NotFoundException, () =>
    createCustomerHandoverExportDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      exportId: 'export-1',
      body: {
        organizationId: 'organization-2',
      },
      dependencies: createDependencies(missingCalls, {
        getSucceededCustomerHandoverExportArtifact: async (input) => {
          missingCalls.succeededLookupIds.push(input.exportId);

          return null;
        },
      }),
    }),
  );

  assert(missingCalls.signedUrlExportIds.length === 0, 'Missing export minted a signed URL.');
  assert(missingCalls.activityActions.length === 0, 'Missing export was activity-logged.');

  const storageFailureCalls = createCapturedCalls();

  await expectException('signed URL storage failure', InternalServerErrorException, () =>
    createCustomerHandoverExportDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      exportId: 'export-1',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(storageFailureCalls, {
        createCustomerHandoverExportSignedUrl: async (input) => {
          storageFailureCalls.signedUrlExportIds.push(input.exportId);
          throw new Error('storage failure');
        },
      }),
    }),
  );

  assert(
    storageFailureCalls.activityActions.length === 0,
    'Failed signed URL issuance was activity-logged.',
  );
}

await runStorageBoundaryCheck();
await runSuccessfulCreationCheck();
await runCreationFailureChecks();
await runCreationValidationChecks();
await runDownloadUrlChecks();

console.info('Customer handover export endpoint smoke check passed.');
