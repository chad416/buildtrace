import type { TicketStatus, TicketPriority, TicketAuthorType } from '@buildtrace/shared';
import type { PrismaClient } from './generated/prisma/client';

export type ServiceTicketRecordsDatabase = Pick<PrismaClient, 'serviceTicket' | 'ticketComment'>;

export type ServiceTicketRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly customerId: string | null;
  readonly title: string;
  readonly description: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly createdFromPortal: boolean;
  readonly customerAccessToken: string | null;
  readonly meetingLink: string | null;
  readonly meetingNotes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TicketCommentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly authorType: TicketAuthorType;
  readonly message: string;
  readonly internalOnly: boolean;
  readonly attachmentUrl: string | null;
  readonly attachmentStoragePath: string | null;
  readonly createdAt: Date;
};

export type CreateServiceTicketInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly customerId?: string | null;
  readonly title: string;
  readonly description: string;
  readonly priority?: TicketPriority;
  readonly createdFromPortal?: boolean;
  readonly customerAccessToken?: string | null;
};

export type ListServiceTicketsInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly machineId?: string | null;
};

export type GetServiceTicketInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
};

export type GetTicketCommentInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly commentId: string;
};

export type UpdateServiceTicketStatusInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly status: TicketStatus;
};

export type UpdateTicketMeetingLinkInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly meetingLink: string | null;
  readonly meetingNotes: string | null;
};

export type AddTicketCommentInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly authorType: TicketAuthorType;
  readonly message: string;
  readonly internalOnly?: boolean;
  readonly attachmentUrl?: string | null;
  readonly attachmentStoragePath?: string | null;
};

export type ListTicketCommentsInput = {
  readonly db: ServiceTicketRecordsDatabase;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly includeInternal?: boolean;
};

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function toServiceTicketRecord(ticket: {
  id: string;
  organizationId: string;
  machineId: string;
  customerId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdFromPortal: boolean;
  customerAccessToken: string | null;
  meetingLink: string | null;
  meetingNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ServiceTicketRecord {
  return {
    id: ticket.id,
    organizationId: ticket.organizationId,
    machineId: ticket.machineId,
    customerId: ticket.customerId,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    createdFromPortal: ticket.createdFromPortal,
    customerAccessToken: ticket.customerAccessToken,
    meetingLink: ticket.meetingLink,
    meetingNotes: ticket.meetingNotes,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function toTicketCommentRecord(comment: {
  id: string;
  organizationId: string;
  ticketId: string;
  authorType: string;
  message: string;
  internalOnly: boolean;
  attachmentUrl: string | null;
  attachmentStoragePath: string | null;
  createdAt: Date;
}): TicketCommentRecord {
  return {
    id: comment.id,
    organizationId: comment.organizationId,
    ticketId: comment.ticketId,
    authorType: comment.authorType as TicketAuthorType,
    message: comment.message,
    internalOnly: comment.internalOnly,
    attachmentUrl: comment.attachmentUrl,
    attachmentStoragePath: comment.attachmentStoragePath,
    createdAt: comment.createdAt,
  };
}

export async function createServiceTicket({
  db,
  organizationId,
  machineId,
  customerId,
  title,
  description,
  priority = 'normal',
  createdFromPortal = false,
  customerAccessToken,
}: CreateServiceTicketInput): Promise<ServiceTicketRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedTitle = requireNonEmptyText(title, 'Title');
  const normalizedDescription = requireNonEmptyText(description, 'Description');
  const normalizedCustomerId = customerId?.trim() || null;
  const normalizedToken = customerAccessToken?.trim() || null;

  const ticket = await db.serviceTicket.create({
    data: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
      customerId: normalizedCustomerId,
      title: normalizedTitle,
      description: normalizedDescription,
      status: 'open',
      priority,
      createdFromPortal,
      customerAccessToken: normalizedToken,
    },
  });

  return toServiceTicketRecord(ticket);
}

export async function listServiceTickets({
  db,
  organizationId,
  machineId,
}: ListServiceTicketsInput): Promise<readonly ServiceTicketRecord[]> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = machineId?.trim() || null;

  const tickets = await db.serviceTicket.findMany({
    where: {
      organizationId: normalizedOrgId,
      ...(normalizedMachineId ? { machineId: normalizedMachineId } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return tickets.map(toServiceTicketRecord);
}

export async function getServiceTicket({
  db,
  organizationId,
  ticketId,
}: GetServiceTicketInput): Promise<ServiceTicketRecord | null> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');

  const ticket = await db.serviceTicket.findFirst({
    where: {
      id: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  return ticket ? toServiceTicketRecord(ticket) : null;
}

export async function getTicketComment({
  db,
  organizationId,
  ticketId,
  commentId,
}: GetTicketCommentInput): Promise<TicketCommentRecord | null> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');
  const normalizedCommentId = requireNonEmptyText(commentId, 'Comment ID');

  const comment = await db.ticketComment.findFirst({
    where: {
      id: normalizedCommentId,
      ticketId: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  return comment ? toTicketCommentRecord(comment) : null;
}

export async function updateServiceTicketStatus({
  db,
  organizationId,
  ticketId,
  status,
}: UpdateServiceTicketStatusInput): Promise<ServiceTicketRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');

  const existing = await db.serviceTicket.findFirst({
    where: {
      id: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  if (!existing) {
    throw new Error(`Ticket with ID ${normalizedTicketId} not found in this organization.`);
  }

  const updated = await db.serviceTicket.update({
    where: {
      id: normalizedTicketId,
    },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  return toServiceTicketRecord(updated);
}

export async function updateTicketMeetingLink({
  db,
  organizationId,
  ticketId,
  meetingLink,
  meetingNotes,
}: UpdateTicketMeetingLinkInput): Promise<ServiceTicketRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');
  const normalizedMeetingLink = meetingLink?.trim() || null;
  const normalizedMeetingNotes = meetingNotes?.trim() || null;

  const existing = await db.serviceTicket.findFirst({
    where: {
      id: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  if (!existing) {
    throw new Error(`Ticket with ID ${normalizedTicketId} not found in this organization.`);
  }

  const updated = await db.serviceTicket.update({
    where: {
      id: normalizedTicketId,
    },
    data: {
      meetingLink: normalizedMeetingLink,
      meetingNotes: normalizedMeetingNotes,
      updatedAt: new Date(),
    },
  });

  return toServiceTicketRecord(updated);
}

export async function addTicketComment({
  db,
  organizationId,
  ticketId,
  authorType,
  message,
  internalOnly = false,
  attachmentUrl = null,
  attachmentStoragePath = null,
}: AddTicketCommentInput): Promise<TicketCommentRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');
  const normalizedMessage = requireNonEmptyText(message, 'Message');

  const ticket = await db.serviceTicket.findFirst({
    where: {
      id: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  if (!ticket) {
    throw new Error(`Ticket with ID ${normalizedTicketId} not found in this organization.`);
  }

  const comment = await db.ticketComment.create({
    data: {
      organizationId: normalizedOrgId,
      ticketId: normalizedTicketId,
      authorType,
      message: normalizedMessage,
      internalOnly,
      attachmentUrl: attachmentUrl?.trim() || null,
      attachmentStoragePath: attachmentStoragePath?.trim() || null,
    },
  });

  return toTicketCommentRecord(comment);
}

export async function listTicketComments({
  db,
  organizationId,
  ticketId,
  includeInternal = false,
}: ListTicketCommentsInput): Promise<readonly TicketCommentRecord[]> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedTicketId = requireNonEmptyText(ticketId, 'Ticket ID');

  const ticket = await db.serviceTicket.findFirst({
    where: {
      id: normalizedTicketId,
      organizationId: normalizedOrgId,
    },
  });

  if (!ticket) {
    throw new Error(`Ticket with ID ${normalizedTicketId} not found in this organization.`);
  }

  const comments = await db.ticketComment.findMany({
    where: {
      ticketId: normalizedTicketId,
      organizationId: normalizedOrgId,
      ...(includeInternal ? {} : { internalOnly: false }),
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return comments.map(toTicketCommentRecord);
}
