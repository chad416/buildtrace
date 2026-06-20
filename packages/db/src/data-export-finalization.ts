import {
  activityLogActions,
  buildPrivateCustomerHandoverExportStoragePath,
  buildPrivateCustomerHandoverPdfSummaryStoragePath,
  customerHandoverExportManifestVersion,
} from '@buildtrace/shared';

import { Prisma, type DataExport, type PrismaClient } from './generated/prisma/client';
import { DataExportAudience, DataExportResult } from './generated/prisma/enums';
import { revalidatePendingCustomerHandoverExportInTransaction } from './data-export-revalidation.js';

export type DataExportFinalizationDatabase = Pick<PrismaClient, '$transaction'>;

export type CompletedCustomerHandoverExportArtifact = Omit<
  DataExport,
  | 'artifactStoragePath'
  | 'archiveChecksum'
  | 'archiveByteLength'
  | 'documentCount'
  | 'totalDocumentBytes'
  | 'completedAt'
> & {
  readonly artifactStoragePath: string;
  readonly archiveChecksum: string;
  readonly archiveByteLength: number;
  readonly documentCount: number;
  readonly totalDocumentBytes: number;
  readonly completedAt: Date;
};

export type FinalizeCustomerHandoverExportSuccessInput = {
  readonly db: DataExportFinalizationDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
  readonly actorUserId: string;
  readonly artifactStoragePath: string;
  readonly archiveChecksum: string;
  readonly archiveByteLength: number;
  readonly documentCount: number;
  readonly totalDocumentBytes: number;
  readonly pdfStoragePath?: string;
  readonly completedAt?: Date;
};

export type GetSucceededCustomerHandoverExportArtifactInput = {
  readonly db: DataExportFinalizationDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
};

const canonicalSha256Pattern = /^[a-f0-9]{64}$/;

function required(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(fieldName + ' is required.');
  }

  return normalized;
}

function positiveDatabaseInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) {
    throw new Error(fieldName + ' must be a positive 32-bit integer.');
  }

  return value;
}

function validCompletionDate(completedAt: Date | undefined): Date {
  const resolved = completedAt ?? new Date();

  if (Number.isNaN(resolved.getTime())) {
    throw new Error('completedAt must be a valid date.');
  }

  return resolved;
}

function completedArtifact(
  dataExport: DataExport | null,
): CompletedCustomerHandoverExportArtifact | null {
  if (
    !dataExport ||
    dataExport.result !== DataExportResult.SUCCEEDED ||
    dataExport.artifactStoragePath === null ||
    dataExport.archiveChecksum === null ||
    dataExport.archiveByteLength === null ||
    dataExport.documentCount === null ||
    dataExport.totalDocumentBytes === null ||
    dataExport.completedAt === null
  ) {
    return null;
  }

  if (!canonicalSha256Pattern.test(dataExport.archiveChecksum)) {
    return null;
  }

  if (
    dataExport.archiveByteLength <= 0 ||
    dataExport.documentCount <= 0 ||
    dataExport.totalDocumentBytes <= 0
  ) {
    return null;
  }

  const expectedStoragePath = buildPrivateCustomerHandoverExportStoragePath({
    organizationId: dataExport.organizationId,
    machineId: dataExport.machineId,
    exportId: dataExport.id,
  });

  if (dataExport.artifactStoragePath !== expectedStoragePath) {
    return null;
  }

  return {
    ...dataExport,
    artifactStoragePath: dataExport.artifactStoragePath,
    archiveChecksum: dataExport.archiveChecksum,
    archiveByteLength: dataExport.archiveByteLength,
    documentCount: dataExport.documentCount,
    totalDocumentBytes: dataExport.totalDocumentBytes,
    completedAt: dataExport.completedAt,
  };
}

export async function finalizeCustomerHandoverExportSuccess({
  db,
  organizationId,
  machineId,
  exportId,
  actorUserId,
  artifactStoragePath,
  archiveChecksum,
  archiveByteLength,
  documentCount,
  totalDocumentBytes,
  pdfStoragePath,
  completedAt,
}: FinalizeCustomerHandoverExportSuccessInput): Promise<CompletedCustomerHandoverExportArtifact> {
  const organization = required(organizationId, 'organizationId');
  const machine = required(machineId, 'machineId');
  const dataExportId = required(exportId, 'exportId');
  const actor = required(actorUserId, 'actorUserId');
  const storagePath = required(artifactStoragePath, 'artifactStoragePath');
  const checksum = required(archiveChecksum, 'archiveChecksum');
  const archiveBytes = positiveDatabaseInteger(archiveByteLength, 'archiveByteLength');
  const documents = positiveDatabaseInteger(documentCount, 'documentCount');
  const totalBytes = positiveDatabaseInteger(totalDocumentBytes, 'totalDocumentBytes');
  const completionDate = validCompletionDate(completedAt);
  const summaryStoragePath = pdfStoragePath
    ? required(pdfStoragePath, 'pdfStoragePath')
    : undefined;

  const expectedStoragePath = buildPrivateCustomerHandoverExportStoragePath({
    organizationId: organization,
    machineId: machine,
    exportId: dataExportId,
  });

  if (storagePath !== expectedStoragePath) {
    throw new Error('artifactStoragePath does not match the export tenant scope.');
  }

  if (
    summaryStoragePath &&
    summaryStoragePath !==
      buildPrivateCustomerHandoverPdfSummaryStoragePath({
        organizationId: organization,
        machineId: machine,
        exportId: dataExportId,
      })
  ) {
    throw new Error('pdfStoragePath does not match the export tenant scope.');
  }

  if (!canonicalSha256Pattern.test(checksum)) {
    throw new Error('archiveChecksum must be a canonical SHA-256 checksum.');
  }

  return db.$transaction(
    async (transaction) => {
      const revalidated = await revalidatePendingCustomerHandoverExportInTransaction({
        transaction,
        organizationId: organization,
        machineId: machine,
        exportId: dataExportId,
      });

      if (revalidated.documents.length !== documents) {
        throw new Error('documentCount does not match the revalidated export manifest.');
      }

      const manifest: Prisma.InputJsonObject = {
        manifestVersion: customerHandoverExportManifestVersion,
        checklistVersion: revalidated.checklistVersion,
        documents: revalidated.documents.map((document) => ({
          ...document,
        })),
        ...(summaryStoragePath ? { pdfStoragePath: summaryStoragePath } : {}),
      };

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
          result: DataExportResult.SUCCEEDED,
          artifactStoragePath: storagePath,
          archiveChecksum: checksum,
          archiveByteLength: archiveBytes,
          documentCount: documents,
          totalDocumentBytes: totalBytes,
          manifest,
          completedAt: completionDate,
        },
      });

      if (update.count !== 1) {
        throw new Error('Pending customer handover export was not found in this tenant scope.');
      }

      await transaction.activityLog.create({
        data: {
          organizationId: organization,
          actorUserId: actor,
          action: activityLogActions.customerHandoverExportCreated,
          targetType: 'data-export',
          targetId: dataExportId,
        },
      });

      const reloaded = await transaction.dataExport.findFirst({
        where: {
          id: dataExportId,
          organizationId: organization,
          machineId: machine,
          audience: DataExportAudience.CUSTOMER_HANDOVER,
          result: DataExportResult.SUCCEEDED,
        },
      });

      const completed = completedArtifact(reloaded);

      if (!completed) {
        throw new Error('Completed export artifact history could not be reloaded.');
      }

      return completed;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function getSucceededCustomerHandoverExportArtifact({
  db,
  organizationId,
  machineId,
  exportId,
}: GetSucceededCustomerHandoverExportArtifactInput): Promise<CompletedCustomerHandoverExportArtifact | null> {
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
        result: DataExportResult.SUCCEEDED,
      },
    });

    return completedArtifact(dataExport);
  });
}
