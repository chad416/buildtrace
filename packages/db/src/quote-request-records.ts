import { Prisma } from './generated/prisma/client';
import type { PrismaClient } from './generated/prisma/client';
import type { QuoteRequestStatus, QuoteRequestType } from '@buildtrace/shared';

export type QuoteRequestRecordsDatabase = Pick<PrismaClient, 'quoteRequest'>;

export type QuoteRequestRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly sparePartId: string | null;
  readonly ticketId: string | null;
  readonly type: QuoteRequestType;
  readonly title: string;
  readonly description: string | null;
  readonly quotedPrice: Prisma.Decimal | null;
  readonly currency: string;
  readonly status: QuoteRequestStatus;
  readonly customerAccessToken: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateQuoteRequestInput = {
  readonly db: QuoteRequestRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly title: string;
  readonly type?: QuoteRequestType;
  readonly description?: string | null;
  readonly sparePartId?: string | null;
  readonly ticketId?: string | null;
  readonly currency?: string;
  readonly customerAccessToken?: string | null;
};

export type ListQuoteRequestsInput = {
  readonly db: QuoteRequestRecordsDatabase;
  readonly organizationId: string;
  readonly machineId?: string | null;
};

export type UpdateQuoteRequestStatusInput = {
  readonly db: QuoteRequestRecordsDatabase;
  readonly organizationId: string;
  readonly quoteRequestId: string;
  readonly status: QuoteRequestStatus;
  readonly quotedPrice?: Prisma.Decimal | null;
  readonly currency?: string;
};

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalizedValue;
}

function toQuoteRequestRecord(record: any): QuoteRequestRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    machineId: record.machineId,
    sparePartId: record.sparePartId,
    ticketId: record.ticketId,
    type: record.type as QuoteRequestType,
    title: record.title,
    description: record.description,
    quotedPrice: record.quotedPrice,
    currency: record.currency,
    status: record.status as QuoteRequestStatus,
    customerAccessToken: record.customerAccessToken,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createQuoteRequest({
  db,
  organizationId,
  machineId,
  title,
  type = 'spare-part',
  description = null,
  sparePartId = null,
  ticketId = null,
  currency = 'EUR',
  customerAccessToken = null,
}: CreateQuoteRequestInput): Promise<QuoteRequestRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedTitle = requireNonEmptyText(title, 'Title');

  const record = await db.quoteRequest.create({
    data: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
      title: normalizedTitle,
      type,
      description: description?.trim() || null,
      sparePartId: sparePartId?.trim() || null,
      ticketId: ticketId?.trim() || null,
      currency,
      status: 'requested',
      customerAccessToken: customerAccessToken?.trim() || null,
    },
  });

  return toQuoteRequestRecord(record);
}

export async function listQuoteRequests({
  db,
  organizationId,
  machineId = null,
}: ListQuoteRequestsInput): Promise<readonly QuoteRequestRecord[]> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = machineId?.trim() || null;

  const records = await db.quoteRequest.findMany({
    where: {
      organizationId: normalizedOrgId,
      ...(normalizedMachineId ? { machineId: normalizedMachineId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return records.map(toQuoteRequestRecord);
}

export async function updateQuoteRequestStatus({
  db,
  organizationId,
  quoteRequestId,
  status,
  quotedPrice,
  currency,
}: UpdateQuoteRequestStatusInput): Promise<QuoteRequestRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedRequestId = requireNonEmptyText(quoteRequestId, 'Quote Request ID');

  const existing = await db.quoteRequest.findFirst({
    where: {
      id: normalizedRequestId,
      organizationId: normalizedOrgId,
    },
  });

  if (!existing) {
    throw new Error(`Quote request with ID ${normalizedRequestId} not found in this organization.`);
  }

  const record = await db.quoteRequest.update({
    where: { id: normalizedRequestId },
    data: {
      status,
      ...(quotedPrice !== undefined ? { quotedPrice } : {}),
      ...(currency !== undefined ? { currency } : {}),
      updatedAt: new Date(),
    },
  });

  return toQuoteRequestRecord(record);
}
