import type {
  DocumentCategory,
  DocumentLanguageCode,
  DocumentVisibilityLevel,
} from '@buildtrace/shared';
import { getDefaultDocumentVisibilityForCategory } from '@buildtrace/shared';

import type { PrismaClient } from './generated/prisma/client';
import {
  DocumentCategory as PrismaDocumentCategory,
  DocumentLanguage as PrismaDocumentLanguage,
  DocumentVisibilityLevel as PrismaDocumentVisibilityLevel,
} from './generated/prisma/enums';

type PrismaDocumentCategoryValue =
  (typeof PrismaDocumentCategory)[keyof typeof PrismaDocumentCategory];

type PrismaDocumentVisibilityLevelValue =
  (typeof PrismaDocumentVisibilityLevel)[keyof typeof PrismaDocumentVisibilityLevel];

type PrismaDocumentLanguageValue =
  (typeof PrismaDocumentLanguage)[keyof typeof PrismaDocumentLanguage];

type PrismaDocumentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly fileType: string;
  readonly category: PrismaDocumentCategoryValue;
  readonly visibilityLevel: PrismaDocumentVisibilityLevelValue;
  readonly visibleToCustomer: boolean;
  readonly language: PrismaDocumentLanguageValue;
  readonly checksum: string;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: Date;
  readonly lastDownloadUrlIssuedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type DocumentRecordsDatabase = Pick<PrismaClient, 'document'>;

export type DocumentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly fileType: string;
  readonly category: DocumentCategory;
  readonly visibilityLevel: DocumentVisibilityLevel;
  readonly visibleToCustomer: boolean;
  readonly language: DocumentLanguageCode;
  readonly checksum: string;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: Date;
  readonly lastDownloadUrlIssuedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateDocumentRecordInput = {
  readonly db: DocumentRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly fileType: string;
  readonly category: DocumentCategory;
  readonly checksum: string;
  readonly language?: DocumentLanguageCode;
  readonly uploadedByUserId?: string | null;
};

export type ListDocumentsByMachineInput = {
  readonly db: DocumentRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
};

export type GetDocumentByMachineInput = {
  readonly db: DocumentRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentId: string;
};

export type UpdateDocumentCategoryInput = GetDocumentByMachineInput & {
  readonly category: DocumentCategory;
};

export type UpdateDocumentVisibilityInput = GetDocumentByMachineInput & {
  readonly visibilityLevel: DocumentVisibilityLevel;
};

export type MarkDocumentDownloadUrlIssuedInput = GetDocumentByMachineInput & {
  readonly issuedAt?: Date;
};

const prismaDocumentCategoryByCategory = {
  plc: PrismaDocumentCategory.PLC,
  hmi: PrismaDocumentCategory.HMI,
  'mechanical-drawings': PrismaDocumentCategory.MECHANICAL_DRAWINGS,
  'electrical-drawings': PrismaDocumentCategory.ELECTRICAL_DRAWINGS,
  cad: PrismaDocumentCategory.CAD,
  'machine-photos': PrismaDocumentCategory.MACHINE_PHOTOS,
  fat: PrismaDocumentCategory.FAT,
  sat: PrismaDocumentCategory.SAT,
  manuals: PrismaDocumentCategory.MANUALS,
  'safety-instructions': PrismaDocumentCategory.SAFETY_INSTRUCTIONS,
  'supplier-documents': PrismaDocumentCategory.SUPPLIER_DOCUMENTS,
  'spare-parts-bom': PrismaDocumentCategory.SPARE_PARTS_BOM,
  certificates: PrismaDocumentCategory.CERTIFICATES,
  'service-notes': PrismaDocumentCategory.SERVICE_NOTES,
  other: PrismaDocumentCategory.OTHER,
} satisfies Record<DocumentCategory, PrismaDocumentCategoryValue>;

const prismaDocumentVisibilityLevelByVisibilityLevel = {
  'customer-visible': PrismaDocumentVisibilityLevel.CUSTOMER_VISIBLE,
  internal: PrismaDocumentVisibilityLevel.INTERNAL,
  'sensitive-engineering': PrismaDocumentVisibilityLevel.SENSITIVE_ENGINEERING,
  restricted: PrismaDocumentVisibilityLevel.RESTRICTED,
} satisfies Record<DocumentVisibilityLevel, PrismaDocumentVisibilityLevelValue>;

const prismaDocumentLanguageByLanguage = {
  en: PrismaDocumentLanguage.EN,
  cs: PrismaDocumentLanguage.CS,
  sk: PrismaDocumentLanguage.SK,
  pl: PrismaDocumentLanguage.PL,
  de: PrismaDocumentLanguage.DE,
  fr: PrismaDocumentLanguage.FR,
  es: PrismaDocumentLanguage.ES,
  unknown: PrismaDocumentLanguage.UNKNOWN,
} satisfies Record<DocumentLanguageCode, PrismaDocumentLanguageValue>;

const categoryByPrismaDocumentCategory = Object.fromEntries(
  Object.entries(prismaDocumentCategoryByCategory).map(([category, prismaCategory]) => [
    prismaCategory,
    category,
  ]),
) as Record<PrismaDocumentCategoryValue, DocumentCategory>;

const visibilityLevelByPrismaDocumentVisibilityLevel = Object.fromEntries(
  Object.entries(prismaDocumentVisibilityLevelByVisibilityLevel).map(
    ([visibilityLevel, prismaVisibilityLevel]) => [prismaVisibilityLevel, visibilityLevel],
  ),
) as Record<PrismaDocumentVisibilityLevelValue, DocumentVisibilityLevel>;

const languageByPrismaDocumentLanguage = Object.fromEntries(
  Object.entries(prismaDocumentLanguageByLanguage).map(([language, prismaLanguage]) => [
    prismaLanguage,
    language,
  ]),
) as Record<PrismaDocumentLanguageValue, DocumentLanguageCode>;

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function toDocumentRecord(record: PrismaDocumentRecord): DocumentRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    machineId: record.machineId,
    fileName: record.fileName,
    storagePath: record.storagePath,
    fileType: record.fileType,
    category: categoryByPrismaDocumentCategory[record.category],
    visibilityLevel: visibilityLevelByPrismaDocumentVisibilityLevel[record.visibilityLevel],
    visibleToCustomer: record.visibleToCustomer,
    language: languageByPrismaDocumentLanguage[record.language],
    checksum: record.checksum,
    uploadedByUserId: record.uploadedByUserId,
    uploadedAt: record.uploadedAt,
    lastDownloadUrlIssuedAt: record.lastDownloadUrlIssuedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function readDocumentAfterUpdate({
  db,
  organizationId,
  machineId,
  documentId,
}: GetDocumentByMachineInput): Promise<DocumentRecord> {
  const record = await getDocumentByMachine({
    db,
    organizationId,
    machineId,
    documentId,
  });

  if (!record) {
    throw new Error('Updated document could not be reloaded.');
  }

  return record;
}

export async function createDocumentRecord({
  db,
  organizationId,
  machineId,
  fileName,
  storagePath,
  fileType,
  category,
  checksum,
  language = 'unknown',
  uploadedByUserId,
}: CreateDocumentRecordInput): Promise<DocumentRecord> {
  const defaultVisibility = getDefaultDocumentVisibilityForCategory(category);

  const record = await db.document.create({
    data: {
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
      fileName: requireNonEmptyText(fileName, 'fileName'),
      storagePath: requireNonEmptyText(storagePath, 'storagePath'),
      fileType: requireNonEmptyText(fileType, 'fileType'),
      category: prismaDocumentCategoryByCategory[category],
      visibilityLevel:
        prismaDocumentVisibilityLevelByVisibilityLevel[defaultVisibility.visibilityLevel],
      visibleToCustomer: defaultVisibility.visibleToCustomer,
      language: prismaDocumentLanguageByLanguage[language],
      checksum: requireNonEmptyText(checksum, 'checksum'),
      uploadedByUserId: normalizeOptionalText(uploadedByUserId),
    },
  });

  return toDocumentRecord(record);
}

export async function listDocumentsByMachine({
  db,
  organizationId,
  machineId,
}: ListDocumentsByMachineInput): Promise<DocumentRecord[]> {
  const records = await db.document.findMany({
    where: {
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
    orderBy: [{ uploadedAt: 'desc' }, { id: 'asc' }],
  });

  return records.map(toDocumentRecord);
}

export async function getDocumentByMachine({
  db,
  organizationId,
  machineId,
  documentId,
}: GetDocumentByMachineInput): Promise<DocumentRecord | null> {
  const record = await db.document.findFirst({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
  });

  return record ? toDocumentRecord(record) : null;
}

export async function updateDocumentCategory({
  db,
  organizationId,
  machineId,
  documentId,
  category,
}: UpdateDocumentCategoryInput): Promise<DocumentRecord | null> {
  const defaultVisibility = getDefaultDocumentVisibilityForCategory(category);

  const result = await db.document.updateMany({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
    data: {
      category: prismaDocumentCategoryByCategory[category],
      visibilityLevel:
        prismaDocumentVisibilityLevelByVisibilityLevel[defaultVisibility.visibilityLevel],
      visibleToCustomer: defaultVisibility.visibleToCustomer,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return readDocumentAfterUpdate({
    db,
    organizationId,
    machineId,
    documentId,
  });
}

export async function updateDocumentVisibility({
  db,
  organizationId,
  machineId,
  documentId,
  visibilityLevel,
}: UpdateDocumentVisibilityInput): Promise<DocumentRecord | null> {
  const result = await db.document.updateMany({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
    data: {
      visibilityLevel: prismaDocumentVisibilityLevelByVisibilityLevel[visibilityLevel],
      visibleToCustomer: visibilityLevel === 'customer-visible',
    },
  });

  if (result.count === 0) {
    return null;
  }

  return readDocumentAfterUpdate({
    db,
    organizationId,
    machineId,
    documentId,
  });
}

export async function markDocumentDownloadUrlIssued({
  db,
  organizationId,
  machineId,
  documentId,
  issuedAt = new Date(),
}: MarkDocumentDownloadUrlIssuedInput): Promise<DocumentRecord | null> {
  const result = await db.document.updateMany({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
    data: {
      lastDownloadUrlIssuedAt: issuedAt,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return readDocumentAfterUpdate({
    db,
    organizationId,
    machineId,
    documentId,
  });
}
