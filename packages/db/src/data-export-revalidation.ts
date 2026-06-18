import {
  customerHandoverChecklistVersion,
  customerHandoverExportManifestVersion,
  documentCategories,
  type DocumentCategory,
} from '@buildtrace/shared';

import type { Prisma, PrismaClient } from './generated/prisma/client';
import {
  DataExportAudience,
  DataExportResult,
  DocumentCategory as PrismaDocumentCategory,
  DocumentVisibilityLevel,
} from './generated/prisma/enums';

export type DataExportRevalidationDatabase = Pick<PrismaClient, '$transaction'>;

export type RevalidatedCustomerHandoverExportDocument = {
  readonly documentId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly checksum: string;
  readonly category: DocumentCategory;
  readonly visibilityLevel: 'customer-visible';
  readonly visibleToCustomer: true;
};

export type RevalidatedCustomerHandoverExport = {
  readonly exportId: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly checklistVersion: typeof customerHandoverChecklistVersion;
  readonly documents: readonly RevalidatedCustomerHandoverExportDocument[];
};

export type RevalidatePendingCustomerHandoverExportInput = {
  readonly db: DataExportRevalidationDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
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
function required(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(fieldName + ' is required.');
  }

  return normalized;
}

function objectValue(value: unknown, fieldName: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(fieldName + ' must be an object.');
  }

  return value as Record<string, unknown>;
}

function textValue(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(fieldName + ' must be a string.');
  }

  return required(value, fieldName);
}

function categoryValue(value: unknown): DocumentCategory {
  if (typeof value !== 'string' || !(documentCategories as readonly string[]).includes(value)) {
    throw new Error('Manifest document category is invalid.');
  }

  return value as DocumentCategory;
}
function parseManifest(
  value: Prisma.JsonValue,
): readonly RevalidatedCustomerHandoverExportDocument[] {
  const manifest = objectValue(value, 'Export manifest');

  if (manifest.manifestVersion !== customerHandoverExportManifestVersion) {
    throw new Error('Export manifest version is unsupported.');
  }

  if (manifest.checklistVersion !== customerHandoverChecklistVersion) {
    throw new Error('Export manifest checklist version is unsupported.');
  }

  if (!Array.isArray(manifest.documents) || manifest.documents.length === 0) {
    throw new Error('Export manifest must contain at least one document.');
  }

  const documentIds = new Set<string>();

  return manifest.documents.map((value, index) => {
    const document = objectValue(value, 'Export manifest document ' + index);

    const documentId = textValue(document.documentId, 'manifest documentId');

    if (documentIds.has(documentId)) {
      throw new Error('Export manifest contains duplicate document IDs.');
    }

    documentIds.add(documentId);

    if (document.visibilityLevel !== 'customer-visible' || document.visibleToCustomer !== true) {
      throw new Error('Export manifest contains a non-customer-visible document.');
    }

    return {
      documentId,
      fileName: textValue(document.fileName, 'manifest fileName'),
      storagePath: textValue(document.storagePath, 'manifest storagePath'),
      checksum: textValue(document.checksum, 'manifest checksum'),
      category: categoryValue(document.category),
      visibilityLevel: 'customer-visible' as const,
      visibleToCustomer: true as const,
    };
  });
}
function storagePathMatchesScope(
  organizationId: string,
  machineId: string,
  storagePath: string,
): boolean {
  const requiredPrefix =
    'organizations/' + organizationId + '/machines/' + machineId + '/documents/';

  return storagePath.startsWith(requiredPrefix) && storagePath.length > requiredPrefix.length;
}
export async function revalidatePendingCustomerHandoverExport({
  db,
  organizationId,
  machineId,
  exportId,
}: RevalidatePendingCustomerHandoverExportInput): Promise<RevalidatedCustomerHandoverExport> {
  const organization = required(organizationId, 'organizationId');
  const machine = required(machineId, 'machineId');
  const dataExportId = required(exportId, 'exportId');

  return db.$transaction(async (transaction) => {
    const dataExport = await transaction.dataExport.findFirst({
      where: {
        id: dataExportId,
        organizationId: organization,
        machineId: machine,
        audience: DataExportAudience.CUSTOMER_HANDOVER,
        result: DataExportResult.PENDING,
        completedAt: null,
      },
    });

    if (!dataExport) {
      throw new Error('Pending customer handover export was not found in this tenant scope.');
    }

    if (dataExport.checklistVersion !== customerHandoverChecklistVersion) {
      throw new Error('Export history checklist version is unsupported.');
    }

    const manifestDocuments = parseManifest(dataExport.manifest);

    const documents = await transaction.document.findMany({
      where: {
        id: {
          in: manifestDocuments.map((document) => document.documentId),
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

    if (documents.length !== manifestDocuments.length) {
      throw new Error(
        'One or more export documents no longer belong to this organization and machine.',
      );
    }

    const currentById = new Map(documents.map((document) => [document.id, document]));

    for (const manifestDocument of manifestDocuments) {
      const current = currentById.get(manifestDocument.documentId);

      if (
        !current ||
        !storagePathMatchesScope(organization, machine, current.storagePath) ||
        current.fileName !== manifestDocument.fileName ||
        current.storagePath !== manifestDocument.storagePath ||
        current.checksum !== manifestDocument.checksum ||
        categories[current.category] !== manifestDocument.category ||
        current.visibilityLevel !== DocumentVisibilityLevel.CUSTOMER_VISIBLE ||
        current.visibleToCustomer !== true
      ) {
        throw new Error(
          'Document ' + manifestDocument.documentId + ' changed after export creation.',
        );
      }
    }

    return {
      exportId: dataExport.id,
      organizationId: dataExport.organizationId,
      machineId: dataExport.machineId,
      checklistVersion: customerHandoverChecklistVersion,
      documents: manifestDocuments,
    };
  });
}
