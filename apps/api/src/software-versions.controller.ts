import { createHash } from 'node:crypto';
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
import type { OrganizationRole, PrismaClient, SoftwareVersionRecord } from '@buildtrace/db';
import {
  createActivityLog,
  createPrismaClient,
  createSoftwareVersion,
  getSoftwareVersion,
  listSoftwareVersions,
  markAsCurrentKnownVersion,
  markAsDeliveredVersion,
} from '@buildtrace/db';
import { activityLogActions, softwareTypes, type SoftwareType } from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';
import {
  createSupabaseDocumentStorageAdapter,
  readDocumentStorageConfig,
  type DocumentStorageSignedUrlResult,
} from './document-storage.js';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document-upload-endpoint.js';
import {
  createSoftwareVersionFileSignedUrl,
  uploadSoftwareVersionFile,
} from './software-version-storage.js';

export type SoftwareVersionsQuery = {
  readonly organizationId?: unknown;
  readonly softwareType?: unknown;
};

export type CreateSoftwareVersionBody = {
  readonly organizationId?: unknown;
  readonly versionName?: unknown;
  readonly softwareType?: unknown;
  readonly notes?: unknown;
  readonly isDeliveredVersion?: unknown;
  readonly isCurrentKnownVersion?: unknown;
};

export type MarkSoftwareVersionBody = {
  readonly organizationId?: unknown;
  readonly machineId?: unknown;
};

export type CreateSoftwareVersionFileDownloadUrlBody = {
  readonly organizationId?: unknown;
};

type MultipartField = {
  readonly value?: unknown;
};

export type SoftwareVersionMultipartFile = {
  readonly filename?: unknown;
  readonly file?: AsyncIterable<Uint8Array>;
  readonly fields?: Record<string, unknown>;
};

export type SoftwareVersionUploadHttpRequest = {
  readonly body?: unknown;
  readonly file?: () => Promise<SoftwareVersionMultipartFile | undefined>;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

export type SoftwareVersionsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createSoftwareVersion: typeof createSoftwareVersion;
  readonly listSoftwareVersions: typeof listSoftwareVersions;
  readonly getSoftwareVersion: typeof getSoftwareVersion;
  readonly markAsCurrentKnownVersion: typeof markAsCurrentKnownVersion;
  readonly markAsDeliveredVersion: typeof markAsDeliveredVersion;
  readonly createActivityLog: typeof createActivityLog;
  readonly uploadSoftwareVersionFile: typeof uploadSoftwareVersionFile;
  readonly createSoftwareVersionFileSignedUrl: typeof createSoftwareVersionFileSignedUrl;
  readonly readDocumentStorageConfig: typeof readDocumentStorageConfig;
  readonly createDocumentStorageAdapter: typeof createSupabaseDocumentStorageAdapter;
};

export type SoftwareVersionResponse = Omit<SoftwareVersionRecord, 'storagePath'> & {
  readonly hasFile: boolean;
};

export type ListSoftwareVersionsResponse = {
  readonly versions: readonly SoftwareVersionResponse[];
};

export type SoftwareVersionFileDownloadUrlResponse = {
  readonly versionId: string;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

const memberRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
const adminRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

let db: PrismaClient | undefined;

function getDatabase(): PrismaClient {
  db ??= createPrismaClient();
  return db;
}

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

function readOptionalNullableString(name: string, value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string or null.`);
  }

  return value.trim() || null;
}

function readOptionalBoolean(name: string, value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${name} must be a boolean.`);
  }

  return value;
}

function isSoftwareType(value: string): value is SoftwareType {
  return (softwareTypes as readonly string[]).includes(value);
}

function readRequiredSoftwareType(value: unknown): SoftwareType {
  const softwareType = readRequiredString('softwareType', value);

  if (!isSoftwareType(softwareType)) {
    throw new BadRequestException(`softwareType must be one of: ${softwareTypes.join(', ')}`);
  }

  return softwareType;
}

function readOptionalSoftwareType(value: unknown): SoftwareType | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`softwareType must be one of: ${softwareTypes.join(', ')}`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (!isSoftwareType(normalizedValue)) {
    throw new BadRequestException(`softwareType must be one of: ${softwareTypes.join(', ')}`);
  }

  return normalizedValue;
}

function createRealDependencies(): SoftwareVersionsEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    createSoftwareVersion,
    listSoftwareVersions,
    getSoftwareVersion,
    markAsCurrentKnownVersion,
    markAsDeliveredVersion,
    createActivityLog,
    uploadSoftwareVersionFile,
    createSoftwareVersionFileSignedUrl,
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
  };
}

type CreateSoftwareVersionRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreateSoftwareVersionBody | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type ListSoftwareVersionsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: SoftwareVersionsQuery | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type GetSoftwareVersionRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly versionId: string | undefined;
  readonly query: SoftwareVersionsQuery | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type CreateSoftwareVersionUploadRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly request: SoftwareVersionUploadHttpRequest;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type CreateSoftwareVersionFileDownloadUrlRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly versionId: string | undefined;
  readonly body: CreateSoftwareVersionFileDownloadUrlBody | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type MarkSoftwareVersionRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly versionId: string | undefined;
  readonly body: MarkSoftwareVersionBody | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

type UploadedSoftwareVersionFileBody = {
  readonly fileBody: ArrayBuffer;
  readonly checksum: string;
};

function toSoftwareVersionResponse(version: SoftwareVersionRecord): SoftwareVersionResponse {
  const { storagePath, ...versionWithoutStoragePath } = version;

  return {
    ...versionWithoutStoragePath,
    hasFile: storagePath !== null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapMultipartField(value: unknown): unknown {
  if (Array.isArray(value)) {
    throw new BadRequestException('Repeated software version upload fields are not supported.');
  }

  if (isRecord(value) && 'value' in value) {
    return (value as MultipartField).value;
  }

  return value;
}

function readOptionalMultipartField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): unknown {
  const bodyValue = isRecord(body) ? unwrapMultipartField(body[name]) : undefined;
  const multipartValue = multipartFields ? unwrapMultipartField(multipartFields[name]) : undefined;

  return bodyValue ?? multipartValue;
}

function readRequiredMultipartTextField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): string {
  const value = readOptionalMultipartField(name, body, multipartFields);

  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${name} is required.`);
  }

  return value.trim();
}

function readOptionalMultipartNullableTextField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): string | null {
  const value = readOptionalMultipartField(name, body, multipartFields);

  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalMultipartBooleanField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): boolean | undefined {
  const value = readOptionalMultipartField(name, body, multipartFields);

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  throw new BadRequestException(`${name} must be true or false.`);
}

function readRequiredMultipartSoftwareType(
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): SoftwareType {
  const softwareType = readRequiredMultipartTextField('softwareType', body, multipartFields);

  if (!isSoftwareType(softwareType)) {
    throw new BadRequestException(`softwareType must be one of: ${softwareTypes.join(', ')}`);
  }

  return softwareType;
}

function normalizeSoftwareVersionFileName(fileName: unknown): string {
  if (typeof fileName !== 'string') {
    throw new BadRequestException('Uploaded software version file name is required.');
  }

  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new BadRequestException('Uploaded software version file name is required.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\')
  ) {
    throw new BadRequestException('Uploaded software version file name is not safe.');
  }

  return normalizedFileName;
}

async function readSoftwareVersionMultipartFile(
  request: SoftwareVersionUploadHttpRequest,
): Promise<SoftwareVersionMultipartFile> {
  if (typeof request.file !== 'function') {
    throw new BadRequestException('Uploaded software version file is required.');
  }

  const file = await request.file();

  if (!file) {
    throw new BadRequestException('Uploaded software version file is required.');
  }

  return file;
}

async function readSoftwareVersionFileBody(
  file: SoftwareVersionMultipartFile,
): Promise<UploadedSoftwareVersionFileBody> {
  if (!file.file) {
    throw new BadRequestException('Uploaded software version file stream is required.');
  }

  const hash = createHash('sha256');
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of file.file) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException(
        `Uploaded software version file must be ${MAX_DOCUMENT_UPLOAD_BYTES} bytes or smaller.`,
      );
    }

    hash.update(buffer);
    chunks.push(buffer);
  }

  if (totalBytes === 0) {
    throw new BadRequestException('Uploaded software version file must not be empty.');
  }

  const body = Buffer.concat(chunks, totalBytes);

  return {
    fileBody: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    checksum: hash.digest('hex'),
  };
}

export async function createSoftwareVersionFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateSoftwareVersionRequestInput): Promise<SoftwareVersionResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const versionName = readRequiredString('versionName', body?.versionName);
  const softwareType = readRequiredSoftwareType(body?.softwareType);
  const notes = readOptionalNullableString('notes', body?.notes);
  const isDeliveredVersion = readOptionalBoolean('isDeliveredVersion', body?.isDeliveredVersion);
  const isCurrentKnownVersion = readOptionalBoolean(
    'isCurrentKnownVersion',
    body?.isCurrentKnownVersion,
  );

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  // Slice 9D file uploads should default PLC/HMI version files to sensitive-engineering visibility.
  const version = await dependencies.createSoftwareVersion({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    versionName,
    softwareType,
    notes,
    ...(isDeliveredVersion !== undefined ? { isDeliveredVersion } : {}),
    ...(isCurrentKnownVersion !== undefined ? { isCurrentKnownVersion } : {}),
    uploadedByUserId: currentUser.appUserId,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.softwareVersionUploaded,
    actorUserId: currentUser.appUserId,
    targetType: 'software_version',
    targetId: version.id,
  });

  return toSoftwareVersionResponse(version);
}

export async function createSoftwareVersionUploadFromMultipartRequest({
  authorizationHeader,
  machineId,
  request,
  dependencies,
}: CreateSoftwareVersionUploadRequestInput): Promise<SoftwareVersionResponse> {
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const uploadedFile = await readSoftwareVersionMultipartFile(request);
  const multipartFields = uploadedFile.fields;
  const organizationId = readRequiredMultipartTextField(
    'organizationId',
    request.body,
    multipartFields,
  );
  const versionName = readRequiredMultipartTextField('versionName', request.body, multipartFields);
  const softwareType = readRequiredMultipartSoftwareType(request.body, multipartFields);
  const notes = readOptionalMultipartNullableTextField('notes', request.body, multipartFields);
  const isDeliveredVersion = readOptionalMultipartBooleanField(
    'isDeliveredVersion',
    request.body,
    multipartFields,
  );
  const isCurrentKnownVersion = readOptionalMultipartBooleanField(
    'isCurrentKnownVersion',
    request.body,
    multipartFields,
  );
  const fileName = normalizeSoftwareVersionFileName(uploadedFile.filename);
  const { fileBody, checksum } = await readSoftwareVersionFileBody(uploadedFile);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  // PLC/HMI version files are stored privately and never exposed through the QR portal.
  const pendingVersion = await dependencies.createSoftwareVersion({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    versionName,
    softwareType,
    notes,
    ...(isDeliveredVersion !== undefined ? { isDeliveredVersion } : {}),
    ...(isCurrentKnownVersion !== undefined ? { isCurrentKnownVersion } : {}),
    uploadedByUserId: currentUser.appUserId,
  });

  let updatedVersion: SoftwareVersionRecord;

  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);
    const uploadResult = await dependencies.uploadSoftwareVersionFile({
      config,
      storage,
      organizationId,
      machineId: normalizedMachineId,
      versionId: pendingVersion.id,
      fileName,
      fileBody,
    });

    updatedVersion = await dependencies.db.softwareVersion.update({
      where: {
        id: pendingVersion.id,
      },
      data: {
        storagePath: uploadResult.storagePath,
        checksum,
        updatedAt: new Date(),
      },
    });
  } catch {
    throw new InternalServerErrorException('Software version file could not be uploaded.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.softwareVersionUploaded,
    actorUserId: currentUser.appUserId,
    targetType: 'software_version',
    targetId: updatedVersion.id,
  });

  return toSoftwareVersionResponse(updatedVersion);
}

export async function listSoftwareVersionsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListSoftwareVersionsRequestInput): Promise<ListSoftwareVersionsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const softwareType = readOptionalSoftwareType(query?.softwareType);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const versions = await dependencies.listSoftwareVersions({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    ...(softwareType !== undefined ? { softwareType } : {}),
  });

  return { versions: versions.map(toSoftwareVersionResponse) };
}

export async function getSoftwareVersionFromRequest({
  authorizationHeader,
  versionId,
  query,
  dependencies,
}: GetSoftwareVersionRequestInput): Promise<SoftwareVersionResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedVersionId = readRequiredString('versionId', versionId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const version = await dependencies.getSoftwareVersion({
    db: dependencies.db,
    organizationId,
    versionId: normalizedVersionId,
  });

  if (!version) {
    throw new NotFoundException('Software version was not found.');
  }

  return toSoftwareVersionResponse(version);
}

export async function createSoftwareVersionFileDownloadUrlFromRequest({
  authorizationHeader,
  versionId,
  body,
  dependencies,
}: CreateSoftwareVersionFileDownloadUrlRequestInput): Promise<SoftwareVersionFileDownloadUrlResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedVersionId = readRequiredString('versionId', versionId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const version = await dependencies.getSoftwareVersion({
    db: dependencies.db,
    organizationId,
    versionId: normalizedVersionId,
  });

  if (!version) {
    throw new NotFoundException('Software version was not found.');
  }

  if (!version.storagePath) {
    throw new NotFoundException('No file attached to this version.');
  }

  let signedUrlResult: DocumentStorageSignedUrlResult;

  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrlResult = await dependencies.createSoftwareVersionFileSignedUrl({
      config,
      storage,
      organizationId,
      machineId: version.machineId,
      storagePath: version.storagePath,
    });
  } catch {
    throw new InternalServerErrorException(
      'Software version file download URL could not be created.',
    );
  }

  return {
    versionId: normalizedVersionId,
    downloadUrl: signedUrlResult.signedUrl,
    expiresInSeconds: signedUrlResult.expiresInSeconds,
  };
}

export async function markSoftwareVersionAsCurrentFromRequest({
  authorizationHeader,
  versionId,
  body,
  dependencies,
}: MarkSoftwareVersionRequestInput): Promise<SoftwareVersionResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const machineId = readRequiredString('machineId', body?.machineId);
  const normalizedVersionId = readRequiredString('versionId', versionId);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  const version = await dependencies.markAsCurrentKnownVersion({
    db: dependencies.db,
    organizationId,
    machineId,
    versionId: normalizedVersionId,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.softwareVersionCurrentChanged,
    actorUserId: currentUser.appUserId,
    targetType: 'software_version',
    targetId: version.id,
  });

  return toSoftwareVersionResponse(version);
}

export async function markSoftwareVersionAsDeliveredFromRequest({
  authorizationHeader,
  versionId,
  body,
  dependencies,
}: MarkSoftwareVersionRequestInput): Promise<SoftwareVersionResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const machineId = readRequiredString('machineId', body?.machineId);
  const normalizedVersionId = readRequiredString('versionId', versionId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  const version = await dependencies.markAsDeliveredVersion({
    db: dependencies.db,
    organizationId,
    machineId,
    versionId: normalizedVersionId,
  });

  return toSoftwareVersionResponse(version);
}

@Controller('software-versions')
export class SoftwareVersionsController {
  @Post('machines/:machineId')
  async createVersion(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreateSoftwareVersionBody | undefined,
  ): Promise<SoftwareVersionResponse> {
    return createSoftwareVersionFromRequest({
      authorizationHeader,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/upload')
  async uploadVersionFile(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Req() request: SoftwareVersionUploadHttpRequest,
  ): Promise<SoftwareVersionResponse> {
    return createSoftwareVersionUploadFromMultipartRequest({
      authorizationHeader,
      machineId,
      request,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId')
  async listVersions(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: SoftwareVersionsQuery | undefined,
  ): Promise<ListSoftwareVersionsResponse> {
    return listSoftwareVersionsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get(':versionId')
  async getVersion(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('versionId') versionId: string | undefined,
    @Query() query: SoftwareVersionsQuery | undefined,
  ): Promise<SoftwareVersionResponse> {
    return getSoftwareVersionFromRequest({
      authorizationHeader,
      versionId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post(':versionId/file-download-url')
  async createFileDownloadUrl(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('versionId') versionId: string | undefined,
    @Body() body: CreateSoftwareVersionFileDownloadUrlBody | undefined,
  ): Promise<SoftwareVersionFileDownloadUrlResponse> {
    return createSoftwareVersionFileDownloadUrlFromRequest({
      authorizationHeader,
      versionId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':versionId/mark-current')
  async markCurrent(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('versionId') versionId: string | undefined,
    @Body() body: MarkSoftwareVersionBody | undefined,
  ): Promise<SoftwareVersionResponse> {
    return markSoftwareVersionAsCurrentFromRequest({
      authorizationHeader,
      versionId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':versionId/mark-delivered')
  async markDelivered(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('versionId') versionId: string | undefined,
    @Body() body: MarkSoftwareVersionBody | undefined,
  ): Promise<SoftwareVersionResponse> {
    return markSoftwareVersionAsDeliveredFromRequest({
      authorizationHeader,
      versionId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
