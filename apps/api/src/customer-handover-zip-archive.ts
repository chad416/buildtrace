import { createHash } from 'node:crypto';

import {
  createCustomerHandoverZipEntries,
  type PrivateCustomerHandoverExportManifestEntry,
} from '@buildtrace/shared';
import { zip } from 'fflate';

export type DownloadedCustomerHandoverZipDocument = {
  readonly manifestEntry: PrivateCustomerHandoverExportManifestEntry;
  readonly fileBody: ArrayBuffer;
};

export type BuildCustomerHandoverZipArchiveInput = {
  readonly documents: readonly DownloadedCustomerHandoverZipDocument[];
  readonly maximumTotalDocumentBytes: number;
  readonly maximumArchiveBytes: number;
};

export type CustomerHandoverZipArchive = {
  readonly archiveBody: ArrayBuffer;
  readonly archiveByteLength: number;
  readonly archiveChecksum: string;
  readonly documentCount: number;
  readonly totalDocumentBytes: number;
};

const canonicalSha256Pattern = /^[a-f0-9]{64}$/;
const deterministicZipModificationTime = new Date(1980, 0, 1, 0, 0, 0, 0);

function positiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(fieldName + ' must be a positive safe integer.');
  }

  return value;
}

function sha256Hex(value: ArrayBuffer): string {
  return createHash('sha256').update(new Uint8Array(value)).digest('hex');
}

function exactArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = Uint8Array.from(value);

  return copy.buffer;
}

async function createZipBytes(
  files: Record<
    string,
    [
      Uint8Array,
      {
        readonly level: 0;
        readonly mtime: Date;
      },
    ]
  >,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(
      files,
      {
        level: 0,
      },
      (error, archive) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(archive);
      },
    );
  });
}

export async function buildCustomerHandoverZipArchive({
  documents,
  maximumTotalDocumentBytes,
  maximumArchiveBytes,
}: BuildCustomerHandoverZipArchiveInput): Promise<CustomerHandoverZipArchive> {
  const totalLimit = positiveSafeInteger(maximumTotalDocumentBytes, 'maximumTotalDocumentBytes');

  const archiveLimit = positiveSafeInteger(maximumArchiveBytes, 'maximumArchiveBytes');

  const entryPlans = createCustomerHandoverZipEntries(
    documents.map((document) => document.manifestEntry),
  );

  const documentById = new Map(
    documents.map((document) => [document.manifestEntry.documentId, document]),
  );

  const archiveFiles: Record<
    string,
    [
      Uint8Array,
      {
        readonly level: 0;
        readonly mtime: Date;
      },
    ]
  > = {};

  let totalDocumentBytes = 0;

  for (const entryPlan of entryPlans) {
    const document = documentById.get(entryPlan.documentId);

    if (!document) {
      throw new Error('Downloaded ZIP document is missing: ' + entryPlan.documentId + '.');
    }

    const byteLength = document.fileBody.byteLength;

    if (byteLength === 0) {
      throw new Error('Downloaded ZIP document must not be empty: ' + entryPlan.documentId + '.');
    }

    if (byteLength > totalLimit - totalDocumentBytes) {
      throw new Error('Customer handover documents exceed the aggregate size limit.');
    }

    const expectedChecksum = document.manifestEntry.checksum;

    if (!canonicalSha256Pattern.test(expectedChecksum)) {
      throw new Error(
        'Document ' + entryPlan.documentId + ' has a non-canonical SHA-256 checksum.',
      );
    }

    const actualChecksum = sha256Hex(document.fileBody);

    if (actualChecksum !== expectedChecksum) {
      throw new Error(
        'Document ' + entryPlan.documentId + ' failed packaging checksum verification.',
      );
    }

    totalDocumentBytes += byteLength;

    archiveFiles[entryPlan.entryPath] = [
      new Uint8Array(document.fileBody),
      {
        level: 0,
        mtime: deterministicZipModificationTime,
      },
    ];
  }

  const archiveBytes = await createZipBytes(archiveFiles);

  if (archiveBytes.byteLength === 0) {
    throw new Error('Customer handover ZIP generation returned an empty archive.');
  }

  if (archiveBytes.byteLength > archiveLimit) {
    throw new Error('Customer handover ZIP exceeds the archive size limit.');
  }

  const archiveBody = exactArrayBuffer(archiveBytes);

  return {
    archiveBody,
    archiveByteLength: archiveBody.byteLength,
    archiveChecksum: sha256Hex(archiveBody),
    documentCount: entryPlans.length,
    totalDocumentBytes,
  };
}
