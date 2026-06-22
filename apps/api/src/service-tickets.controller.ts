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
import type { OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  addTicketComment,
  createActivityLog,
  createPrismaClient,
  createServiceTicket,
  getQrPortalMachine,
  getServiceTicket,
  listServiceTickets,
  listTicketComments,
  updateServiceTicketStatus,
} from '@buildtrace/db';
import type { ServiceTicketRecord, TicketCommentRecord } from '@buildtrace/db';
import {
  activityLogActions,
  ticketPriorities,
  ticketStatuses,
  type TicketPriority,
  type TicketStatus,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

export type ServiceTicketsQuery = {
  readonly organizationId?: unknown;
};

export type CreateServiceTicketBody = {
  readonly organizationId?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly priority?: unknown;
};

export type CreatePortalServiceTicketBody = {
  readonly title?: unknown;
  readonly description?: unknown;
  readonly priority?: unknown;
};

export type UpdateTicketStatusBody = {
  readonly organizationId?: unknown;
  readonly status?: unknown;
};

export type AddTicketCommentBody = {
  readonly organizationId?: unknown;
  readonly message?: unknown;
  readonly internalOnly?: unknown;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

export type ServiceTicketsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createServiceTicket: typeof createServiceTicket;
  readonly getQrPortalMachine: typeof getQrPortalMachine;
  readonly listServiceTickets: typeof listServiceTickets;
  readonly getServiceTicket: typeof getServiceTicket;
  readonly updateServiceTicketStatus: typeof updateServiceTicketStatus;
  readonly addTicketComment: typeof addTicketComment;
  readonly listTicketComments: typeof listTicketComments;
  readonly createActivityLog: typeof createActivityLog;
};

export type ListServiceTicketsResponse = {
  readonly tickets: readonly ServiceTicketRecord[];
};

export type ListTicketCommentsResponse = {
  readonly comments: readonly TicketCommentRecord[];
};

export type CreatePortalServiceTicketResponse = {
  readonly ticketId: string;
  readonly customerAccessToken: string;
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

function createRealDependencies(): ServiceTicketsEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    createServiceTicket,
    getQrPortalMachine,
    listServiceTickets,
    getServiceTicket,
    updateServiceTicketStatus,
    addTicketComment,
    listTicketComments,
    createActivityLog,
  };
}

type CreateTicketRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreateServiceTicketBody | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type CreatePortalTicketRequestInput = {
  readonly qrToken: string | undefined;
  readonly machineId: string | undefined;
  readonly body: CreatePortalServiceTicketBody | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type ListTicketsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: ServiceTicketsQuery | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type GetTicketRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly query: ServiceTicketsQuery | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type UpdateStatusRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly body: UpdateTicketStatusBody | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type AddCommentRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly body: AddTicketCommentBody | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type ListCommentsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly query: ServiceTicketsQuery | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

function readTicketPriority(value: unknown): TicketPriority | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !(ticketPriorities as readonly string[]).includes(value)) {
    throw new BadRequestException(`priority must be one of: ${ticketPriorities.join(', ')}`);
  }

  return value as TicketPriority;
}

export async function createServiceTicketFromRequest({
  authorizationHeader,
  machineId,
  body,
  dependencies,
}: CreateTicketRequestInput): Promise<ServiceTicketRecord> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const title = readRequiredString('title', body?.title);
  const description = readRequiredString('description', body?.description);

  const priority = readTicketPriority(body?.priority);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const ticket = await dependencies.createServiceTicket({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
    title,
    description,
    ...(priority !== undefined ? { priority } : {}),
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.ticketCreated,
    actorUserId: currentUser.appUserId,
    targetType: 'ticket',
    targetId: ticket.id,
  });

  return ticket;
}

export async function createPortalServiceTicketFromRequest({
  qrToken,
  machineId,
  body,
  dependencies,
}: CreatePortalTicketRequestInput): Promise<CreatePortalServiceTicketResponse> {
  const normalizedQrToken = readRequiredString('qrToken', qrToken);
  const normalizedMachineId = readRequiredString('machineId', machineId);
  const title = readRequiredString('title', body?.title);
  const description = readRequiredString('description', body?.description);
  const priority = readTicketPriority(body?.priority);

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
  const ticket = await dependencies.createServiceTicket({
    db: dependencies.db,
    organizationId: machine.organizationId,
    machineId: machine.id,
    title,
    description,
    ...(priority !== undefined ? { priority } : {}),
    createdFromPortal: true,
    customerAccessToken,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId: machine.organizationId,
    action: activityLogActions.ticketCreated,
    targetType: 'ticket',
    targetId: ticket.id,
  });

  return {
    ticketId: ticket.id,
    customerAccessToken,
  };
}

export async function listServiceTicketsFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: ListTicketsRequestInput): Promise<ListServiceTicketsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const tickets = await dependencies.listServiceTickets({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return { tickets };
}

export async function getServiceTicketFromRequest({
  authorizationHeader,
  ticketId,
  query,
  dependencies,
}: GetTicketRequestInput): Promise<ServiceTicketRecord> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedTicketId = readRequiredString('ticketId', ticketId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const ticket = await dependencies.getServiceTicket({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
  });

  if (!ticket) {
    throw new NotFoundException('Ticket was not found.');
  }

  return ticket;
}

export async function updateTicketStatusFromRequest({
  authorizationHeader,
  ticketId,
  body,
  dependencies,
}: UpdateStatusRequestInput): Promise<ServiceTicketRecord> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedTicketId = readRequiredString('ticketId', ticketId);
  const statusValue = readRequiredString('status', body?.status);

  if (!(ticketStatuses as readonly string[]).includes(statusValue)) {
    throw new BadRequestException(`status must be one of: ${ticketStatuses.join(', ')}`);
  }

  const status = statusValue as TicketStatus;

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: adminRoles,
  });

  const ticket = await dependencies.updateServiceTicketStatus({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
    status,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.ticketStatusUpdated,
    actorUserId: currentUser.appUserId,
    targetType: 'ticket',
    targetId: normalizedTicketId,
  });

  return ticket;
}

export async function addTicketCommentFromRequest({
  authorizationHeader,
  ticketId,
  body,
  dependencies,
}: AddCommentRequestInput): Promise<TicketCommentRecord> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedTicketId = readRequiredString('ticketId', ticketId);
  const message = readRequiredString('message', body?.message);
  const internalOnly = body?.internalOnly === true;

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const comment = await dependencies.addTicketComment({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
    authorType: 'builder',
    message,
    internalOnly,
  });

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.ticketCommentAdded,
    actorUserId: currentUser.appUserId,
    targetType: 'ticket',
    targetId: normalizedTicketId,
  });

  return comment;
}

export async function listTicketCommentsFromRequest({
  authorizationHeader,
  ticketId,
  query,
  dependencies,
}: ListCommentsRequestInput): Promise<ListTicketCommentsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedTicketId = readRequiredString('ticketId', ticketId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: memberRoles,
  });

  const comments = await dependencies.listTicketComments({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
    includeInternal: true,
  });

  return { comments };
}

@Controller('service-tickets')
export class ServiceTicketsController {
  @Post('portal/:qrToken/machines/:machineId')
  async createPortalTicket(
    @Param('qrToken') qrToken: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreatePortalServiceTicketBody | undefined,
  ): Promise<CreatePortalServiceTicketResponse> {
    return createPortalServiceTicketFromRequest({
      qrToken,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId')
  async createTicket(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Body() body: CreateServiceTicketBody | undefined,
  ): Promise<ServiceTicketRecord> {
    return createServiceTicketFromRequest({
      authorizationHeader,
      machineId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId')
  async listTickets(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: ServiceTicketsQuery | undefined,
  ): Promise<ListServiceTicketsResponse> {
    return listServiceTicketsFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get(':ticketId')
  async getTicket(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Query() query: ServiceTicketsQuery | undefined,
  ): Promise<ServiceTicketRecord> {
    return getServiceTicketFromRequest({
      authorizationHeader,
      ticketId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Patch(':ticketId/status')
  async updateTicketStatus(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Body() body: UpdateTicketStatusBody | undefined,
  ): Promise<ServiceTicketRecord> {
    return updateTicketStatusFromRequest({
      authorizationHeader,
      ticketId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Post(':ticketId/comments')
  async addComment(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Body() body: AddTicketCommentBody | undefined,
  ): Promise<TicketCommentRecord> {
    return addTicketCommentFromRequest({
      authorizationHeader,
      ticketId,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get(':ticketId/comments')
  async listComments(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Query() query: ServiceTicketsQuery | undefined,
  ): Promise<ListTicketCommentsResponse> {
    return listTicketCommentsFromRequest({
      authorizationHeader,
      ticketId,
      query,
      dependencies: createRealDependencies(),
    });
  }
}
