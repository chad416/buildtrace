import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  ConfirmDocumentClassificationSuggestionInput,
  DocumentRecord,
  OrganizationRole,
  PrismaClient,
} from '@buildtrace/db';

import {
  applyDocumentClassificationSuggestionFromRequest,
  confirmDocumentClassificationSuggestionFromRequest,
  getDocumentFromRequest,
  listDocumentsFromRequest,
  updateDocumentCategoryFromRequest,
  updateDocumentVisibilityFromRequest,
  type ApplyDocumentClassificationSuggestionResponse,
  type ConfirmDocumentClassificationSuggestionResponse,
  type DocumentMetadataResponse,
  type DocumentRecordsEndpointDependencies,
} from './document-records.controller.js';

type ResolveInput = Parameters<
  DocumentRecordsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];

type ListDocumentsInput = Parameters<
  DocumentRecordsEndpointDependencies['listDocumentsByMachine']
>[0];

type GetDocumentInput = Parameters<DocumentRecordsEndpointDependencies['getDocumentByMachine']>[0];

type UpdateDocumentCategoryInput = Parameters<
  DocumentRecordsEndpointDependencies['updateDocumentCategory']
>[0];

type UpdateDocumentVisibilityInput = Parameters<
  DocumentRecordsEndpointDependencies['updateDocumentVisibility']
>[0];

type ApplyDocumentClassificationSuggestionInput = Parameters<
  DocumentRecordsEndpointDependencies['applyDocumentClassificationSuggestion']
>[0];

type CreateActivityLogInput = Parameters<
  DocumentRecordsEndpointDependencies['createActivityLog']
>[0];

type CapturedResolveInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
};

type CapturedCalls = {
  readonly resolveInputs: CapturedResolveInput[];
  readonly listDocumentsInputs: ListDocumentsInput[];
  readonly getDocumentInputs: GetDocumentInput[];
  readonly updateDocumentCategoryInputs: UpdateDocumentCategoryInput[];
  readonly updateDocumentVisibilityInputs: UpdateDocumentVisibilityInput[];
  readonly applyDocumentClassificationSuggestionInputs: ApplyDocumentClassificationSuggestionInput[];
  readonly confirmDocumentClassificationSuggestionInputs: ConfirmDocumentClassificationSuggestionInput[];
  readonly createActivityLogInputs: CreateActivityLogInput[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-14T00:00:00.000Z');

const fakeDocument: DocumentRecord = {
  id: 'document-1',
  organizationId: 'organization-1',
  machineId: 'machine-1',
  fileName: 'Manual.pdf',
  storagePath: 'organizations/organization-1/machines/machine-1/documents/manual.pdf',
  fileType: 'application/pdf',
  category: 'manuals',
  suggestedCategory: null,
  classificationConfidence: null,
  classificationStatus: 'unclassified',
  classificationSource: null,
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
    listDocumentsInputs: [],
    getDocumentInputs: [],
    updateDocumentCategoryInputs: [],
    updateDocumentVisibilityInputs: [],
    applyDocumentClassificationSuggestionInputs: [],
    confirmDocumentClassificationSuggestionInputs: [],
    createActivityLogInputs: [],
  };
}

function createDependencies(capturedCalls: CapturedCalls): DocumentRecordsEndpointDependencies {
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
    listDocumentsByMachine: async (input) => {
      capturedCalls.listDocumentsInputs.push(input);

      return [fakeDocument];
    },
    getDocumentByMachine: async (input) => {
      capturedCalls.getDocumentInputs.push(input);

      return fakeDocument;
    },
    updateDocumentCategory: async (input) => {
      capturedCalls.updateDocumentCategoryInputs.push(input);

      return {
        ...fakeDocument,
        category: input.category,
        visibilityLevel: input.category === 'plc' ? 'sensitive-engineering' : 'internal',
        visibleToCustomer: false,
      };
    },
    updateDocumentVisibility: async (input) => {
      capturedCalls.updateDocumentVisibilityInputs.push(input);

      return {
        ...fakeDocument,
        visibilityLevel: input.visibilityLevel,
        visibleToCustomer: input.visibilityLevel === 'customer-visible',
      };
    },
    applyDocumentClassificationSuggestion: async (input) => {
      capturedCalls.applyDocumentClassificationSuggestionInputs.push(input);

      return {
        ...fakeDocument,
        suggestedCategory: 'plc',
        classificationConfidence: 96,
        classificationStatus: 'classified',
        classificationSource: 'filename-type',
      };
    },
    markDocumentDownloadUrlIssued: async () => ({
      ...fakeDocument,
      lastDownloadUrlIssuedAt: now,
    }),
    createActivityLog: async (input) => ({
      id: 'activity-log-1',
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: now,
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
    createSignedDocumentDownloadUrl: async (input) => ({
      signedUrl: 'https://storage.example/signed/manual.pdf',
      expiresInSeconds: input.config.signedUrlTtlSeconds,
    }),
  };
}

type ConfirmDocumentClassificationSuggestionDependencies = DocumentRecordsEndpointDependencies & {
  readonly confirmDocumentClassificationSuggestion: (
    input: ConfirmDocumentClassificationSuggestionInput,
  ) => Promise<DocumentRecord | null>;
};

type ConfirmationDependencyOptions = {
  readonly currentDocument?: DocumentRecord | null;
  readonly confirmedDocument?: DocumentRecord | null;
};

function createConfirmationDependencies(
  capturedCalls: CapturedCalls,
  options: ConfirmationDependencyOptions = {},
): ConfirmDocumentClassificationSuggestionDependencies {
  const baseDependencies = createDependencies(capturedCalls);
  const suggestedDocument: DocumentRecord = {
    ...fakeDocument,
    category: 'other',
    suggestedCategory: 'plc',
    classificationConfidence: 96,
    classificationStatus: 'classified',
    classificationSource: 'filename-type',
  };
  const confirmedDocument: DocumentRecord = {
    ...suggestedDocument,
    category: 'plc',
    classificationStatus: 'manually-confirmed',
    classificationSource: 'manual',
    visibilityLevel: fakeDocument.visibilityLevel,
    visibleToCustomer: fakeDocument.visibleToCustomer,
  };
  const currentDocument =
    'currentDocument' in options ? options.currentDocument : suggestedDocument;
  const confirmationResult =
    'confirmedDocument' in options ? options.confirmedDocument : confirmedDocument;

  return {
    ...baseDependencies,
    getDocumentByMachine: async (input) => {
      capturedCalls.getDocumentInputs.push(input);

      return currentDocument;
    },
    confirmDocumentClassificationSuggestion: async (input) => {
      capturedCalls.confirmDocumentClassificationSuggestionInputs.push(input);

      return confirmationResult;
    },
    createActivityLog: async (input) => {
      capturedCalls.createActivityLogInputs.push(input);

      return baseDependencies.createActivityLog(input);
    },
  };
}
function createDependenciesWithMissingDocument(
  capturedCalls: CapturedCalls,
): DocumentRecordsEndpointDependencies {
  return {
    ...createDependencies(capturedCalls),
    getDocumentByMachine: async (input) => {
      capturedCalls.getDocumentInputs.push(input);

      return null;
    },
    updateDocumentCategory: async (input) => {
      capturedCalls.updateDocumentCategoryInputs.push(input);

      return null;
    },
    updateDocumentVisibility: async (input) => {
      capturedCalls.updateDocumentVisibilityInputs.push(input);

      return null;
    },
    applyDocumentClassificationSuggestion: async (input) => {
      capturedCalls.applyDocumentClassificationSuggestionInputs.push(input);

      return null;
    },
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

async function expectBadRequest(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw BadRequestException.`);
}

async function expectNotFound(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof NotFoundException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw NotFoundException.`);
}

function assertResolveInput(
  resolveInput: CapturedResolveInput | undefined,
  expectedRoles: readonly OrganizationRole[],
  label: string,
): void {
  assert(resolveInput !== undefined, `${label} auth tenant context dependency was not called.`);
  assert(
    resolveInput.authorizationHeader === 'Bearer token-1',
    `${label} auth header was not forwarded.`,
  );
  assert(
    resolveInput.organizationId === 'organization-1',
    `${label} organization ID was not normalized.`,
  );
  assert(resolveInput.db === fakeDb, `${label} DB dependency was not forwarded to auth.`);
  assert(
    resolveInput.allowedRoles?.join(',') === expectedRoles.join(','),
    `${label} allowed roles were wrong.`,
  );
}

function assertSanitizedDocument(document: DocumentMetadataResponse, label: string): void {
  const runtimeDocument = document as Record<string, unknown>;

  assert(!('storagePath' in runtimeDocument), `${label} exposed raw private storage path.`);
  assert(!('checksum' in runtimeDocument), `${label} exposed checksum.`);
}

function assertClassificationResponse(
  response: ApplyDocumentClassificationSuggestionResponse,
  label: string,
): void {
  assert(response.document.suggestedCategory === 'plc', `${label} did not expose suggestion.`);
  assert(response.document.classificationConfidence === 96, `${label} did not expose confidence.`);
  assert(
    response.document.classificationStatus === 'classified',
    `${label} did not expose status.`,
  );
  assert(
    response.document.classificationSource === 'filename-type',
    `${label} did not expose source.`,
  );
  assert(
    response.document.category === fakeDocument.category,
    `${label} must not auto-apply suggested category.`,
  );
  assert(
    response.document.visibilityLevel === fakeDocument.visibilityLevel,
    `${label} must not change visibility.`,
  );
}

function assertConfirmationResponse(
  response: ConfirmDocumentClassificationSuggestionResponse,
  label: string,
): void {
  assert(response.document.category === 'plc', `${label} did not apply suggested category.`);
  assert(
    response.document.classificationStatus === 'manually-confirmed',
    `${label} did not mark manual confirmation.`,
  );
  assert(
    response.document.classificationSource === 'manual',
    `${label} did not record manual source.`,
  );
  assert(
    response.document.visibilityLevel === fakeDocument.visibilityLevel,
    `${label} must not change visibility.`,
  );
  assert(
    response.document.visibleToCustomer === fakeDocument.visibleToCustomer,
    `${label} must not change customer exposure.`,
  );
}
async function runDocumentReadSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const listResponse = await listDocumentsFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const getResponse = await getDocumentFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(listResponse.documents.length === 1, 'List documents endpoint did not return documents.');
  assert(
    getResponse.document.id === 'document-1',
    'Get document endpoint did not return document.',
  );

  const [listedDocument] = listResponse.documents;

  if (!listedDocument) {
    throw new Error('List document response did not include the seeded document.');
  }

  assertSanitizedDocument(listedDocument, 'List document response');
  assertSanitizedDocument(getResponse.document, 'Get document response');

  assertResolveInput(capturedCalls.resolveInputs[0], ['OWNER', 'ADMIN', 'MEMBER'], 'Document list');
  assertResolveInput(capturedCalls.resolveInputs[1], ['OWNER', 'ADMIN', 'MEMBER'], 'Document get');

  const listInput = capturedCalls.listDocumentsInputs[0];
  const getInput = capturedCalls.getDocumentInputs[0];

  assert(listInput !== undefined, 'List documents dependency was not called.');
  assert(getInput !== undefined, 'Get document dependency was not called.');

  assert(listInput.db === fakeDb, 'DB dependency was not forwarded to document list.');
  assert(listInput.organizationId === 'organization-1', 'Document list organization ID was wrong.');
  assert(listInput.machineId === 'machine-1', 'Document list machine ID was wrong.');

  assert(getInput.db === fakeDb, 'DB dependency was not forwarded to document get.');
  assert(getInput.organizationId === 'organization-1', 'Document get organization ID was wrong.');
  assert(getInput.machineId === 'machine-1', 'Document get machine ID was wrong.');
  assert(getInput.documentId === 'document-1', 'Document get document ID was wrong.');
}

async function runDocumentUpdateSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const categoryResponse = await updateDocumentCategoryFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    body: {
      organizationId: ' organization-1 ',
      category: ' plc ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const visibilityResponse = await updateDocumentVisibilityFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    body: {
      organizationId: ' organization-1 ',
      visibilityLevel: ' customer-visible ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const classificationResponse = await applyDocumentClassificationSuggestionFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    body: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(categoryResponse.document.category === 'plc', 'Category update did not return category.');
  assert(
    categoryResponse.document.visibilityLevel === 'sensitive-engineering',
    'PLC category update did not keep sensitive engineering default.',
  );
  assert(
    visibilityResponse.document.visibilityLevel === 'customer-visible',
    'Visibility update did not return visibility.',
  );
  assert(
    visibilityResponse.document.visibleToCustomer === true,
    'Customer-visible update did not expose explicit visibility.',
  );
  assertClassificationResponse(classificationResponse, 'Classification suggestion response');

  assertSanitizedDocument(categoryResponse.document, 'Category update response');
  assertSanitizedDocument(visibilityResponse.document, 'Visibility update response');

  assertResolveInput(
    capturedCalls.resolveInputs[0],
    ['OWNER', 'ADMIN'],
    'Document category update',
  );
  assertResolveInput(
    capturedCalls.resolveInputs[1],
    ['OWNER', 'ADMIN'],
    'Document visibility update',
  );
  assertResolveInput(
    capturedCalls.resolveInputs[2],
    ['OWNER', 'ADMIN'],
    'Document classification suggestion',
  );

  const categoryInput = capturedCalls.updateDocumentCategoryInputs[0];
  const visibilityInput = capturedCalls.updateDocumentVisibilityInputs[0];
  const classificationInput = capturedCalls.applyDocumentClassificationSuggestionInputs[0];

  assert(categoryInput !== undefined, 'Update document category dependency was not called.');
  assert(visibilityInput !== undefined, 'Update document visibility dependency was not called.');
  assert(
    classificationInput !== undefined,
    'Apply document classification suggestion dependency was not called.',
  );

  assert(categoryInput.db === fakeDb, 'DB dependency was not forwarded to category update.');
  assert(categoryInput.organizationId === 'organization-1', 'Category organization ID was wrong.');
  assert(categoryInput.machineId === 'machine-1', 'Category machine ID was wrong.');
  assert(categoryInput.documentId === 'document-1', 'Category document ID was wrong.');
  assert(categoryInput.category === 'plc', 'Category was not normalized.');

  assert(visibilityInput.db === fakeDb, 'DB dependency was not forwarded to visibility update.');
  assert(
    visibilityInput.organizationId === 'organization-1',
    'Visibility organization ID was wrong.',
  );
  assert(visibilityInput.machineId === 'machine-1', 'Visibility machine ID was wrong.');
  assert(visibilityInput.documentId === 'document-1', 'Visibility document ID was wrong.');
  assert(
    visibilityInput.visibilityLevel === 'customer-visible',
    'Visibility level was not normalized.',
  );

  assert(
    classificationInput.db === fakeDb,
    'DB dependency was not forwarded to classification suggestion.',
  );
  assert(
    classificationInput.organizationId === 'organization-1',
    'Classification suggestion organization ID was wrong.',
  );
  assert(classificationInput.machineId === 'machine-1', 'Classification machine ID was wrong.');
  assert(classificationInput.documentId === 'document-1', 'Classification document ID was wrong.');
}

async function runDocumentClassificationConfirmationSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const response = await confirmDocumentClassificationSuggestionFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    documentId: ' document-1 ',
    body: {
      organizationId: ' organization-1 ',
    },
    dependencies: createConfirmationDependencies(capturedCalls),
  });

  assertConfirmationResponse(response, 'Classification confirmation response');
  assertSanitizedDocument(response.document, 'Classification confirmation response');

  assertResolveInput(
    capturedCalls.resolveInputs[0],
    ['OWNER', 'ADMIN'],
    'Document classification confirmation',
  );

  const getInput = capturedCalls.getDocumentInputs[0];
  const confirmationInput = capturedCalls.confirmDocumentClassificationSuggestionInputs[0];
  const activityLogInput = capturedCalls.createActivityLogInputs[0];

  assert(getInput !== undefined, 'Confirmation did not read the current document.');
  assert(confirmationInput !== undefined, 'Confirmation dependency was not called.');
  assert(activityLogInput !== undefined, 'Confirmation activity log was not created.');

  assert(getInput.db === fakeDb, 'DB dependency was not forwarded to confirmation read.');
  assert(
    getInput.organizationId === 'organization-1',
    'Confirmation read organization ID was wrong.',
  );
  assert(getInput.machineId === 'machine-1', 'Confirmation read machine ID was wrong.');
  assert(getInput.documentId === 'document-1', 'Confirmation read document ID was wrong.');

  assert(
    confirmationInput.db === fakeDb,
    'DB dependency was not forwarded to classification confirmation.',
  );
  assert(
    confirmationInput.organizationId === 'organization-1',
    'Confirmation organization ID was wrong.',
  );
  assert(confirmationInput.machineId === 'machine-1', 'Confirmation machine ID was wrong.');
  assert(confirmationInput.documentId === 'document-1', 'Confirmation document ID was wrong.');

  assert(
    activityLogInput.action === 'document.classification_confirmed',
    'Confirmation audit action was wrong.',
  );
  assert(activityLogInput.actorUserId === 'app-user-1', 'Confirmation audit actor was wrong.');
  assert(activityLogInput.targetType === 'document', 'Confirmation audit target type was wrong.');
  assert(activityLogInput.targetId === 'document-1', 'Confirmation audit target ID was wrong.');

  await expectBadRequest('classification confirmation without suggestion', () =>
    confirmDocumentClassificationSuggestionFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createConfirmationDependencies(createCapturedCalls(), {
        currentDocument: fakeDocument,
      }),
    }),
  );

  await expectNotFound('classification confirmation document not found', () =>
    confirmDocumentClassificationSuggestionFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: createConfirmationDependencies(createCapturedCalls(), {
        currentDocument: null,
      }),
    }),
  );
}
async function runValidationSmokeCheck(): Promise<void> {
  await expectBadRequest('missing document list organization ID', () =>
    listDocumentsFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      query: {},
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing machine ID', () =>
    listDocumentsFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing document ID', () =>
    getDocumentFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('invalid document category', () =>
    updateDocumentCategoryFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {
        organizationId: 'organization-1',
        category: 'public',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('invalid document visibility', () =>
    updateDocumentVisibilityFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      body: {
        organizationId: 'organization-1',
        visibilityLevel: 'public',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  const missingDocumentDependencies = createDependenciesWithMissingDocument(createCapturedCalls());

  await expectNotFound('document not found', () =>
    getDocumentFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: missingDocumentDependencies,
    }),
  );

  await expectNotFound('category document not found', () =>
    updateDocumentCategoryFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      body: {
        organizationId: 'organization-1',
        category: 'manuals',
      },
      dependencies: missingDocumentDependencies,
    }),
  );

  await expectNotFound('visibility document not found', () =>
    updateDocumentVisibilityFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      body: {
        organizationId: 'organization-1',
        visibilityLevel: 'internal',
      },
      dependencies: missingDocumentDependencies,
    }),
  );

  await expectNotFound('classification document not found', () =>
    applyDocumentClassificationSuggestionFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      documentId: 'document-404',
      body: {
        organizationId: 'organization-1',
      },
      dependencies: missingDocumentDependencies,
    }),
  );

  await expectThrows('auth dependency failure', () =>
    listDocumentsFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: {
        ...createDependencies(createCapturedCalls()),
        resolveAuthenticatedTenantContext: async () => {
          throw new Error('auth failed');
        },
      },
    }),
  );
}

async function runDocumentRecordsControllerSmokeCheck(): Promise<void> {
  await runDocumentReadSmokeCheck();
  await runDocumentUpdateSmokeCheck();
  await runDocumentClassificationConfirmationSmokeCheck();
  await runValidationSmokeCheck();
}

await runDocumentRecordsControllerSmokeCheck();

console.info('Document records controller smoke check passed.');
