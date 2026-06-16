import type {
  DocumentCategory,
  DocumentClassificationSource,
  DocumentClassificationStatus,
  DocumentClassificationSuggestion,
  DocumentLanguageCode,
  DocumentVisibilityLevel,
} from '@buildtrace/shared';
import {
  classifyDocumentFromFilename,
  getDefaultDocumentVisibilityForCategory,
} from '@buildtrace/shared';

import type { PrismaClient } from './generated/prisma/client';
import {
  DocumentCategory as PrismaDocumentCategory,
  DocumentClassificationSource as PrismaDocumentClassificationSource,
  DocumentClassificationStatus as PrismaDocumentClassificationStatus,
  DocumentLanguage as PrismaDocumentLanguage,
  DocumentVisibilityLevel as PrismaDocumentVisibilityLevel,
} from './generated/prisma/enums';

type PrismaDocumentCategoryValue =
  (typeof PrismaDocumentCategory)[keyof typeof PrismaDocumentCategory];

type PrismaDocumentClassificationStatusValue =
  (typeof PrismaDocumentClassificationStatus)[keyof typeof PrismaDocumentClassificationStatus];

type PrismaDocumentClassificationSourceValue =
  (typeof PrismaDocumentClassificationSource)[keyof typeof PrismaDocumentClassificationSource];

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
  readonly suggestedCategory: PrismaDocumentCategoryValue | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: PrismaDocumentClassificationStatusValue;
  readonly classificationSource: PrismaDocumentClassificationSourceValue | null;
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
  readonly suggestedCategory: DocumentCategory | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: DocumentClassificationStatus;
  readonly classificationSource: DocumentClassificationSource | null;
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

export type ApplyDocumentClassificationSuggestionInput = GetDocumentByMachineInput;

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

const prismaDocumentClassificationStatusByStatus = {
  unclassified: PrismaDocumentClassificationStatus.UNCLASSIFIED,
  classified: PrismaDocumentClassificationStatus.CLASSIFIED,
  'needs-review': PrismaDocumentClassificationStatus.NEEDS_REVIEW,
  'manually-confirmed': PrismaDocumentClassificationStatus.MANUALLY_CONFIRMED,
} satisfies Record<DocumentClassificationStatus, PrismaDocumentClassificationStatusValue>;

const prismaDocumentClassificationSourceBySource = {
  'filename-type': PrismaDocumentClassificationSource.FILENAME_TYPE,
  manual: PrismaDocumentClassificationSource.MANUAL,
} satisfies Record<DocumentClassificationSource, PrismaDocumentClassificationSourceValue>;

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

const classificationStatusByPrismaDocumentClassificationStatus = Object.fromEntries(
  Object.entries(prismaDocumentClassificationStatusByStatus).map(
    ([classificationStatus, prismaClassificationStatus]) => [
      prismaClassificationStatus,
      classificationStatus,
    ],
  ),
) as Record<PrismaDocumentClassificationStatusValue, DocumentClassificationStatus>;

const classificationSourceByPrismaDocumentClassificationSource = Object.fromEntries(
  Object.entries(prismaDocumentClassificationSourceBySource).map(
    ([classificationSource, prismaClassificationSource]) => [
      prismaClassificationSource,
      classificationSource,
    ],
  ),
) as Record<PrismaDocumentClassificationSourceValue, DocumentClassificationSource>;

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

function toPrismaDocumentClassificationData(suggestion: DocumentClassificationSuggestion): {
  readonly suggestedCategory: PrismaDocumentCategoryValue | null;
  readonly classificationConfidence: number | null;
  readonly classificationStatus: PrismaDocumentClassificationStatusValue;
  readonly classificationSource: PrismaDocumentClassificationSourceValue | null;
} {
  return {
    suggestedCategory: suggestion.suggestedCategory
      ? prismaDocumentCategoryByCategory[suggestion.suggestedCategory]
      : null,
    classificationConfidence: suggestion.classificationConfidence,
    classificationStatus:
      prismaDocumentClassificationStatusByStatus[suggestion.classificationStatus],
    classificationSource: suggestion.classificationSource
      ? prismaDocumentClassificationSourceBySource[suggestion.classificationSource]
      : null,
  };
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
    suggestedCategory: record.suggestedCategory
      ? categoryByPrismaDocumentCategory[record.suggestedCategory]
      : null,
    classificationConfidence: record.classificationConfidence,
    classificationStatus:
      classificationStatusByPrismaDocumentClassificationStatus[record.classificationStatus],
    classificationSource: record.classificationSource
      ? classificationSourceByPrismaDocumentClassificationSource[record.classificationSource]
      : null,
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
  const normalizedFileName = requireNonEmptyText(fileName, 'fileName');
  const normalizedFileType = requireNonEmptyText(fileType, 'fileType');
  const defaultVisibility = getDefaultDocumentVisibilityForCategory(category);
  const classificationSuggestion = classifyDocumentFromFilename({
    fileName: normalizedFileName,
    fileType: normalizedFileType,
  });

  const record = await db.document.create({
    data: {
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
      fileName: normalizedFileName,
      storagePath: requireNonEmptyText(storagePath, 'storagePath'),
      fileType: normalizedFileType,
      category: prismaDocumentCategoryByCategory[category],
      ...toPrismaDocumentClassificationData(classificationSuggestion),
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

export async function applyDocumentClassificationSuggestion({
  db,
  organizationId,
  machineId,
  documentId,
}: ApplyDocumentClassificationSuggestionInput): Promise<DocumentRecord | null> {
  const existingRecord = await db.document.findFirst({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
    },
  });

  if (!existingRecord) {
    return null;
  }

  const document = toDocumentRecord(existingRecord);

  if (document.classificationStatus === 'manually-confirmed') {
    return document;
  }

  const suggestion = classifyDocumentFromFilename({
    fileName: document.fileName,
    fileType: document.fileType,
  });

  const result = await db.document.updateMany({
    where: {
      id: requireNonEmptyText(documentId, 'documentId'),
      organizationId: requireNonEmptyText(organizationId, 'organizationId'),
      machineId: requireNonEmptyText(machineId, 'machineId'),
      classificationStatus: {
        not: PrismaDocumentClassificationStatus.MANUALLY_CONFIRMED,
      },
    },
    data: toPrismaDocumentClassificationData(suggestion),
  });

  if (result.count === 0) {
    return readDocumentAfterUpdate({
      db,
      organizationId,
      machineId,
      documentId,
    });
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
