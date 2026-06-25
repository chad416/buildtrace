import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
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
};

export type ListSoftwareVersionsResponse = {
  readonly versions: readonly SoftwareVersionRecord[];
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

type MarkSoftwareVersionRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly versionId: string | undefined;
  readonly body: MarkSoftwareVersionBody | undefined;
  readonly dependencies: SoftwareVersionsEndpointDependencies;
};

export async function createSoftwareVersionFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateSoftwareVersionRequestInput): Promise<SoftwareVersionRecord> {
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

  return version;
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

  return { versions };
}

export async function getSoftwareVersionFromRequest({
  authorizationHeader,
  versionId,
  query,
  dependencies,
}: GetSoftwareVersionRequestInput): Promise<SoftwareVersionRecord> {
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

  return version;
}

export async function markSoftwareVersionAsCurrentFromRequest({
  authorizationHeader,
  versionId,
  body,
  dependencies,
}: MarkSoftwareVersionRequestInput): Promise<SoftwareVersionRecord> {
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

  return version;
}

export async function markSoftwareVersionAsDeliveredFromRequest({
  authorizationHeader,
  versionId,
  body,
  dependencies,
}: MarkSoftwareVersionRequestInput): Promise<SoftwareVersionRecord> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const machineId = readRequiredString('machineId', body?.machineId);
  const normalizedVersionId = readRequiredString('versionId', versionId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  return dependencies.markAsDeliveredVersion({
    db: dependencies.db,
    organizationId,
    machineId,
    versionId: normalizedVersionId,
  });
}

@Controller('software-versions')
export class SoftwareVersionsController {
  @Post('machines/:machineId')
  async createVersion(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreateSoftwareVersionBody | undefined,
  ): Promise<SoftwareVersionRecord> {
    return createSoftwareVersionFromRequest({
      authorizationHeader,
      machineId,
      body,
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
  ): Promise<SoftwareVersionRecord> {
    return getSoftwareVersionFromRequest({
      authorizationHeader,
      versionId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':versionId/mark-current')
  async markCurrent(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('versionId') versionId: string | undefined,
    @Body() body: MarkSoftwareVersionBody | undefined,
  ): Promise<SoftwareVersionRecord> {
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
  ): Promise<SoftwareVersionRecord> {
    return markSoftwareVersionAsDeliveredFromRequest({
      authorizationHeader,
      versionId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
