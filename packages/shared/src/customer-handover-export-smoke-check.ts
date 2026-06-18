import {
  createPrivateCustomerHandoverExportManifest,
  customerHandoverChecklistVersion,
  customerHandoverExportManifestVersion,
  type CustomerHandoverExportCandidateDocument,
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

function createDocument(
  overrides: Partial<CustomerHandoverExportCandidateDocument> = {},
): CustomerHandoverExportCandidateDocument {
  return {
    id: 'document-1',
    fileName: 'Manual.pdf',
    storagePath: 'organizations/org-1/machines/machine-1/documents/document-1/Manual.pdf',
    checksum: 'checksum-1',
    category: 'manuals',
    visibilityLevel: 'customer-visible',
    visibleToCustomer: true,
    ...overrides,
  };
}

function runCustomerHandoverExportSmokeCheck(): void {
  const selectedDocuments = [
    createDocument({
      id: 'document-2',
      fileName: 'Safety.pdf',
      storagePath: 'organizations/org-1/machines/machine-1/documents/document-2/Safety.pdf',
      checksum: 'checksum-2',
      category: 'safety-instructions',
    }),
    createDocument(),
  ];
  const manifest = createPrivateCustomerHandoverExportManifest(selectedDocuments);

  assert(
    manifest.manifestVersion === customerHandoverExportManifestVersion,
    'Manifest version was not preserved.',
  );
  assert(
    manifest.checklistVersion === customerHandoverChecklistVersion,
    'Checklist version was not preserved.',
  );
  assert(
    manifest.documents.map((document) => document.documentId).join('|') === 'document-1|document-2',
    'Manifest documents must use deterministic ID order.',
  );
  assert(
    selectedDocuments.map((document) => document.id).join('|') === 'document-2|document-1',
    'Manifest creation must not mutate caller order.',
  );

  const firstDocument = manifest.documents[0];

  assert(firstDocument !== undefined, 'Manifest must contain the selected documents.');
  assert(
    firstDocument.storagePath ===
      'organizations/org-1/machines/machine-1/documents/document-1/Manual.pdf',
    'Private manifest must snapshot the storage reference.',
  );
  assert(firstDocument.checksum === 'checksum-1', 'Manifest must snapshot the checksum.');
  assert(firstDocument.category === 'manuals', 'Manifest must snapshot the effective category.');
  assert(
    firstDocument.visibilityLevel === 'customer-visible' &&
      firstDocument.visibleToCustomer === true,
    'Manifest must snapshot both customer-exposure guards.',
  );

  expectThrows('empty document selection', () => createPrivateCustomerHandoverExportManifest([]));
  expectThrows('duplicate document IDs', () =>
    createPrivateCustomerHandoverExportManifest([
      createDocument(),
      createDocument({ fileName: 'Duplicate.pdf' }),
    ]),
  );
  expectThrows('internal document selection', () =>
    createPrivateCustomerHandoverExportManifest([
      createDocument({ visibilityLevel: 'internal', visibleToCustomer: false }),
    ]),
  );
  expectThrows('inconsistent customer visibility', () =>
    createPrivateCustomerHandoverExportManifest([createDocument({ visibleToCustomer: false })]),
  );

  for (const [fieldName, overrides] of [
    ['documentId', { id: '   ' }],
    ['fileName', { fileName: '   ' }],
    ['storagePath', { storagePath: '   ' }],
    ['checksum', { checksum: '   ' }],
  ] as const) {
    expectThrows('missing ' + fieldName, () =>
      createPrivateCustomerHandoverExportManifest([createDocument(overrides)]),
    );
  }
}

runCustomerHandoverExportSmokeCheck();

console.info('Shared customer handover export manifest smoke check passed.');
