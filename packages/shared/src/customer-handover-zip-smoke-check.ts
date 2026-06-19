import {
  createCustomerHandoverZipEntries,
  type PrivateCustomerHandoverExportManifestEntry,
} from './index.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectThrows(name: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(name + ' should throw.');
}

function document(
  overrides: Partial<PrivateCustomerHandoverExportManifestEntry> = {},
): PrivateCustomerHandoverExportManifestEntry {
  return {
    documentId: 'document-1',
    fileName: 'Manual.pdf',
    storagePath: 'organizations/org-1/machines/machine-1/documents/document-1/Manual.pdf',
    checksum: 'checksum-1',
    category: 'manuals',
    visibilityLevel: 'customer-visible',
    visibleToCustomer: true,
    ...overrides,
  };
}

const source = [
  document({
    documentId: 'document-2',
    fileName: 'Safety: Guide?.pdf',
    category: 'safety-instructions',
  }),
  document(),
];

const entries = createCustomerHandoverZipEntries(source);

assert(
  entries.map((entry) => entry.documentId).join('|') === 'document-1|document-2',
  'ZIP entries must use deterministic document-ID order.',
);

assert(
  entries.map((entry) => entry.entryPath).join('|') ===
    'documents/manuals/0001-Manual.pdf|' + 'documents/safety-instructions/0002-Safety-Guide.pdf',
  'ZIP entries did not use the expected portable paths.',
);

assert(
  source.map((entry) => entry.documentId).join('|') === 'document-2|document-1',
  'ZIP entry planning must not mutate caller order.',
);

const duplicateNames = createCustomerHandoverZipEntries([
  document(),
  document({
    documentId: 'document-2',
  }),
]);

assert(
  new Set(duplicateNames.map((entry) => entry.entryPath)).size === 2,
  'Duplicate filenames must receive unique ZIP paths.',
);

const reservedName = createCustomerHandoverZipEntries([
  document({
    fileName: 'CON.pdf',
  }),
]);

assert(
  reservedName[0]?.entryPath === 'documents/manuals/0001-_CON.pdf',
  'Windows reserved filenames must be made portable.',
);

expectThrows('forward-slash traversal', () =>
  createCustomerHandoverZipEntries([
    document({
      fileName: '../secret.pdf',
    }),
  ]),
);

expectThrows('backslash traversal', () =>
  createCustomerHandoverZipEntries([
    document({
      fileName: '..\\secret.pdf',
    }),
  ]),
);

expectThrows('duplicate document IDs', () =>
  createCustomerHandoverZipEntries([
    document(),
    document({
      fileName: 'Other.pdf',
    }),
  ]),
);

expectThrows('empty ZIP selection', () => createCustomerHandoverZipEntries([]));

console.info('Customer handover ZIP entry smoke check passed.');
