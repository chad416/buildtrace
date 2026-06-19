import type { DocumentCategory, DocumentVisibilityLevel } from './index';
import {
  customerHandoverChecklistVersion,
  isCustomerExportEligibleDocument,
} from './customer-handover';

export const customerHandoverExportManifestVersion =
  'customer-handover-export-manifest-v1' as const;

export type CustomerHandoverExportCandidateDocument = {
  readonly id: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly checksum: string;
  readonly category: DocumentCategory;
  readonly visibilityLevel: DocumentVisibilityLevel;
  readonly visibleToCustomer: boolean;
};

export type PrivateCustomerHandoverExportManifestEntry = {
  readonly documentId: string;
  readonly fileName: string;
  readonly storagePath: string;
  readonly checksum: string;
  readonly category: DocumentCategory;
  readonly visibilityLevel: 'customer-visible';
  readonly visibleToCustomer: true;
};

export type PrivateCustomerHandoverExportManifest = {
  readonly manifestVersion: typeof customerHandoverExportManifestVersion;
  readonly checklistVersion: typeof customerHandoverChecklistVersion;
  readonly documents: readonly PrivateCustomerHandoverExportManifestEntry[];
};

export type CustomerHandoverExportStorageScope = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
};

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(fieldName + ' is required.');
  }

  return normalizedValue;
}

function safeStoragePathSegment(value: string, fieldName: string): string {
  const normalized = requireNonEmptyText(value, fieldName);

  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.includes('/') ||
    normalized.includes('\\') ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0);

      return code <= 31 || code === 127;
    })
  ) {
    throw new Error(fieldName + ' is not a safe export storage path segment.');
  }

  return normalized;
}

export function buildPrivateCustomerHandoverExportStoragePath({
  organizationId,
  machineId,
  exportId,
}: CustomerHandoverExportStorageScope): string {
  return [
    'organizations',
    safeStoragePathSegment(organizationId, 'organizationId'),
    'machines',
    safeStoragePathSegment(machineId, 'machineId'),
    'exports',
    safeStoragePathSegment(exportId, 'exportId'),
    'customer-handover.zip',
  ].join('/');
}

export function createPrivateCustomerHandoverExportManifest(
  documents: readonly CustomerHandoverExportCandidateDocument[],
): PrivateCustomerHandoverExportManifest {
  if (documents.length === 0) {
    throw new Error('At least one document is required for a customer handover export.');
  }

  const documentIds = new Set<string>();
  const manifestDocuments = documents.map((document) => {
    const documentId = requireNonEmptyText(document.id, 'documentId');

    if (documentIds.has(documentId)) {
      throw new Error('Duplicate export document ID: ' + documentId + '.');
    }

    documentIds.add(documentId);

    if (!isCustomerExportEligibleDocument(document)) {
      throw new Error('Document ' + documentId + ' is not customer-export eligible.');
    }

    return {
      documentId,
      fileName: requireNonEmptyText(document.fileName, 'fileName'),
      storagePath: requireNonEmptyText(document.storagePath, 'storagePath'),
      checksum: requireNonEmptyText(document.checksum, 'checksum'),
      category: document.category,
      visibilityLevel: 'customer-visible' as const,
      visibleToCustomer: true as const,
    };
  });

  manifestDocuments.sort((left, right) => left.documentId.localeCompare(right.documentId));

  return {
    manifestVersion: customerHandoverExportManifestVersion,
    checklistVersion: customerHandoverChecklistVersion,
    documents: manifestDocuments,
  };
}
