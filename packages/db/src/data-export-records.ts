import {
  createPrivateCustomerHandoverExportManifest,
  type DocumentCategory,
  type DocumentVisibilityLevel,
} from '@buildtrace/shared';

import type { DataExport, Prisma, PrismaClient } from './generated/prisma/client';
import {
  DataExportAudience,
  DataExportResult,
  DocumentCategory as PrismaDocumentCategory,
  DocumentVisibilityLevel as PrismaDocumentVisibilityLevel,
} from './generated/prisma/enums';

export type DataExportRecordsDatabase = Pick<PrismaClient, '$transaction'>;

export type CreatePendingCustomerHandoverExportInput = {
  readonly db: DataExportRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly requestedByUserId: string;
  readonly documentIds: readonly string[];
};

const categories = {
  [PrismaDocumentCategory.PLC]: 'plc',
  [PrismaDocumentCategory.HMI]: 'hmi',
  [PrismaDocumentCategory.MECHANICAL_DRAWINGS]: 'mechanical-drawings',
  [PrismaDocumentCategory.ELECTRICAL_DRAWINGS]: 'electrical-drawings',
  [PrismaDocumentCategory.CAD]: 'cad',
  [PrismaDocumentCategory.MACHINE_PHOTOS]: 'machine-photos',
  [PrismaDocumentCategory.FAT]: 'fat',
  [PrismaDocumentCategory.SAT]: 'sat',
  [PrismaDocumentCategory.MANUALS]: 'manuals',
  [PrismaDocumentCategory.SAFETY_INSTRUCTIONS]: 'safety-instructions',
  [PrismaDocumentCategory.SUPPLIER_DOCUMENTS]: 'supplier-documents',
  [PrismaDocumentCategory.SPARE_PARTS_BOM]: 'spare-parts-bom',
  [PrismaDocumentCategory.CERTIFICATES]: 'certificates',
  [PrismaDocumentCategory.SERVICE_NOTES]: 'service-notes',
  [PrismaDocumentCategory.OTHER]: 'other',
} satisfies Record<
  (typeof PrismaDocumentCategory)[keyof typeof PrismaDocumentCategory],
  DocumentCategory
>;

const visibilityLevels = {
  [PrismaDocumentVisibilityLevel.CUSTOMER_VISIBLE]: 'customer-visible',
  [PrismaDocumentVisibilityLevel.INTERNAL]: 'internal',
  [PrismaDocumentVisibilityLevel.SENSITIVE_ENGINEERING]: 'sensitive-engineering',
  [PrismaDocumentVisibilityLevel.RESTRICTED]: 'restricted',
} satisfies Record<
  (typeof PrismaDocumentVisibilityLevel)[keyof typeof PrismaDocumentVisibilityLevel],
  DocumentVisibilityLevel
>;

function required(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(fieldName + ' is required.');
  }

  return normalized;
}

function normalizeDocumentIds(documentIds: readonly string[]): string[] {
  if (documentIds.length === 0) {
    throw new Error('At least one document ID is required.');
  }

  const normalized = documentIds.map((documentId) => required(documentId, 'documentId'));

  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Duplicate document IDs are not allowed.');
  }

  return normalized;
}

export async function createPendingCustomerHandoverExport({
  db,
  organizationId,
  machineId,
  requestedByUserId,
  documentIds,
}: CreatePendingCustomerHandoverExportInput): Promise<DataExport> {
  const organization = required(organizationId, 'organizationId');
  const machine = required(machineId, 'machineId');
  const requester = required(requestedByUserId, 'requestedByUserId');
  const selectedDocumentIds = normalizeDocumentIds(documentIds);

  return db.$transaction(async (transaction) => {
    const [ownedMachine, membership] = await Promise.all([
      transaction.machine.findFirst({
        where: {
          id: machine,
          organizationId: organization,
        },
        select: {
          id: true,
        },
      }),
      transaction.organizationMembership.findFirst({
        where: {
          organizationId: organization,
          appUserId: requester,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!ownedMachine) {
      throw new Error('Machine does not belong to this organization.');
    }

    if (!membership) {
      throw new Error('Requesting user is not a member of this organization.');
    }

    const documents = await transaction.document.findMany({
      where: {
        id: {
          in: selectedDocumentIds,
        },
        organizationId: organization,
        machineId: machine,
      },
      select: {
        id: true,
        fileName: true,
        storagePath: true,
        checksum: true,
        category: true,
        visibilityLevel: true,
        visibleToCustomer: true,
      },
    });

    if (documents.length !== selectedDocumentIds.length) {
      throw new Error('One or more documents do not belong to this organization and machine.');
    }

    const manifest = createPrivateCustomerHandoverExportManifest(
      documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        storagePath: document.storagePath,
        checksum: document.checksum,
        category: categories[document.category],
        visibilityLevel: visibilityLevels[document.visibilityLevel],
        visibleToCustomer: document.visibleToCustomer,
      })),
    );

    const manifestJson: Prisma.InputJsonObject = {
      manifestVersion: manifest.manifestVersion,
      checklistVersion: manifest.checklistVersion,
      documents: manifest.documents.map((document) => ({
        ...document,
      })),
    };

    return transaction.dataExport.create({
      data: {
        organizationId: organization,
        machineId: machine,
        requestedByUserId: requester,
        audience: DataExportAudience.CUSTOMER_HANDOVER,
        checklistVersion: manifest.checklistVersion,
        manifest: manifestJson,
        result: DataExportResult.PENDING,
      },
    });
  });
}

export type FailCustomerHandoverExportInput = {
  readonly db: DataExportRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
  readonly completedAt?: Date;
};

function validCompletionDate(completedAt: Date | undefined): Date {
  const resolved = completedAt ?? new Date();

  if (Number.isNaN(resolved.getTime())) {
    throw new Error('completedAt must be a valid date.');
  }

  return resolved;
}

export type ListSucceededCustomerHandoverExportsInput = {
  readonly db: DataExportRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
};

export type SucceededCustomerHandoverExportSummary = {
  readonly id: string;
  readonly checklistVersion: string;
  readonly documentCount: number;
  readonly archiveByteLength: number;
  readonly totalDocumentBytes: number;
  readonly createdAt: Date;
  readonly completedAt: Date;
};

export async function listSucceededCustomerHandoverExports({
  db,
  organizationId,
  machineId,
}: ListSucceededCustomerHandoverExportsInput): Promise<
  readonly SucceededCustomerHandoverExportSummary[]
> {
  const organization = required(organizationId, 'organizationId');
  const machine = required(machineId, 'machineId');

  const rows = await db.$transaction(async (transaction) => {
    return transaction.dataExport.findMany({
      where: {
        organizationId: organization,
        machineId: machine,
        audience: DataExportAudience.CUSTOMER_HANDOVER,
        result: DataExportResult.SUCCEEDED,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        checklistVersion: true,
        documentCount: true,
        archiveByteLength: true,
        totalDocumentBytes: true,
        createdAt: true,
        completedAt: true,
      },
    });
  });

  return rows.filter(
    (row): row is SucceededCustomerHandoverExportSummary =>
      row.documentCount !== null &&
      row.archiveByteLength !== null &&
      row.totalDocumentBytes !== null &&
      row.completedAt !== null,
  );
}

export async function failCustomerHandoverExport({
  db,
  organizationId,
  machineId,
  exportId,
  completedAt,
}: FailCustomerHandoverExportInput): Promise<DataExport> {
  const organization = required(organizationId, 'organizationId');
  const machine = required(machineId, 'machineId');
  const dataExportId = required(exportId, 'exportId');
  const completionDate = validCompletionDate(completedAt);

  return db.$transaction(async (transaction) => {
    const update = await transaction.dataExport.updateMany({
      where: {
        id: dataExportId,
        organizationId: organization,
        machineId: machine,
        audience: DataExportAudience.CUSTOMER_HANDOVER,
        result: DataExportResult.PENDING,
        completedAt: null,
      },
      data: {
        result: DataExportResult.FAILED,
        completedAt: completionDate,
      },
    });

    if (update.count !== 1) {
      throw new Error('Pending customer handover export was not found in this tenant scope.');
    }

    const failed = await transaction.dataExport.findFirst({
      where: {
        id: dataExportId,
        organizationId: organization,
        machineId: machine,
        audience: DataExportAudience.CUSTOMER_HANDOVER,
        result: DataExportResult.FAILED,
      },
    });

    if (!failed || failed.completedAt === null) {
      throw new Error('Failed export history row could not be reloaded.');
    }

    return failed;
  });
}
