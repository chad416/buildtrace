import { Prisma } from './generated/prisma/client';
import type { PrismaClient } from './generated/prisma/client';

export type SparePartRecordsDatabase = Pick<PrismaClient, 'sparePart'>;

// internalCost must never be returned in any public-facing API
// (enforce this at the API layer in later slices)
export type SparePartRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly partName: string;
  readonly manufacturer: string | null;
  readonly partNumber: string | null;
  readonly quantity: number;
  readonly category: string;
  readonly criticality: string;
  readonly estimatedPrice: Prisma.Decimal | null;
  readonly currency: string;
  readonly internalCost: Prisma.Decimal | null;
  readonly customerVisiblePrice: Prisma.Decimal | null;
  readonly sourceDocumentId: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateSparePartInput = {
  readonly db: SparePartRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly partName: string;
  readonly manufacturer?: string | null;
  readonly partNumber?: string | null;
  readonly quantity?: number;
  readonly category?: string;
  readonly criticality?: string;
  readonly estimatedPrice?: Prisma.Decimal | null;
  readonly currency?: string;
  readonly internalCost?: Prisma.Decimal | null;
  readonly customerVisiblePrice?: Prisma.Decimal | null;
  readonly sourceDocumentId?: string | null;
  readonly notes?: string | null;
};

export type ListSparePartsInput = {
  readonly db: SparePartRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
};

export type UpdateSparePartInput = {
  readonly db: SparePartRecordsDatabase;
  readonly organizationId: string;
  readonly sparePartId: string;
  readonly partName?: string;
  readonly manufacturer?: string | null;
  readonly partNumber?: string | null;
  readonly quantity?: number;
  readonly category?: string;
  readonly criticality?: string;
  readonly estimatedPrice?: Prisma.Decimal | null;
  readonly currency?: string;
  readonly internalCost?: Prisma.Decimal | null;
  readonly customerVisiblePrice?: Prisma.Decimal | null;
  readonly notes?: string | null;
};

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalizedValue;
}

function toSparePartRecord(record: any): SparePartRecord {
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
    estimatedPrice: record.estimatedPrice,
    currency: record.currency,
    internalCost: record.internalCost,
    customerVisiblePrice: record.customerVisiblePrice,
    sourceDocumentId: record.sourceDocumentId,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createSparePart({
  db,
  organizationId,
  machineId,
  partName,
  manufacturer = null,
  partNumber = null,
  quantity = 1,
  category = 'other',
  criticality = 'recommended',
  estimatedPrice = null,
  currency = 'EUR',
  internalCost = null,
  customerVisiblePrice = null,
  sourceDocumentId = null,
  notes = null,
}: CreateSparePartInput): Promise<SparePartRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedPartName = requireNonEmptyText(partName, 'Part Name');

  const record = await db.sparePart.create({
    data: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
      partName: normalizedPartName,
      manufacturer: manufacturer?.trim() || null,
      partNumber: partNumber?.trim() || null,
      quantity,
      category,
      criticality,
      estimatedPrice,
      currency,
      internalCost,
      customerVisiblePrice,
      sourceDocumentId,
      notes: notes?.trim() || null,
    },
  });

  return toSparePartRecord(record);
}

export async function listSpareParts({
  db,
  organizationId,
  machineId,
}: ListSparePartsInput): Promise<readonly SparePartRecord[]> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');

  const records = await db.sparePart.findMany({
    where: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
    },
    orderBy: { partName: 'asc' },
    take: 100,
  });

  return records.map(toSparePartRecord);
}

export async function updateSparePart({
  db,
  organizationId,
  sparePartId,
  partName,
  manufacturer,
  partNumber,
  quantity,
  category,
  criticality,
  estimatedPrice,
  currency,
  internalCost,
  customerVisiblePrice,
  notes,
}: UpdateSparePartInput): Promise<SparePartRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedSparePartId = requireNonEmptyText(sparePartId, 'Spare Part ID');

  const existing = await db.sparePart.findFirst({
    where: {
      id: normalizedSparePartId,
      organizationId: normalizedOrgId,
    },
  });

  if (!existing) {
    throw new Error(`Spare part with ID ${normalizedSparePartId} not found in this organization.`);
  }

  const record = await db.sparePart.update({
    where: { id: normalizedSparePartId },
    data: {
      ...(partName !== undefined ? { partName: partName.trim() } : {}),
      ...(manufacturer !== undefined ? { manufacturer: manufacturer?.trim() || null } : {}),
      ...(partNumber !== undefined ? { partNumber: partNumber?.trim() || null } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(criticality !== undefined ? { criticality } : {}),
      ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(internalCost !== undefined ? { internalCost } : {}),
      ...(customerVisiblePrice !== undefined ? { customerVisiblePrice } : {}),
      ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      updatedAt: new Date(),
    },
  });

  return toSparePartRecord(record);
}
