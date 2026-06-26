import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { OrganizationRole, PrismaClient, SparePartRecord } from '@buildtrace/db';
import {
  createActivityLog,
  createPrismaClient,
  createSparePart,
  listSpareParts,
  updateSparePart,
} from '@buildtrace/db';
import { Prisma } from '@buildtrace/db/src/generated/prisma/client';
import {
  activityLogActions,
  sparePartCriticalities,
  type SparePartCriticality,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

export type SparePartsQuery = {
  readonly organizationId?: unknown;
};

export type CreateSparePartBody = {
  readonly organizationId?: unknown;
  readonly partName?: unknown;
  readonly manufacturer?: unknown;
  readonly partNumber?: unknown;
  readonly quantity?: unknown;
  readonly category?: unknown;
  readonly criticality?: unknown;
  readonly estimatedPrice?: unknown;
  readonly currency?: unknown;
  readonly internalCost?: unknown;
  readonly customerVisiblePrice?: unknown;
  readonly sourceDocumentId?: unknown;
  readonly notes?: unknown;
};

export type UpdateSparePartBody = {
  readonly organizationId?: unknown;
  readonly partName?: unknown;
  readonly manufacturer?: unknown;
  readonly partNumber?: unknown;
  readonly quantity?: unknown;
  readonly category?: unknown;
  readonly criticality?: unknown;
  readonly estimatedPrice?: unknown;
  readonly currency?: unknown;
  readonly internalCost?: unknown;
  readonly customerVisiblePrice?: unknown;
  readonly notes?: unknown;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

export type SparePartsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createSparePart: typeof createSparePart;
  readonly listSpareParts: typeof listSpareParts;
  readonly updateSparePart: typeof updateSparePart;
  readonly createActivityLog: typeof createActivityLog;
};

export type SparePartPublicRecord = Omit<
  SparePartRecord,
  'internalCost' | 'estimatedPrice' | 'customerVisiblePrice'
> & {
  readonly estimatedPrice: string | null;
  readonly customerVisiblePrice: string | null;
};

export type SparePartApiResponse = SparePartPublicRecord;

export type ListSparePartsResponse = {
  readonly spareParts: readonly SparePartApiResponse[];
};

type CreateSparePartRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreateSparePartBody | undefined;
  readonly dependencies: SparePartsEndpointDependencies;
};

type ListSparePartsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: SparePartsQuery | undefined;
  readonly dependencies: SparePartsEndpointDependencies;
};

type UpdateSparePartRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly sparePartId: string | undefined;
  readonly body: UpdateSparePartBody | undefined;
  readonly dependencies: SparePartsEndpointDependencies;
};

type SparePartDecimal = NonNullable<SparePartRecord['estimatedPrice']>;

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

function readOptionalString(name: string, value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string.`);
  }

  return value.trim() || undefined;
}

function readOptionalNullableString(name: string, value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string or null.`);
  }

  return value.trim() || null;
}

function readOptionalQuantity(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const quantity =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new BadRequestException('quantity must be a positive integer.');
  }

  return quantity;
}

function readOptionalDecimal(name: string, value: unknown): SparePartDecimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException(`${name} must be a decimal string, number, or null.`);
  }

  const decimalValue = typeof value === 'string' ? value.trim() : value;

  if (decimalValue === '') {
    return null;
  }

  try {
    return new Prisma.Decimal(decimalValue);
  } catch {
    throw new BadRequestException(`${name} must be a valid decimal value.`);
  }
}

function isSparePartCriticality(value: string): value is SparePartCriticality {
  return (sparePartCriticalities as readonly string[]).includes(value);
}

function readOptionalCriticality(value: unknown): SparePartCriticality | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(
      `criticality must be one of: ${sparePartCriticalities.join(', ')}`,
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (!isSparePartCriticality(normalizedValue)) {
    throw new BadRequestException(
      `criticality must be one of: ${sparePartCriticalities.join(', ')}`,
    );
  }

  return normalizedValue;
}

function createRealDependencies(): SparePartsEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    createSparePart,
    listSpareParts,
    updateSparePart,
    createActivityLog,
  };
}

function serializeDecimal(value: SparePartRecord['estimatedPrice']): string | null {
  return value === null ? null : value.toString();
}

function toSparePartApiResponse(record: SparePartRecord): SparePartApiResponse {
  return {
    id: record.id,
    organizationId: record.organizationId,
    machineId: record.machineId,
    partName: record.partName,
    manufacturer: record.manufacturer,
    partNumber: record.partNumber,
    quantity: record.quantity,
    category: record.category,
    criticality: record.criticality,
    estimatedPrice: serializeDecimal(record.estimatedPrice),
    currency: record.currency,
    customerVisiblePrice: serializeDecimal(record.customerVisiblePrice),
    sourceDocumentId: record.sourceDocumentId,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createSparePartFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateSparePartRequestInput): Promise<SparePartApiResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const partName = readRequiredString('partName', body?.partName);
  const manufacturer = readOptionalNullableString('manufacturer', body?.manufacturer);
  const partNumber = readOptionalNullableString('partNumber', body?.partNumber);
  const quantity = readOptionalQuantity(body?.quantity);
  const category = readOptionalString('category', body?.category);
  const criticality = readOptionalCriticality(body?.criticality);
  const estimatedPrice = readOptionalDecimal('estimatedPrice', body?.estimatedPrice);
  const currency = readOptionalString('currency', body?.currency);
  const internalCost = readOptionalDecimal('internalCost', body?.internalCost);
  const customerVisiblePrice = readOptionalDecimal(
    'customerVisiblePrice',
    body?.customerVisiblePrice,
  );
  const sourceDocumentId = readOptionalNullableString('sourceDocumentId', body?.sourceDocumentId);
  const notes = readOptionalNullableString('notes', body?.notes);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const sparePart = await dependencies.createSparePart({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    partName,
    ...(manufacturer !== undefined ? { manufacturer } : {}),
    ...(partNumber !== undefined ? { partNumber } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(criticality !== undefined ? { criticality } : {}),
    ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(internalCost !== undefined ? { internalCost } : {}),
    ...(customerVisiblePrice !== undefined ? { customerVisiblePrice } : {}),
    ...(sourceDocumentId !== undefined ? { sourceDocumentId } : {}),
    ...(notes !== undefined ? { notes } : {}),
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.sparePartCreated,
    actorUserId: currentUser.appUserId,
    targetType: 'spare_part',
    targetId: sparePart.id,
  });

  return toSparePartApiResponse(sparePart);
}

export async function listSparePartsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListSparePartsRequestInput): Promise<ListSparePartsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const spareParts = await dependencies.listSpareParts({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return { spareParts: spareParts.map(toSparePartApiResponse) };
}

export async function updateSparePartFromRequest({
  authorizationHeader,
  sparePartId,
  body,
  dependencies,
}: UpdateSparePartRequestInput): Promise<SparePartApiResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedSparePartId = readRequiredString('sparePartId', sparePartId);
  const partName = readOptionalString('partName', body?.partName);
  const manufacturer = readOptionalNullableString('manufacturer', body?.manufacturer);
  const partNumber = readOptionalNullableString('partNumber', body?.partNumber);
  const quantity = readOptionalQuantity(body?.quantity);
  const category = readOptionalString('category', body?.category);
  const criticality = readOptionalCriticality(body?.criticality);
  const estimatedPrice = readOptionalDecimal('estimatedPrice', body?.estimatedPrice);
  const currency = readOptionalString('currency', body?.currency);
  const internalCost = readOptionalDecimal('internalCost', body?.internalCost);
  const customerVisiblePrice = readOptionalDecimal(
    'customerVisiblePrice',
    body?.customerVisiblePrice,
  );
  const notes = readOptionalNullableString('notes', body?.notes);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  const sparePart = await dependencies.updateSparePart({
    db: dependencies.db,
    organizationId,
    sparePartId: normalizedSparePartId,
    ...(partName !== undefined ? { partName } : {}),
    ...(manufacturer !== undefined ? { manufacturer } : {}),
    ...(partNumber !== undefined ? { partNumber } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(criticality !== undefined ? { criticality } : {}),
    ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(internalCost !== undefined ? { internalCost } : {}),
    ...(customerVisiblePrice !== undefined ? { customerVisiblePrice } : {}),
    ...(notes !== undefined ? { notes } : {}),
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.sparePartUpdated,
    actorUserId: currentUser.appUserId,
    targetType: 'spare_part',
    targetId: sparePart.id,
  });

  return toSparePartApiResponse(sparePart);
}

@Controller('spare-parts')
export class SparePartsController {
  @Post('machines/:machineId')
  async createPart(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreateSparePartBody | undefined,
  ): Promise<SparePartApiResponse> {
    return createSparePartFromRequest({
      authorizationHeader,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId')
  async listParts(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: SparePartsQuery | undefined,
  ): Promise<ListSparePartsResponse> {
    return listSparePartsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':sparePartId')
  async updatePart(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('sparePartId') sparePartId: string | undefined,
    @Body() body: UpdateSparePartBody | undefined,
  ): Promise<SparePartApiResponse> {
    return updateSparePartFromRequest({
      authorizationHeader,
      sparePartId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
