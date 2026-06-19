import type { DocumentCategory } from './index';
import type { PrivateCustomerHandoverExportManifestEntry } from './customer-handover-export';

export type CustomerHandoverZipEntry = {
  readonly documentId: string;
  readonly entryPath: string;
};

const maximumPortableFileNameCharacters = 120;

const windowsReservedNamePattern = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

const zipFolderByCategory = {
  plc: 'plc',
  hmi: 'hmi',
  'mechanical-drawings': 'mechanical-drawings',
  'electrical-drawings': 'electrical-drawings',
  cad: 'cad',
  'machine-photos': 'machine-photos',
  fat: 'fat',
  sat: 'sat',
  manuals: 'manuals',
  'safety-instructions': 'safety-instructions',
  'supplier-documents': 'supplier-documents',
  'spare-parts-bom': 'spare-parts-bom',
  certificates: 'certificates',
  'service-notes': 'service-notes',
  other: 'other',
} as const satisfies Record<DocumentCategory, string>;

function requiredText(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(fieldName + ' is required.');
  }

  return normalized;
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);

    return code <= 31 || code === 127;
  });
}

function portableFileName(fileName: string): string {
  const normalized = requiredText(fileName, 'ZIP document fileName').normalize('NFKC');

  if (
    normalized.includes('/') ||
    normalized.includes('\\') ||
    containsControlCharacter(normalized)
  ) {
    throw new Error('ZIP document fileName contains an unsafe path character.');
  }

  if (normalized === '.' || normalized === '..') {
    throw new Error('ZIP document fileName must not be a traversal segment.');
  }

  let safeName = normalized
    .replace(/[<>:"|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[. -]+|[. -]+$/g, '')
    .replace(/-+\./g, '.');

  if (!safeName || safeName === '.' || safeName === '..') {
    throw new Error('ZIP document fileName has no portable characters.');
  }

  if (windowsReservedNamePattern.test(safeName)) {
    safeName = '_' + safeName;
  }

  const characters = Array.from(safeName);

  if (characters.length > maximumPortableFileNameCharacters) {
    const extensionIndex = safeName.lastIndexOf('.');

    const extension =
      extensionIndex > 0 ? Array.from(safeName.slice(extensionIndex)).slice(0, 20).join('') : '';

    const stem = extensionIndex > 0 ? safeName.slice(0, extensionIndex) : safeName;

    const maximumStemLength = maximumPortableFileNameCharacters - Array.from(extension).length;

    safeName = Array.from(stem).slice(0, Math.max(1, maximumStemLength)).join('') + extension;
  }

  return safeName;
}

function compareDocumentIds(
  left: { readonly documentId: string },
  right: { readonly documentId: string },
): number {
  if (left.documentId < right.documentId) {
    return -1;
  }

  if (left.documentId > right.documentId) {
    return 1;
  }

  return 0;
}

export function createCustomerHandoverZipEntries(
  documents: readonly PrivateCustomerHandoverExportManifestEntry[],
): readonly CustomerHandoverZipEntry[] {
  if (documents.length === 0) {
    throw new Error('At least one document is required for a customer handover ZIP.');
  }

  const documentIds = new Set<string>();

  const sortedDocuments = documents
    .map((document) => {
      const documentId = requiredText(document.documentId, 'ZIP documentId');

      if (documentIds.has(documentId)) {
        throw new Error('Duplicate ZIP document ID: ' + documentId + '.');
      }

      documentIds.add(documentId);

      return {
        documentId,
        fileName: document.fileName,
        folder: zipFolderByCategory[document.category],
      };
    })
    .sort(compareDocumentIds);

  const indexWidth = Math.max(4, String(sortedDocuments.length).length);

  const entryPaths = new Set<string>();

  return sortedDocuments.map((document, index) => {
    const sequence = String(index + 1).padStart(indexWidth, '0');

    const entryPath =
      'documents/' + document.folder + '/' + sequence + '-' + portableFileName(document.fileName);

    const collisionKey = entryPath.toLowerCase();

    if (entryPaths.has(collisionKey)) {
      throw new Error('Generated ZIP entry path collision: ' + entryPath + '.');
    }

    entryPaths.add(collisionKey);

    return {
      documentId: document.documentId,
      entryPath,
    };
  });
}
