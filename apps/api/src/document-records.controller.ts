import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { DocumentRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  applyDocumentClassificationSuggestion,
  createActivityLog,
  createPrismaClient,
  getDocumentByMachine,
  listDocumentsByMachine,
  markDocumentDownloadUrlIssued,
  updateDocumentCategory,
  updateDocumentVisibility,
} from '@buildtrace/db';
import {
  activityLogActions,
  documentCategories,
  documentVisibilityLevels,
  type DocumentCategory,
  type DocumentClassificationSource,
  type DocumentClassificationStatus,
  type DocumentLanguageCode,
  type DocumentVisibilityLevel,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

import {
  createSignedDocumentDownloadUrl,
  createSupabaseDocumentStorageAdapter,
  readDocumentStorageConfig,
  type DocumentStorageAdapter,
  type DocumentStorageConfig,
  type DocumentStorageSignedUrlResult,
} from './document-storage.js';
import {
  createDocumentUploadFromMultipartRequest,
  type CreateDocumentUploadResponse,
  type DocumentUploadHttpRequest,
} from './document-upload-endpoint.js';

export type DocumentRecordsQuery = {
  readonly organizationId?: unknown;
};

export type UpdateDocumentCategoryRequestBody = {
  readonly organizationId?: unknown;
  readonly category?: unknown;
};

export type UpdateDocumentVisibilityRequestBody = {
  readonly organizationId?: unknown;
  readonly visibilityLevel?: unknown;
};

export type CreateDocumentDownloadUrlRequestBody = {
  readonly organizationId?: unknown;
};

export type ApplyDocumentClassificationSuggestionRequestBody = {
  readonly organizationId?: unknown;
};

export type DocumentMetadataResponse = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly category: DocumentCategory;
  readonly suggestedCategory: DocumentCategory | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: DocumentClassificationStatus;
  readonly classificationSource: DocumentClassificationSource | null;
  readonly visibilityLevel: DocumentVisibilityLevel;
  readonly visibleToCustomer: boolean;
  readonly language: DocumentLanguageCode;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: Date;
  readonly lastDownloadUrlIssuedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ListDocumentsResponse = {
  readonly documents: readonly DocumentMetadataResponse[];
};

export type GetDocumentResponse = {
  readonly document: DocumentMetadataResponse;
};

export type UpdateDocumentCategoryResponse = {
  readonly document: DocumentMetadataResponse;
};

export type UpdateDocumentVisibilityResponse = {
  readonly document: DocumentMetadataResponse;
};

export type ApplyDocumentClassificationSuggestionResponse = {
  readonly document: DocumentMetadataResponse;
};

export type DocumentDownloadUrlResponse = {
  readonly document: DocumentMetadataResponse;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

type ListDocumentsByMachineDependency = (
  input: Parameters<typeof listDocumentsByMachine>[0],
) => Promise<readonly DocumentRecord[]>;

type GetDocumentByMachineDependency = (
  input: Parameters<typeof getDocumentByMachine>[0],
) => Promise<DocumentRecord | null>;

type UpdateDocumentCategoryDependency = (
  input: Parameters<typeof updateDocumentCategory>[0],
) => Promise<DocumentRecord | null>;

type UpdateDocumentVisibilityDependency = (
  input: Parameters<typeof updateDocumentVisibility>[0],
) => Promise<DocumentRecord | null>;

type ApplyDocumentClassificationSuggestionDependency = (
  input: Parameters<typeof applyDocumentClassificationSuggestion>[0],
) => Promise<DocumentRecord | null>;

type MarkDocumentDownloadUrlIssuedDependency = (
  input: Parameters<typeof markDocumentDownloadUrlIssued>[0],
) => Promise<DocumentRecord | null>;

type CreateActivityLogDependency = (
  input: Parameters<typeof createActivityLog>[0],
) => ReturnType<typeof createActivityLog>;

type ReadDocumentStorageConfigDependency = () => DocumentStorageConfig;

type CreateDocumentStorageAdapterDependency = (
  config: DocumentStorageConfig,
) => DocumentStorageAdapter;

type CreateSignedDocumentDownloadUrlDependency = (
  input: Parameters<typeof createSignedDocumentDownloadUrl>[0],
) => Promise<DocumentStorageSignedUrlResult>;

export type DocumentRecordsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly listDocumentsByMachine: ListDocumentsByMachineDependency;
  readonly getDocumentByMachine: GetDocumentByMachineDependency;
  readonly updateDocumentCategory: UpdateDocumentCategoryDependency;
  readonly updateDocumentVisibility: UpdateDocumentVisibilityDependency;
  readonly applyDocumentClassificationSuggestion: ApplyDocumentClassificationSuggestionDependency;
  readonly markDocumentDownloadUrlIssued: MarkDocumentDownloadUrlIssuedDependency;
  readonly createActivityLog: CreateActivityLogDependency;
  readonly readDocumentStorageConfig: ReadDocumentStorageConfigDependency;
  readonly createDocumentStorageAdapter: CreateDocumentStorageAdapterDependency;
  readonly createSignedDocumentDownloadUrl: CreateSignedDocumentDownloadUrlDependency;
};

type ListDocumentsFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: DocumentRecordsQuery | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

type GetDocumentFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly documentId: string | undefined;
  readonly query: DocumentRecordsQuery | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

type UpdateDocumentCategoryFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly documentId: string | undefined;
  readonly body: UpdateDocumentCategoryRequestBody | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

type UpdateDocumentVisibilityFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly documentId: string | undefined;
  readonly body: UpdateDocumentVisibilityRequestBody | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

type CreateDocumentDownloadUrlFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly documentId: string | undefined;
  readonly body: CreateDocumentDownloadUrlRequestBody | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

type ApplyDocumentClassificationSuggestionFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly documentId: string | undefined;
  readonly body: ApplyDocumentClassificationSuggestionRequestBody | undefined;
  readonly dependencies: DocumentRecordsEndpointDependencies;
};

const documentReadRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
const documentUpdateRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

const db = createPrismaClient();

function readRequiredString(name: string, value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${name} is required.`);
  }

  return normalizedValue;
}

function readDocumentCategory(name: string, value: unknown): DocumentCategory {
  const normalizedValue = readRequiredString(name, value);

  if (!documentCategories.includes(normalizedValue as DocumentCategory)) {
    throw new BadRequestException(`${name} must be one of: ${documentCategories.join(', ')}.`);
  }

  return normalizedValue as DocumentCategory;
}

function readDocumentVisibilityLevel(name: string, value: unknown): DocumentVisibilityLevel {
  const normalizedValue = readRequiredString(name, value);

  if (!documentVisibilityLevels.includes(normalizedValue as DocumentVisibilityLevel)) {
    throw new BadRequestException(
      `${name} must be one of: ${documentVisibilityLevels.join(', ')}.`,
    );
  }

  return normalizedValue as DocumentVisibilityLevel;
}

function toDocumentMetadataResponse(document: DocumentRecord): DocumentMetadataResponse {
  return {
    id: document.id,
    organizationId: document.organizationId,
    machineId: document.machineId,
    fileName: document.fileName,
    fileType: document.fileType,
    category: document.category,
    suggestedCategory: document.suggestedCategory,
    classificationConfidence: document.classificationConfidence,
    classificationStatus: document.classificationStatus,
    classificationSource: document.classificationSource,
    visibilityLevel: document.visibilityLevel,
    visibleToCustomer: document.visibleToCustomer,
    language: document.language,
    uploadedByUserId: document.uploadedByUserId,
    uploadedAt: document.uploadedAt,
    lastDownloadUrlIssuedAt: document.lastDownloadUrlIssuedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function createRealDependencies(): DocumentRecordsEndpointDependencies {
  return {
    db,
    resolveAuthenticatedTenantContext,
    listDocumentsByMachine,
    getDocumentByMachine,
    updateDocumentCategory,
    updateDocumentVisibility,
    applyDocumentClassificationSuggestion,
    markDocumentDownloadUrlIssued,
    createActivityLog,
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
    createSignedDocumentDownloadUrl,
  };
}

export async function listDocumentsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListDocumentsFromRequestInput): Promise<ListDocumentsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentReadRoles,
  });

  const documents = await dependencies.listDocumentsByMachine({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return {
    documents: documents.map(toDocumentMetadataResponse),
  };
}

export async function getDocumentFromRequest({
  authorizationHeader,
  machineId,
  documentId,
  query,
  dependencies,
}: GetDocumentFromRequestInput): Promise<GetDocumentResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const normalizedDocumentId = readRequiredString('documentId', documentId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentReadRoles,
  });

  const document = await dependencies.getDocumentByMachine({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
  });

  if (!document) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  return {
    document: toDocumentMetadataResponse(document),
  };
}

export async function updateDocumentCategoryFromRequest({
  authorizationHeader,
  machineId,
  documentId,
  body,
  dependencies,
}: UpdateDocumentCategoryFromRequestInput): Promise<UpdateDocumentCategoryResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const normalizedDocumentId = readRequiredString('documentId', documentId);
  const category = readDocumentCategory('category', requestBody.category);

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentUpdateRoles,
  });

  const document = await dependencies.updateDocumentCategory({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
    category,
  });

  if (!document) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.documentCategoryChanged,
    actorUserId: tenantContext.currentUser.appUserId,
    targetType: 'document',
    targetId: normalizedDocumentId,
  });

  return {
    document: toDocumentMetadataResponse(document),
  };
}

export async function updateDocumentVisibilityFromRequest({
  authorizationHeader,
  machineId,
  documentId,
  body,
  dependencies,
}: UpdateDocumentVisibilityFromRequestInput): Promise<UpdateDocumentVisibilityResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const normalizedDocumentId = readRequiredString('documentId', documentId);
  const visibilityLevel = readDocumentVisibilityLevel(
    'visibilityLevel',
    requestBody.visibilityLevel,
  );

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentUpdateRoles,
  });

  const document = await dependencies.updateDocumentVisibility({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
    visibilityLevel,
  });

  if (!document) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.documentVisibilityChanged,
    actorUserId: tenantContext.currentUser.appUserId,
    targetType: 'document',
    targetId: normalizedDocumentId,
  });

  return {
    document: toDocumentMetadataResponse(document),
  };
}

export async function applyDocumentClassificationSuggestionFromRequest({
  authorizationHeader,
  machineId,
  documentId,
  body,
  dependencies,
}: ApplyDocumentClassificationSuggestionFromRequestInput): Promise<ApplyDocumentClassificationSuggestionResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const normalizedDocumentId = readRequiredString('documentId', documentId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentUpdateRoles,
  });

  const document = await dependencies.applyDocumentClassificationSuggestion({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
  });

  if (!document) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  return {
    document: toDocumentMetadataResponse(document),
  };
}

export async function createDocumentDownloadUrlFromRequest({
  authorizationHeader,
  machineId,
  documentId,
  body,
  dependencies,
}: CreateDocumentDownloadUrlFromRequestInput): Promise<DocumentDownloadUrlResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const normalizedDocumentId = readRequiredString('documentId', documentId);

  const tenantContext = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: documentReadRoles,
  });

  const document = await dependencies.getDocumentByMachine({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
  });

  if (!document) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  let signedUrlResult: DocumentStorageSignedUrlResult;

  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrlResult = await dependencies.createSignedDocumentDownloadUrl({
      config,
      storage,
      organizationId,
      machineId: normalizedMachineId,
      storagePath: document.storagePath,
    });
  } catch {
    throw new InternalServerErrorException('Document download URL could not be created.');
  }

  const issuedDocument = await dependencies.markDocumentDownloadUrlIssued({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    documentId: normalizedDocumentId,
  });

  if (!issuedDocument) {
    throw new NotFoundException('Document was not found for this machine.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.documentDownloadUrlIssued,
    actorUserId: tenantContext.currentUser.appUserId,
    targetType: 'document',
    targetId: normalizedDocumentId,
  });

  return {
    document: toDocumentMetadataResponse(issuedDocument),
    downloadUrl: signedUrlResult.signedUrl,
    expiresInSeconds: signedUrlResult.expiresInSeconds,
  };
}
@Controller('document-records')
export class DocumentRecordsController {
  @Get('machines/:machineId/documents')
  async listDocuments(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: DocumentRecordsQuery | undefined,
  ): Promise<ListDocumentsResponse> {
    return listDocumentsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId/documents/:documentId')
  async getDocument(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Param('documentId') documentId: string | undefined,
    @Query() query: DocumentRecordsQuery | undefined,
  ): Promise<GetDocumentResponse> {
    return getDocumentFromRequest({
      authorizationHeader,
      machineId,
      documentId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/documents/upload')
  async uploadDocument(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Req() request: DocumentUploadHttpRequest,
  ): Promise<CreateDocumentUploadResponse> {
    return createDocumentUploadFromMultipartRequest({
      authorizationHeader,
      machineId,
      request,
      dependencies: {
        db,
      },
    });
  }

  @Post('machines/:machineId/documents/:documentId/classification-suggestion')
  async applyDocumentClassificationSuggestion(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Param('documentId') documentId: string | undefined,
    @Body() body: ApplyDocumentClassificationSuggestionRequestBody | undefined,
  ): Promise<ApplyDocumentClassificationSuggestionResponse> {
    return applyDocumentClassificationSuggestionFromRequest({
      authorizationHeader,
      machineId,
      documentId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/documents/:documentId/download-url')
  async createDocumentDownloadUrl(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Param('documentId') documentId: string | undefined,
    @Body() body: CreateDocumentDownloadUrlRequestBody | undefined,
  ): Promise<DocumentDownloadUrlResponse> {
    return createDocumentDownloadUrlFromRequest({
      authorizationHeader,
      machineId,
      documentId,
      body,
      dependencies: createRealDependencies(),
    });
  }
  @Patch('machines/:machineId/documents/:documentId/category')
  async updateDocumentCategory(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Param('documentId') documentId: string | undefined,
    @Body() body: UpdateDocumentCategoryRequestBody | undefined,
  ): Promise<UpdateDocumentCategoryResponse> {
    return updateDocumentCategoryFromRequest({
      authorizationHeader,
      machineId,
      documentId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Patch('machines/:machineId/documents/:documentId/visibility')
  async updateDocumentVisibility(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Param('documentId') documentId: string | undefined,
    @Body() body: UpdateDocumentVisibilityRequestBody | undefined,
  ): Promise<UpdateDocumentVisibilityResponse> {
    return updateDocumentVisibilityFromRequest({
      authorizationHeader,
      machineId,
      documentId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
