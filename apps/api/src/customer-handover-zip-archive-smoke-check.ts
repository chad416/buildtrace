import { createHash } from 'node:crypto';

import { type PrivateCustomerHandoverExportManifestEntry } from '@buildtrace/shared';
import { unzipSync } from 'fflate';

import {
  buildCustomerHandoverZipArchive,
  type DownloadedCustomerHandoverZipDocument,
} from './customer-handover-zip-archive.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectReject(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(name + ' should reject.');
}

function body(value: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(value, 'utf8')).buffer;
}

function checksum(value: ArrayBuffer): string {
  return createHash('sha256').update(new Uint8Array(value)).digest('hex');
}

function document(
  documentId: string,
  fileName: string,
  category: PrivateCustomerHandoverExportManifestEntry['category'],
  value: string,
): DownloadedCustomerHandoverZipDocument {
  const fileBody = body(value);

  return {
    manifestEntry: {
      documentId,
      fileName,
      storagePath:
        'organizations/org-1/machines/machine-1/documents/' + documentId + '/' + fileName,
      checksum: checksum(fileBody),
      category,
      visibilityLevel: 'customer-visible',
      visibleToCustomer: true,
    },
    fileBody,
  };
}

const documents = [
  document('document-2', 'Safety Guide.txt', 'safety-instructions', 'Safety instructions'),
  document('document-1', 'Manual.txt', 'manuals', 'Machine manual'),
];

const totalBytes = documents.reduce((total, current) => total + current.fileBody.byteLength, 0);

const inputOrder = documents.map((current) => current.manifestEntry.documentId).join('|');

const archive = await buildCustomerHandoverZipArchive({
  documents,
  maximumTotalDocumentBytes: totalBytes,
  maximumArchiveBytes: 1_000_000,
});

assert(archive.documentCount === 2, 'ZIP archive document count is incorrect.');

assert(archive.totalDocumentBytes === totalBytes, 'ZIP archive aggregate byte count is incorrect.');

assert(
  archive.archiveByteLength === archive.archiveBody.byteLength,
  'ZIP archive byte length is incorrect.',
);

assert(
  archive.archiveChecksum === checksum(archive.archiveBody),
  'ZIP archive checksum is incorrect.',
);

assert(
  documents.map((current) => current.manifestEntry.documentId).join('|') === inputOrder,
  'ZIP generation mutated caller order.',
);

const extracted = unzipSync(new Uint8Array(archive.archiveBody));

const extractedPaths = Object.keys(extracted).sort();

assert(
  extractedPaths.join('|') ===
    'documents/manuals/0001-Manual.txt|' + 'documents/safety-instructions/0002-Safety-Guide.txt',
  'ZIP archive contains unexpected entry paths.',
);

assert(
  Buffer.from(extracted['documents/manuals/0001-Manual.txt'] ?? []).toString('utf8') ===
    'Machine manual',
  'ZIP archive manual bytes are incorrect.',
);

assert(
  Buffer.from(extracted['documents/safety-instructions/0002-Safety-Guide.txt'] ?? []).toString(
    'utf8',
  ) === 'Safety instructions',
  'ZIP archive safety bytes are incorrect.',
);

const secondArchive = await buildCustomerHandoverZipArchive({
  documents,
  maximumTotalDocumentBytes: totalBytes,
  maximumArchiveBytes: 1_000_000,
});

assert(
  Buffer.compare(Buffer.from(archive.archiveBody), Buffer.from(secondArchive.archiveBody)) === 0,
  'ZIP archive output must be deterministic.',
);

await expectReject('empty document selection', () =>
  buildCustomerHandoverZipArchive({
    documents: [],
    maximumTotalDocumentBytes: 1,
    maximumArchiveBytes: 1,
  }),
);

await expectReject('empty downloaded document', () =>
  buildCustomerHandoverZipArchive({
    documents: [
      {
        ...documents[0]!,
        fileBody: new ArrayBuffer(0),
      },
    ],
    maximumTotalDocumentBytes: 1,
    maximumArchiveBytes: 1_000,
  }),
);

await expectReject('aggregate document limit', () =>
  buildCustomerHandoverZipArchive({
    documents,
    maximumTotalDocumentBytes: totalBytes - 1,
    maximumArchiveBytes: 1_000_000,
  }),
);

await expectReject('archive size limit', () =>
  buildCustomerHandoverZipArchive({
    documents,
    maximumTotalDocumentBytes: totalBytes,
    maximumArchiveBytes: 1,
  }),
);

await expectReject('checksum mismatch', () =>
  buildCustomerHandoverZipArchive({
    documents: [
      {
        ...documents[0]!,
        manifestEntry: {
          ...documents[0]!.manifestEntry,
          checksum: '0'.repeat(64),
        },
      },
    ],
    maximumTotalDocumentBytes: totalBytes,
    maximumArchiveBytes: 1_000_000,
  }),
);

await expectReject('malformed checksum', () =>
  buildCustomerHandoverZipArchive({
    documents: [
      {
        ...documents[0]!,
        manifestEntry: {
          ...documents[0]!.manifestEntry,
          checksum: 'not-a-sha256',
        },
      },
    ],
    maximumTotalDocumentBytes: totalBytes,
    maximumArchiveBytes: 1_000_000,
  }),
);

for (const [name, maximumTotalDocumentBytes, maximumArchiveBytes] of [
  ['zero document limit', 0, 1],
  ['unsafe document limit', Number.MAX_SAFE_INTEGER + 1, 1],
  ['zero archive limit', 1, 0],
  ['unsafe archive limit', 1, Number.MAX_SAFE_INTEGER + 1],
] as const) {
  await expectReject(name, () =>
    buildCustomerHandoverZipArchive({
      documents,
      maximumTotalDocumentBytes,
      maximumArchiveBytes,
    }),
  );
}

console.info('Customer handover ZIP archive smoke check passed.');
