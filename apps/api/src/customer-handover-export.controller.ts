import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type {
  MachineRecord,
  OrganizationRole,
  PrismaClient,
  RevalidatedCustomerHandoverExport,
  SucceededCustomerHandoverExportSummary,
} from '@buildtrace/db';
import { documentLabels, handoverCompletenessCopy } from '@buildtrace/i18n';
import {
  failCustomerHandoverExport,
  createActivityLog,
  createPendingCustomerHandoverExport,
  createPrismaClient,
  finalizeCustomerHandoverExportSuccess,
  getMachineByOrganization,
  getSucceededCustomerHandoverExportArtifact,
  listSucceededCustomerHandoverExports,
  revalidatePendingCustomerHandoverExport,
} from '@buildtrace/db';
import {
  activityLogActions,
  buildPrivateCustomerHandoverExportStoragePath,
  evaluateCustomerHandoverCompleteness,
  sensitiveEngineeringDocumentCategories,
  supportedLocales,
  type CustomerHandoverDocument,
  type SupportedLocale,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';
import {
  createCustomerHandoverExportSignedUrl,
  createCustomerHandoverPdfSummarySignedUrl,
  removeCustomerHandoverExport,
  uploadCustomerHandoverExport,
  uploadCustomerHandoverPdfSummary,
} from './customer-handover-export-storage.js';
import { buildCustomerHandoverPdfSummary } from './customer-handover-pdf-summary.js';
import {
  buildCustomerHandoverZipArchive,
  type CustomerHandoverZipArchive,
} from './customer-handover-zip-archive.js';
import {
  createSupabaseDocumentStorageAdapter,
  downloadDocumentFromStorage,
  readDocumentStorageConfig,
  type DocumentStorageAdapter,
  type DocumentStorageConfig,
  type DocumentStorageDownloadAdapter,
  type DocumentStorageSignedUrlResult,
} from './document-storage.js';

export const maximumCustomerHandoverExportDocuments = 50;
export const maximumCustomerHandoverDocumentBytes = 25 * 1024 * 1024;
export const maximumCustomerHandoverTotalDocumentBytes = 50 * 1024 * 1024;
export const maximumCustomerHandoverArchiveBytes = 55 * 1024 * 1024;

export type CreateCustomerHandoverExportRequestBody = {
  readonly organizationId?: unknown;
  readonly documentIds?: unknown;
  readonly locale?: unknown;
};

export type CreateCustomerHandoverExportResponse = {
  readonly export: {
    readonly id: string;
    readonly result: 'succeeded';
    readonly checklistVersion: string;
    readonly documentCount: number;
    readonly totalDocumentBytes: number;
    readonly archiveByteLength: number;
    readonly createdAt: Date;
    readonly completedAt: Date;
  };
  readonly sensitiveCategories: readonly string[];
  readonly pdfStoragePath?: string;
};

export type CreateCustomerHandoverExportDownloadUrlRequestBody = {
  readonly organizationId?: unknown;
};

export type CreateCustomerHandoverExportDownloadUrlResponse = {
  readonly exportId: string;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

export type CreateCustomerHandoverPdfSummaryDownloadUrlResponse =
  CreateCustomerHandoverExportDownloadUrlResponse;

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

type GetMachineByOrganizationDependency = (
  input: Parameters<typeof getMachineByOrganization>[0],
) => Promise<Pick<MachineRecord, 'id' | 'machineName' | 'serialNumber'> | null>;

type ListSucceededCustomerHandoverExportsDependency = (
  input: Parameters<typeof listSucceededCustomerHandoverExports>[0],
) => Promise<readonly SucceededCustomerHandoverExportSummary[]>;

type CustomerHandoverStorageAdapter = DocumentStorageAdapter & DocumentStorageDownloadAdapter;

type FinalizeCustomerHandoverExportDependency = (
  input: Parameters<typeof finalizeCustomerHandoverExportSuccess>[0],
) => Promise<
  Pick<
    Awaited<ReturnType<typeof finalizeCustomerHandoverExportSuccess>>,
    'id' | 'checklistVersion' | 'createdAt' | 'completedAt'
  >
>;

type GetSucceededCustomerHandoverExportArtifactDependency = (
  input: Parameters<typeof getSucceededCustomerHandoverExportArtifact>[0],
) => Promise<Pick<
  NonNullable<Awaited<ReturnType<typeof getSucceededCustomerHandoverExportArtifact>>>,
  'id' | 'manifest'
> | null>;

export type CustomerHandoverRecoveryFailure = {
  readonly operation: 'mark-export-failed' | 'remove-export-artifact';
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
  readonly reason: unknown;
};

export type CustomerHandoverExportEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly getMachineByOrganization: GetMachineByOrganizationDependency;
  readonly listSucceededCustomerHandoverExports: ListSucceededCustomerHandoverExportsDependency;
  readonly createPendingCustomerHandoverExport: typeof createPendingCustomerHandoverExport;
  readonly revalidatePendingCustomerHandoverExport: typeof revalidatePendingCustomerHandoverExport;
  readonly failCustomerHandoverExport: typeof failCustomerHandoverExport;
  readonly finalizeCustomerHandoverExportSuccess: FinalizeCustomerHandoverExportDependency;
  readonly getSucceededCustomerHandoverExportArtifact: GetSucceededCustomerHandoverExportArtifactDependency;
  readonly createActivityLog: typeof createActivityLog;
  readonly readDocumentStorageConfig: () => DocumentStorageConfig;
  readonly createDocumentStorageAdapter: (
    config: DocumentStorageConfig,
  ) => CustomerHandoverStorageAdapter;
  readonly downloadDocumentFromStorage: typeof downloadDocumentFromStorage;
  readonly buildCustomerHandoverZipArchive: typeof buildCustomerHandoverZipArchive;
  readonly buildCustomerHandoverPdfSummary: typeof buildCustomerHandoverPdfSummary;
  readonly uploadCustomerHandoverExport: typeof uploadCustomerHandoverExport;
  readonly uploadCustomerHandoverPdfSummary: typeof uploadCustomerHandoverPdfSummary;
  readonly removeCustomerHandoverExport: typeof removeCustomerHandoverExport;
  readonly createCustomerHandoverExportSignedUrl: typeof createCustomerHandoverExportSignedUrl;
  readonly createCustomerHandoverPdfSummarySignedUrl: typeof createCustomerHandoverPdfSummarySignedUrl;
  readonly reportRecoveryFailure?: (failure: CustomerHandoverRecoveryFailure) => void;
};

type CreateCustomerHandoverExportFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreateCustomerHandoverExportRequestBody | undefined;
  readonly dependencies: CustomerHandoverExportEndpointDependencies;
};

type CreateCustomerHandoverExportDownloadUrlFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly exportId: string | undefined;
  readonly body: CreateCustomerHandoverExportDownloadUrlRequestBody | undefined;
  readonly dependencies: CustomerHandoverExportEndpointDependencies;
};

type CreateCustomerHandoverPdfSummaryDownloadUrlFromRequestInput =
  CreateCustomerHandoverExportDownloadUrlFromRequestInput;

export type ListCustomerHandoverExportsQuery = {
  readonly organizationId?: unknown;
};

export type ListCustomerHandoverExportsResponse = {
  readonly exports: ReadonlyArray<{
    readonly id: string;
    readonly checklistVersion: string;
    readonly documentCount: number;
    readonly archiveByteLength: number;
    readonly totalDocumentBytes: number;
    readonly createdAt: Date;
    readonly completedAt: Date;
  }>;
};

type ListCustomerHandoverExportsFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: ListCustomerHandoverExportsQuery | undefined;
  readonly dependencies: CustomerHandoverExportEndpointDependencies;
};

const exportRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

const db = createPrismaClient();

const logger = new Logger('CustomerHandoverExportController');

function requiredString(name: string, value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(name + ' is required.');
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new BadRequestException(name + ' is required.');
  }

  return normalized;
}

function documentIds(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('documentIds must contain at least one document ID.');
  }

  if (value.length > maximumCustomerHandoverExportDocuments) {
    throw new BadRequestException(
      'documentIds must contain no more than ' +
        maximumCustomerHandoverExportDocuments +
        ' document IDs.',
    );
  }

  const normalized = value.map((documentId) => requiredString('documentId', documentId));

  if (new Set(normalized).size !== normalized.length) {
    throw new BadRequestException('documentIds must not contain duplicates.');
  }

  return normalized;
}

function supportedLocale(value: unknown): SupportedLocale {
  if (typeof value === 'string' && supportedLocales.includes(value.trim() as SupportedLocale)) {
    return value.trim() as SupportedLocale;
  }

  return 'en';
}

function pdfStoragePathFromManifest(manifest: unknown): string | undefined {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    return undefined;
  }

  const pdfStoragePath = (manifest as Record<string, unknown>).pdfStoragePath;

  if (typeof pdfStoragePath !== 'string' || !pdfStoragePath.trim()) {
    return undefined;
  }

  return pdfStoragePath.trim();
}

function reportPdfSummaryFailure(
  organizationId: string,
  machineId: string,
  exportId: string,
  reason: unknown,
): void {
  const error = reason instanceof Error ? (reason.stack ?? reason.message) : String(reason);

  logger.error(
    [
      'Customer handover PDF summary could not be created.',
      'organizationId=' + organizationId,
      'machineId=' + machineId,
      'exportId=' + exportId,
      error,
    ].join(' '),
  );
}

function reportRecoveryFailure(failure: CustomerHandoverRecoveryFailure): void {
  const reason =
    failure.reason instanceof Error
      ? (failure.reason.stack ?? failure.reason.message)
      : String(failure.reason);

  logger.error(
    [
      'Customer handover export recovery failed.',
      'operation=' + failure.operation,
      'organizationId=' + failure.organizationId,
      'machineId=' + failure.machineId,
      'exportId=' + failure.exportId,
      reason,
    ].join(' '),
  );
}

function createRealDependencies(): CustomerHandoverExportEndpointDependencies {
  return {
    db,
    resolveAuthenticatedTenantContext,
    getMachineByOrganization,
    listSucceededCustomerHandoverExports,
    createPendingCustomerHandoverExport,
    revalidatePendingCustomerHandoverExport,
    failCustomerHandoverExport,
    finalizeCustomerHandoverExportSuccess,
    getSucceededCustomerHandoverExportArtifact,
    createActivityLog,
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
    downloadDocumentFromStorage,
    buildCustomerHandoverZipArchive,
    buildCustomerHandoverPdfSummary,
    uploadCustomerHandoverExport,
    uploadCustomerHandoverPdfSummary,
    removeCustomerHandoverExport,
    createCustomerHandoverExportSignedUrl,
    createCustomerHandoverPdfSummarySignedUrl,
    reportRecoveryFailure,
  };
}

async function downloadExportDocuments(
  revalidated: RevalidatedCustomerHandoverExport,
  config: DocumentStorageConfig,
  storage: CustomerHandoverStorageAdapter,
  dependencies: CustomerHandoverExportEndpointDependencies,
): Promise<
  readonly {
    readonly manifestEntry: RevalidatedCustomerHandoverExport['documents'][number];
    readonly fileBody: ArrayBuffer;
  }[]
> {
  const downloaded: {
    readonly manifestEntry: RevalidatedCustomerHandoverExport['documents'][number];
    readonly fileBody: ArrayBuffer;
  }[] = [];

  let totalBytes = 0;

  for (const manifestEntry of revalidated.documents) {
    const remainingBytes = maximumCustomerHandoverTotalDocumentBytes - totalBytes;

    if (remainingBytes <= 0) {
      throw new Error('Customer handover documents exceed the aggregate size limit.');
    }

    const result = await dependencies.downloadDocumentFromStorage({
      config,
      storage,
      organizationId: revalidated.organizationId,
      machineId: revalidated.machineId,
      storagePath: manifestEntry.storagePath,
      maximumBytes: Math.min(maximumCustomerHandoverDocumentBytes, remainingBytes),
    });

    totalBytes += result.byteLength;

    downloaded.push({
      manifestEntry,
      fileBody: result.fileBody,
    });
  }

  return downloaded;
}

async function recoverFailedExport(
  organizationId: string,
  machineId: string,
  exportId: string,
  config: DocumentStorageConfig | undefined,
  storage: CustomerHandoverStorageAdapter | undefined,
  uploadAttempted: boolean,
  dependencies: CustomerHandoverExportEndpointDependencies,
): Promise<void> {
  const operations: readonly {
    readonly operation: CustomerHandoverRecoveryFailure['operation'];
    readonly promise: Promise<unknown>;
  }[] = [
    {
      operation: 'mark-export-failed',
      promise: dependencies.failCustomerHandoverExport({
        db: dependencies.db,
        organizationId,
        machineId,
        exportId,
      }),
    },
    ...(uploadAttempted && config && storage
      ? [
          {
            operation: 'remove-export-artifact' as const,
            promise: dependencies.removeCustomerHandoverExport({
              config,
              storage,
              organizationId,
              machineId,
              exportId,
            }),
          },
        ]
      : []),
  ];

  const results = await Promise.allSettled(operations.map((operation) => operation.promise));

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      return;
    }

    dependencies.reportRecoveryFailure?.({
      operation: operations[index]?.operation ?? 'mark-export-failed',
      organizationId,
      machineId,
      exportId,
      reason: result.reason,
    });
  });
}

export async function createCustomerHandoverExportFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateCustomerHandoverExportFromRequestInput): Promise<CreateCustomerHandoverExportResponse> {
  const requestBody = body ?? {};

  const organizationId = requiredString('organizationId', requestBody.organizationId);

  const normalizedMachineId = requiredString('machineId', machineId);

  const selectedDocumentIds = documentIds(requestBody.documentIds);
  const locale = supportedLocale(requestBody.locale);

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: exportRoles,
  });

  let pendingExport;

  try {
    pendingExport = await dependencies.createPendingCustomerHandoverExport({
      db: dependencies.db,
      organizationId,
      machineId: normalizedMachineId,
      requestedByUserId: tenantContext.currentUser.appUserId,
      documentIds: selectedDocumentIds,
    });
  } catch {
    throw new BadRequestException(
      'Customer handover export could not be created from the selected documents.',
    );
  }

  let config: DocumentStorageConfig | undefined;
  let storage: CustomerHandoverStorageAdapter | undefined;
  let uploadAttempted = false;

  try {
    const initialRevalidation = await dependencies.revalidatePendingCustomerHandoverExport({
      db: dependencies.db,
      organizationId,
      machineId: normalizedMachineId,
      exportId: pendingExport.id,
    });

    const machine = await dependencies.getMachineByOrganization({
      db: dependencies.db,
      organizationId,
      machineId: normalizedMachineId,
    });

    if (!machine) {
      throw new Error('Machine was not found for this organization.');
    }

    const sensitiveCategories = Array.from(
      new Set(
        initialRevalidation.documents
          .map((doc) => doc.category)
          .filter((category) =>
            (sensitiveEngineeringDocumentCategories as readonly string[]).includes(category),
          ),
      ),
    );

    config = dependencies.readDocumentStorageConfig();

    storage = dependencies.createDocumentStorageAdapter(config);

    const downloadedDocuments = await downloadExportDocuments(
      initialRevalidation,
      config,
      storage,
      dependencies,
    );

    const archive: CustomerHandoverZipArchive = await dependencies.buildCustomerHandoverZipArchive({
      documents: downloadedDocuments,
      maximumTotalDocumentBytes: maximumCustomerHandoverTotalDocumentBytes,
      maximumArchiveBytes: maximumCustomerHandoverArchiveBytes,
    });

    uploadAttempted = true;

    await dependencies.uploadCustomerHandoverExport({
      config,
      storage,
      organizationId,
      machineId: normalizedMachineId,
      exportId: pendingExport.id,
      archiveBody: archive.archiveBody,
    });

    let pdfStoragePath: string | undefined;

    try {
      const completeness = evaluateCustomerHandoverCompleteness(
        initialRevalidation.documents.map(
          (document): CustomerHandoverDocument => ({
            category: document.category,
            suggestedCategory: null,
            visibilityLevel: document.visibilityLevel,
            visibleToCustomer: document.visibleToCustomer,
          }),
        ),
      );
      const pdfBody = await dependencies.buildCustomerHandoverPdfSummary({
        machineName: machine.machineName,
        serialNumber: machine.serialNumber,
        locale,
        completeness,
        documents: initialRevalidation.documents.map((document) => ({
          fileName: document.fileName,
          category: document.category,
          visibilityLevel: document.visibilityLevel,
        })),
        exportId: pendingExport.id,
        createdAt: new Date(),
        sensitiveCategories,
        labels: documentLabels[locale],
        copy: handoverCompletenessCopy[locale],
      });

      pdfStoragePath = await dependencies.uploadCustomerHandoverPdfSummary({
        config,
        storage,
        organizationId,
        machineId: normalizedMachineId,
        exportId: pendingExport.id,
        pdfBody,
      });
    } catch (error) {
      reportPdfSummaryFailure(organizationId, normalizedMachineId, pendingExport.id, error);
    }

    const artifactStoragePath = buildPrivateCustomerHandoverExportStoragePath({
      organizationId,
      machineId: normalizedMachineId,
      exportId: pendingExport.id,
    });

    const completed = await dependencies.finalizeCustomerHandoverExportSuccess({
      db: dependencies.db,
      organizationId,
      machineId: normalizedMachineId,
      exportId: pendingExport.id,
      actorUserId: tenantContext.currentUser.appUserId,
      artifactStoragePath,
      archiveChecksum: archive.archiveChecksum,
      archiveByteLength: archive.archiveByteLength,
      documentCount: archive.documentCount,
      totalDocumentBytes: archive.totalDocumentBytes,
      ...(pdfStoragePath ? { pdfStoragePath } : {}),
    });

    return {
      export: {
        id: completed.id,
        result: 'succeeded',
        checklistVersion: completed.checklistVersion,
        documentCount: archive.documentCount,
        totalDocumentBytes: archive.totalDocumentBytes,
        archiveByteLength: archive.archiveByteLength,
        createdAt: completed.createdAt,
        completedAt: completed.completedAt,
      },
      sensitiveCategories,
      ...(pdfStoragePath ? { pdfStoragePath } : {}),
    };
  } catch {
    await recoverFailedExport(
      organizationId,
      normalizedMachineId,
      pendingExport.id,
      config,
      storage,
      uploadAttempted,
      dependencies,
    );

    throw new InternalServerErrorException('Customer handover ZIP could not be created.');
  }
}

export async function createCustomerHandoverExportDownloadUrlFromRequest({
  authorizationHeader,
  machineId,
  exportId,
  body,
  dependencies,
}: CreateCustomerHandoverExportDownloadUrlFromRequestInput): Promise<CreateCustomerHandoverExportDownloadUrlResponse> {
  const requestBody = body ?? {};

  const organizationId = requiredString('organizationId', requestBody.organizationId);

  const normalizedMachineId = requiredString('machineId', machineId);

  const normalizedExportId = requiredString('exportId', exportId);

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: exportRoles,
  });

  const completed = await dependencies.getSucceededCustomerHandoverExportArtifact({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    exportId: normalizedExportId,
  });

  if (!completed) {
    throw new NotFoundException('Completed customer handover export was not found.');
  }

  let signedUrl: DocumentStorageSignedUrlResult;

  try {
    const config = dependencies.readDocumentStorageConfig();

    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrl = await dependencies.createCustomerHandoverExportSignedUrl({
      config,
      storage,
      organizationId,
      machineId: normalizedMachineId,
      exportId: normalizedExportId,
    });

    await dependencies.createActivityLog({
      db: dependencies.db,
      organizationId,
      action: activityLogActions.customerHandoverExportDownloadUrlIssued,
      actorUserId: tenantContext.currentUser.appUserId,
      targetType: 'data-export',
      targetId: normalizedExportId,
    });
  } catch {
    throw new InternalServerErrorException(
      'Customer handover ZIP download URL could not be created.',
    );
  }

  return {
    exportId: completed.id,
    downloadUrl: signedUrl.signedUrl,
    expiresInSeconds: signedUrl.expiresInSeconds,
  };
}

export async function createCustomerHandoverPdfSummaryDownloadUrlFromRequest({
  authorizationHeader,
  machineId,
  exportId,
  body,
  dependencies,
}: CreateCustomerHandoverPdfSummaryDownloadUrlFromRequestInput): Promise<CreateCustomerHandoverPdfSummaryDownloadUrlResponse> {
  const requestBody = body ?? {};

  const organizationId = requiredString('organizationId', requestBody.organizationId);

  const normalizedMachineId = requiredString('machineId', machineId);

  const normalizedExportId = requiredString('exportId', exportId);

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: exportRoles,
  });

  const completed = await dependencies.getSucceededCustomerHandoverExportArtifact({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    exportId: normalizedExportId,
  });

  if (!completed) {
    throw new NotFoundException('Completed customer handover export was not found.');
  }

  const pdfStoragePath = pdfStoragePathFromManifest(completed.manifest);

  if (!pdfStoragePath) {
    throw new NotFoundException('Customer handover PDF summary was not found.');
  }

  let signedUrl: DocumentStorageSignedUrlResult;

  try {
    const config = dependencies.readDocumentStorageConfig();

    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrl = await dependencies.createCustomerHandoverPdfSummarySignedUrl({
      config,
      storage,
      organizationId,
      machineId: normalizedMachineId,
      exportId: normalizedExportId,
      pdfStoragePath,
    });

    await dependencies.createActivityLog({
      db: dependencies.db,
      organizationId,
      action: activityLogActions.customerHandoverExportDownloadUrlIssued,
      actorUserId: tenantContext.currentUser.appUserId,
      targetType: 'data-export',
      targetId: normalizedExportId,
    });
  } catch {
    throw new InternalServerErrorException(
      'Customer handover PDF download URL could not be created.',
    );
  }

  return {
    exportId: completed.id,
    downloadUrl: signedUrl.signedUrl,
    expiresInSeconds: signedUrl.expiresInSeconds,
  };
}

export async function listCustomerHandoverExportsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListCustomerHandoverExportsFromRequestInput): Promise<ListCustomerHandoverExportsResponse> {
  const organizationId = requiredString('organizationId', query?.organizationId);

  const normalizedMachineId = requiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: exportRoles,
  });

  const machine = await dependencies.getMachineByOrganization({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  if (!machine) {
    throw new NotFoundException('Machine was not found for this organization.');
  }

  const exports = await dependencies.listSucceededCustomerHandoverExports({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return { exports };
}

@Controller('document-records')
export class CustomerHandoverExportController {
  @Post('machines/:machineId/customer-handover-exports')
  async createCustomerHandoverExport(
    @Headers('authorization')
    authorizationHeader: string | undefined,
    @Param('machineId')
    machineId: string | undefined,
    @Body()
    body: CreateCustomerHandoverExportRequestBody | undefined,
  ): Promise<CreateCustomerHandoverExportResponse> {
    return createCustomerHandoverExportFromRequest({
      authorizationHeader,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId/customer-handover-exports')
  async listCustomerHandoverExports(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: ListCustomerHandoverExportsQuery | undefined,
  ): Promise<ListCustomerHandoverExportsResponse> {
    return listCustomerHandoverExportsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/customer-handover-exports/:exportId/download-url')
  async createCustomerHandoverExportDownloadUrl(
    @Headers('authorization')
    authorizationHeader: string | undefined,
    @Param('machineId')
    machineId: string | undefined,
    @Param('exportId')
    exportId: string | undefined,
    @Body()
    body: CreateCustomerHandoverExportDownloadUrlRequestBody | undefined,
  ): Promise<CreateCustomerHandoverExportDownloadUrlResponse> {
    return createCustomerHandoverExportDownloadUrlFromRequest({
      authorizationHeader,
      machineId,
      exportId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/customer-handover-exports/:exportId/pdf-download-url')
  async createCustomerHandoverPdfSummaryDownloadUrl(
    @Headers('authorization')
    authorizationHeader: string | undefined,
    @Param('machineId')
    machineId: string | undefined,
    @Param('exportId')
    exportId: string | undefined,
    @Body()
    body: CreateCustomerHandoverExportDownloadUrlRequestBody | undefined,
  ): Promise<CreateCustomerHandoverPdfSummaryDownloadUrlResponse> {
    return createCustomerHandoverPdfSummaryDownloadUrlFromRequest({
      authorizationHeader,
      machineId,
      exportId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
