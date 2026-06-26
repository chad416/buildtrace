import { randomBytes } from 'node:crypto';

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
import type { OrganizationRole, PrismaClient, QuoteRequestRecord } from '@buildtrace/db';
import {
  createActivityLog,
  createPrismaClient,
  createQuoteRequest,
  getQrPortalMachine,
  listQuoteRequests,
  updateQuoteRequestStatus,
} from '@buildtrace/db';
import { Prisma } from '@buildtrace/db/src/generated/prisma/client';
import {
  activityLogActions,
  quoteRequestStatuses,
  quoteRequestTypes,
  type QuoteRequestStatus,
  type QuoteRequestType,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

export type QuoteRequestsQuery = {
  readonly organizationId?: unknown;
};

export type CreateQuoteRequestBody = {
  readonly organizationId?: unknown;
  readonly title?: unknown;
  readonly type?: unknown;
  readonly description?: unknown;
  readonly sparePartId?: unknown;
  readonly ticketId?: unknown;
  readonly currency?: unknown;
};

export type CreatePortalQuoteRequestBody = {
  readonly title?: unknown;
  readonly type?: unknown;
  readonly description?: unknown;
  readonly sparePartId?: unknown;
  readonly currency?: unknown;
};

export type UpdateQuoteRequestStatusBody = {
  readonly organizationId?: unknown;
  readonly status?: unknown;
  readonly quotedPrice?: unknown;
  readonly currency?: unknown;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

export type QuoteRequestsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createQuoteRequest: typeof createQuoteRequest;
  readonly listQuoteRequests: typeof listQuoteRequests;
  readonly updateQuoteRequestStatus: typeof updateQuoteRequestStatus;
  readonly getQrPortalMachine: typeof getQrPortalMachine;
  readonly createActivityLog: typeof createActivityLog;
};

export type QuoteRequestApiResponse = Omit<
  QuoteRequestRecord,
  'quotedPrice' | 'customerAccessToken'
> & {
  readonly quotedPrice: string | null;
};

export type ListQuoteRequestsResponse = {
  readonly quoteRequests: readonly QuoteRequestApiResponse[];
};

export type CreatePortalQuoteRequestResponse = {
  readonly quoteRequestId: string;
  readonly customerAccessToken: string;
};

type CreateQuoteRequestRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreateQuoteRequestBody | undefined;
  readonly dependencies: QuoteRequestsEndpointDependencies;
};

type ListQuoteRequestsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId?: string | undefined;
  readonly query: QuoteRequestsQuery | undefined;
  readonly dependencies: QuoteRequestsEndpointDependencies;
};

type UpdateQuoteRequestStatusRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly quoteRequestId: string | undefined;
  readonly body: UpdateQuoteRequestStatusBody | undefined;
  readonly dependencies: QuoteRequestsEndpointDependencies;
};

type CreatePortalQuoteRequestRequestInput = {
  readonly qrToken: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreatePortalQuoteRequestBody | undefined;
  readonly dependencies: QuoteRequestsEndpointDependencies;
};

type QuoteRequestDecimal = NonNullable<QuoteRequestRecord['quotedPrice']>;

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

function readOptionalDecimal(name: string, value: unknown): QuoteRequestDecimal | null | undefined {
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

function isQuoteRequestType(value: string): value is QuoteRequestType {
  return (quoteRequestTypes as readonly string[]).includes(value);
}

function readOptionalQuoteRequestType(value: unknown): QuoteRequestType | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`type must be one of: ${quoteRequestTypes.join(', ')}`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (!isQuoteRequestType(normalizedValue)) {
    throw new BadRequestException(`type must be one of: ${quoteRequestTypes.join(', ')}`);
  }

  return normalizedValue;
}

function isQuoteRequestStatus(value: string): value is QuoteRequestStatus {
  return (quoteRequestStatuses as readonly string[]).includes(value);
}

function readRequiredQuoteRequestStatus(value: unknown): QuoteRequestStatus {
  const status = readRequiredString('status', value);

  if (!isQuoteRequestStatus(status)) {
    throw new BadRequestException(`status must be one of: ${quoteRequestStatuses.join(', ')}`);
  }

  return status;
}

function createRealDependencies(): QuoteRequestsEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    createQuoteRequest,
    listQuoteRequests,
    updateQuoteRequestStatus,
    getQrPortalMachine,
    createActivityLog,
  };
}

function serializeDecimal(value: QuoteRequestRecord['quotedPrice']): string | null {
  return value === null ? null : value.toString();
}

function toQuoteRequestApiResponse(record: QuoteRequestRecord): QuoteRequestApiResponse {
  return {
    id: record.id,
    organizationId: record.organizationId,
    machineId: record.machineId,
    sparePartId: record.sparePartId,
    ticketId: record.ticketId,
    type: record.type,
    title: record.title,
    description: record.description,
    quotedPrice: serializeDecimal(record.quotedPrice),
    currency: record.currency,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createQuoteRequestFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateQuoteRequestRequestInput): Promise<QuoteRequestApiResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const title = readRequiredString('title', body?.title);
  const type = readOptionalQuoteRequestType(body?.type);
  const description = readOptionalNullableString('description', body?.description);
  const sparePartId = readOptionalNullableString('sparePartId', body?.sparePartId);
  const ticketId = readOptionalNullableString('ticketId', body?.ticketId);
  const currency = readOptionalString('currency', body?.currency);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const quoteRequest = await dependencies.createQuoteRequest({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    title,
    ...(type !== undefined ? { type } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(sparePartId !== undefined ? { sparePartId } : {}),
    ...(ticketId !== undefined ? { ticketId } : {}),
    ...(currency !== undefined ? { currency } : {}),
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.quoteRequestCreated,
    actorUserId: currentUser.appUserId,
    targetType: 'quote_request',
    targetId: quoteRequest.id,
  });

  return toQuoteRequestApiResponse(quoteRequest);
}

export async function listQuoteRequestsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListQuoteRequestsRequestInput): Promise<ListQuoteRequestsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId =
    machineId === undefined ? undefined : readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const quoteRequests = await dependencies.listQuoteRequests({
    db: dependencies.db,
    organizationId,
    ...(normalizedMachineId !== undefined ? { machineId: normalizedMachineId } : {}),
  });

  return { quoteRequests: quoteRequests.map(toQuoteRequestApiResponse) };
}

export async function updateQuoteRequestStatusFromRequest({
  authorizationHeader,
  quoteRequestId,
  body,
  dependencies,
}: UpdateQuoteRequestStatusRequestInput): Promise<QuoteRequestApiResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedQuoteRequestId = readRequiredString('quoteRequestId', quoteRequestId);
  const status = readRequiredQuoteRequestStatus(body?.status);
  const quotedPrice = readOptionalDecimal('quotedPrice', body?.quotedPrice);
  const currency = readOptionalString('currency', body?.currency);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  const quoteRequest = await dependencies.updateQuoteRequestStatus({
    db: dependencies.db,
    organizationId,
    quoteRequestId: normalizedQuoteRequestId,
    status,
    ...(quotedPrice !== undefined ? { quotedPrice } : {}),
    ...(currency !== undefined ? { currency } : {}),
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.quoteRequestStatusUpdated,
    actorUserId: currentUser.appUserId,
    targetType: 'quote_request',
    targetId: quoteRequest.id,
  });

  return toQuoteRequestApiResponse(quoteRequest);
}

export async function createPortalQuoteRequestFromRequest({
  qrToken,
  machineId,
  body,
  dependencies,
}: CreatePortalQuoteRequestRequestInput): Promise<CreatePortalQuoteRequestResponse> {
  const normalizedQrToken = readRequiredString('qrToken', qrToken);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const title = readRequiredString('title', body?.title);
  const type = readOptionalQuoteRequestType(body?.type);
  const description = readOptionalNullableString('description', body?.description);
  const sparePartId = readOptionalNullableString('sparePartId', body?.sparePartId);
  const currency = readOptionalString('currency', body?.currency);

  const machine = await dependencies.getQrPortalMachine({
    db: dependencies.db,
    qrToken: normalizedQrToken,
  });

  if (!machine) {
    throw new NotFoundException('QR portal was not found.');
  }

  if (machine.id !== normalizedMachineId) {
    throw new BadRequestException('Machine ID does not match the QR portal.');
  }

  const customerAccessToken = randomBytes(32).toString('base64url');

  // Rate limit consideration: this public endpoint should be rate-limited in production.
  const quoteRequest = await dependencies.createQuoteRequest({
    db: dependencies.db,
    organizationId: machine.organizationId,
    machineId: machine.id,
    title,
    ...(type !== undefined ? { type } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(sparePartId !== undefined ? { sparePartId } : {}),
    ...(currency !== undefined ? { currency } : {}),
    customerAccessToken,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId: machine.organizationId,
    action: activityLogActions.quoteRequestCreated,
    targetType: 'quote_request',
    targetId: quoteRequest.id,
  });

  return {
    quoteRequestId: quoteRequest.id,
    customerAccessToken,
  };
}

@Controller('quote-requests')
export class QuoteRequestsController {
  @Post('machines/:machineId')
  async createQuoteRequest(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreateQuoteRequestBody | undefined,
  ): Promise<QuoteRequestApiResponse> {
    return createQuoteRequestFromRequest({
      authorizationHeader,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId')
  async listQuoteRequestsByMachine(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: QuoteRequestsQuery | undefined,
  ): Promise<ListQuoteRequestsResponse> {
    return listQuoteRequestsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get()
  async listQuoteRequestsForOrganization(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Query() query: QuoteRequestsQuery | undefined,
  ): Promise<ListQuoteRequestsResponse> {
    return listQuoteRequestsFromRequest({
      authorizationHeader,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':quoteRequestId/status')
  async updateQuoteRequestStatus(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('quoteRequestId') quoteRequestId: string | undefined,
    @Body() body: UpdateQuoteRequestStatusBody | undefined,
  ): Promise<QuoteRequestApiResponse> {
    return updateQuoteRequestStatusFromRequest({
      authorizationHeader,
      quoteRequestId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post('portal/:qrToken/machines/:machineId')
  async createPortalQuoteRequest(
    @Param('qrToken') qrToken: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreatePortalQuoteRequestBody | undefined,
  ): Promise<CreatePortalQuoteRequestResponse> {
    return createPortalQuoteRequestFromRequest({
      qrToken,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
