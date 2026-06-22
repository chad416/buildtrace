import { randomBytes } from 'node:crypto';

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
import type { OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  addTicketComment,
  createActivityLog,
  createPrismaClient,
  createServiceTicket,
  getQrPortalMachine,
  getServiceTicket,
  getTicketComment,
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
import {
  createSupabaseDocumentStorageAdapter,
  readDocumentStorageConfig,
  type DocumentStorageSignedUrlResult,
} from './document-storage.js';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document-upload-endpoint.js';
import {
  createTicketAttachmentSignedUrl,
  uploadTicketAttachment,
} from './ticket-attachment-storage.js';

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

export type CreateTicketAttachmentDownloadUrlBody = {
  readonly organizationId?: unknown;
};

type MultipartField = {
  readonly value?: unknown;
};

export type TicketAttachmentMultipartFile = {
  readonly filename?: unknown;
  readonly file?: AsyncIterable<Uint8Array>;
  readonly fields?: Record<string, unknown>;
};

export type TicketAttachmentUploadHttpRequest = {
  readonly body?: unknown;
  readonly file?: () => Promise<TicketAttachmentMultipartFile | undefined>;
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
  readonly getTicketComment: typeof getTicketComment;
  readonly updateServiceTicketStatus: typeof updateServiceTicketStatus;
  readonly addTicketComment: typeof addTicketComment;
  readonly listTicketComments: typeof listTicketComments;
  readonly createActivityLog: typeof createActivityLog;
  readonly uploadTicketAttachment: typeof uploadTicketAttachment;
  readonly createTicketAttachmentSignedUrl: typeof createTicketAttachmentSignedUrl;
  readonly readDocumentStorageConfig: typeof readDocumentStorageConfig;
  readonly createDocumentStorageAdapter: typeof createSupabaseDocumentStorageAdapter;
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

export type TicketAttachmentDownloadUrlResponse = {
  readonly commentId: string;
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

function createRealDependencies(): ServiceTicketsEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    createServiceTicket,
    getQrPortalMachine,
    listServiceTickets,
    getServiceTicket,
    getTicketComment,
    updateServiceTicketStatus,
    addTicketComment,
    listTicketComments,
    createActivityLog,
    uploadTicketAttachment,
    createTicketAttachmentSignedUrl,
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
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

type AddCommentAttachmentRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly request: TicketAttachmentUploadHttpRequest;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type ListCommentsRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly query: ServiceTicketsQuery | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

type CreateCommentAttachmentDownloadUrlRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly ticketId: string | undefined;
  readonly commentId: string | undefined;
  readonly body: CreateTicketAttachmentDownloadUrlBody | undefined;
  readonly dependencies: ServiceTicketsEndpointDependencies;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapMultipartField(value: unknown): unknown {
  if (Array.isArray(value)) {
    throw new BadRequestException('Repeated ticket attachment fields are not supported.');
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

function readOptionalMultipartBooleanField(
  name: string,
  body: unknown,
  multipartFields: Record<string, unknown> | undefined,
): boolean {
  const value = readOptionalMultipartField(name, body, multipartFields);

  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  throw new BadRequestException(`${name} must be a boolean.`);
}

function normalizeTicketAttachmentFileName(fileName: unknown): string {
  if (typeof fileName !== 'string') {
    throw new BadRequestException('Uploaded ticket attachment file name is required.');
  }

  const normalizedFileName = fileName.trim().replace(/\s+/g, ' ');

  if (!normalizedFileName) {
    throw new BadRequestException('Uploaded ticket attachment file name is required.');
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\')
  ) {
    throw new BadRequestException('Uploaded ticket attachment file name is not safe.');
  }

  return normalizedFileName;
}

async function readTicketAttachmentMultipartFile(
  request: TicketAttachmentUploadHttpRequest,
): Promise<TicketAttachmentMultipartFile> {
  if (typeof request.file !== 'function') {
    throw new BadRequestException('Uploaded ticket attachment file is required.');
  }

  const file = await request.file();

  if (!file) {
    throw new BadRequestException('Uploaded ticket attachment file is required.');
  }

  return file;
}

async function readTicketAttachmentFileBody(
  file: TicketAttachmentMultipartFile,
): Promise<ArrayBuffer> {
  if (!file.file) {
    throw new BadRequestException('Uploaded ticket attachment file stream is required.');
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of file.file) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException(
        `Uploaded ticket attachment must be ${MAX_DOCUMENT_UPLOAD_BYTES} bytes or smaller.`,
      );
    }

    chunks.push(buffer);
  }

  if (totalBytes === 0) {
    throw new BadRequestException('Uploaded ticket attachment file must not be empty.');
  }

  const body = Buffer.concat(chunks, totalBytes);

  return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
}

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

export async function addTicketCommentAttachmentFromRequest({
  authorizationHeader,
  ticketId,
  request,
  dependencies,
}: AddCommentAttachmentRequestInput): Promise<TicketCommentRecord> {
  const normalizedTicketId = readRequiredString('ticketId', ticketId);
  const uploadedFile = await readTicketAttachmentMultipartFile(request);
  const multipartFields = uploadedFile.fields;
  const organizationId = readRequiredMultipartTextField(
    'organizationId',
    request.body,
    multipartFields,
  );
  const message = readRequiredMultipartTextField('message', request.body, multipartFields);
  const internalOnly = readOptionalMultipartBooleanField(
    'internalOnly',
    request.body,
    multipartFields,
  );
  const fileName = normalizeTicketAttachmentFileName(uploadedFile.filename);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
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

  const fileBody = await readTicketAttachmentFileBody(uploadedFile);
  let attachmentStoragePath: string;

  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);
    const uploadResult = await dependencies.uploadTicketAttachment({
      config,
      storage,
      organizationId,
      ticketId: normalizedTicketId,
      fileName,
      fileBody,
    });

    attachmentStoragePath = uploadResult.storagePath;
  } catch {
    throw new InternalServerErrorException('Ticket attachment could not be uploaded.');
  }

  const comment = await dependencies.addTicketComment({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
    authorType: 'builder',
    message,
    internalOnly,
    attachmentUrl: null,
    attachmentStoragePath,
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

export async function createTicketCommentAttachmentDownloadUrlFromRequest({
  authorizationHeader,
  ticketId,
  commentId,
  body,
  dependencies,
}: CreateCommentAttachmentDownloadUrlRequestInput): Promise<TicketAttachmentDownloadUrlResponse> {
  const organizationId = readRequiredString('organizationId', body?.organizationId);
  const normalizedTicketId = readRequiredString('ticketId', ticketId);
  const normalizedCommentId = readRequiredString('commentId', commentId);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
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

  const comment = await dependencies.getTicketComment({
    db: dependencies.db,
    organizationId,
    ticketId: normalizedTicketId,
    commentId: normalizedCommentId,
  });

  if (!comment) {
    throw new NotFoundException('Ticket comment was not found.');
  }

  if (!comment.attachmentStoragePath) {
    throw new NotFoundException('Ticket comment attachment was not found.');
  }

  let signedUrlResult: DocumentStorageSignedUrlResult;

  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrlResult = await dependencies.createTicketAttachmentSignedUrl({
      config,
      storage,
      organizationId,
      ticketId: normalizedTicketId,
      storagePath: comment.attachmentStoragePath,
    });
  } catch {
    throw new InternalServerErrorException('Ticket attachment download URL could not be created.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.documentDownloadUrlIssued,
    actorUserId: currentUser.appUserId,
    targetType: 'ticket_comment',
    targetId: normalizedCommentId,
  });

  return {
    commentId: normalizedCommentId,
    downloadUrl: signedUrlResult.signedUrl,
    expiresInSeconds: signedUrlResult.expiresInSeconds,
  };
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

  @Post(':ticketId/comments/with-attachment')
  async addCommentAttachment(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Req() request: TicketAttachmentUploadHttpRequest,
  ): Promise<TicketCommentRecord> {
    return addTicketCommentAttachmentFromRequest({
      authorizationHeader,
      ticketId,
      request,
      dependencies: createRealDependencies(),
    });
  }

  @Post(':ticketId/comments/:commentId/attachment-url')
  async createCommentAttachmentDownloadUrl(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('ticketId') ticketId: string | undefined,
    @Param('commentId') commentId: string | undefined,
    @Body() body: CreateTicketAttachmentDownloadUrlBody | undefined,
  ): Promise<TicketAttachmentDownloadUrlResponse> {
    return createTicketCommentAttachmentDownloadUrlFromRequest({
      authorizationHeader,
      ticketId,
      commentId,
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
