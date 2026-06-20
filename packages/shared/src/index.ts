export { classifyDocumentFromFilename } from './document-classifier';
export type {
  ClassifyDocumentFromFilenameInput,
  DocumentClassificationSuggestion,
} from './document-classifier';
export {
  customerHandoverChecklistVersion,
  customerHandoverRequiredCategories,
  evaluateCustomerHandoverCompleteness,
  isCustomerExportEligibleDocument,
} from './customer-handover';
export type { CustomerHandoverCompleteness, CustomerHandoverDocument } from './customer-handover';
export {
  buildPrivateCustomerHandoverExportStoragePath,
  buildPrivateCustomerHandoverPdfSummaryStoragePath,
  createPrivateCustomerHandoverExportManifest,
  customerHandoverExportManifestVersion,
} from './customer-handover-export';
export { createCustomerHandoverZipEntries } from './customer-handover-zip';
export type { CustomerHandoverZipEntry } from './customer-handover-zip';
export type {
  CustomerHandoverExportCandidateDocument,
  CustomerHandoverExportStorageScope,
  PrivateCustomerHandoverExportManifest,
  PrivateCustomerHandoverExportManifestEntry,
} from './customer-handover-export';
export const supportedLocales = ['en', 'cs', 'sk', 'pl', 'de', 'fr', 'es'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const fileVisibilityLevels = [
  'public',
  'customer-visible',
  'internal',
  'sensitive-engineering',
  'restricted',
] as const;

export type FileVisibilityLevel = (typeof fileVisibilityLevels)[number];

export const documentVisibilityLevels = [
  'customer-visible',
  'internal',
  'sensitive-engineering',
  'restricted',
] as const;

export type DocumentVisibilityLevel = (typeof documentVisibilityLevels)[number];

export const documentCategories = [
  'plc',
  'hmi',
  'mechanical-drawings',
  'electrical-drawings',
  'cad',
  'machine-photos',
  'fat',
  'sat',
  'manuals',
  'safety-instructions',
  'supplier-documents',
  'spare-parts-bom',
  'certificates',
  'service-notes',
  'other',
] as const;

export type DocumentCategory = (typeof documentCategories)[number];

export const documentLanguageCodes = [...supportedLocales, 'unknown'] as const;

export type DocumentLanguageCode = (typeof documentLanguageCodes)[number];
export const documentClassificationStatuses = [
  'unclassified',
  'classified',
  'needs-review',
  'manually-confirmed',
] as const;

export type DocumentClassificationStatus = (typeof documentClassificationStatuses)[number];

export const documentClassificationSources = ['filename-type', 'manual'] as const;

export type DocumentClassificationSource = (typeof documentClassificationSources)[number];

export const documentClassificationNeedsReviewThreshold = 70 as const;

export const dataExportAudiences = ['customer-handover'] as const;

export type DataExportAudience = (typeof dataExportAudiences)[number];

export const dataExportResults = ['pending', 'succeeded', 'failed'] as const;

export type DataExportResult = (typeof dataExportResults)[number];

export const sensitiveEngineeringDocumentCategories = [
  'plc',
  'hmi',
  'electrical-drawings',
  'cad',
] as const satisfies readonly DocumentCategory[];

export type SensitiveEngineeringDocumentCategory =
  (typeof sensitiveEngineeringDocumentCategories)[number];

export const machineStatuses = ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'ARCHIVED'] as const;

export type MachineStatus = (typeof machineStatuses)[number];

export const activityLogActions = {
  userLogin: 'user.login',
  customerCreated: 'customer.created',
  customerUpdated: 'customer.updated',
  machineModelCreated: 'machine_model.created',
  machineModelUpdated: 'machine_model.updated',
  machineCreated: 'machine.created',
  machineUpdated: 'machine.updated',
  documentUploaded: 'document.uploaded',
  documentCategoryChanged: 'document.category_changed',
  documentVisibilityChanged: 'document.visibility_changed',
  documentDownloadUrlIssued: 'document.download_url_issued',
  documentClassificationConfirmed: 'document.classification_confirmed',
  customerHandoverExportCreated: 'customer_handover_export.created',
  customerHandoverExportDownloadUrlIssued: 'customer_handover_export.download_url_issued',
} as const;

export type ActivityLogAction = (typeof activityLogActions)[keyof typeof activityLogActions];

export const defaultDocumentVisibility = {
  visibleToCustomer: false,
  visibilityLevel: 'internal',
} as const satisfies {
  readonly visibleToCustomer: false;
  readonly visibilityLevel: DocumentVisibilityLevel;
};

export function getDefaultDocumentVisibilityForCategory(category: DocumentCategory):
  | typeof defaultDocumentVisibility
  | {
      readonly visibleToCustomer: false;
      readonly visibilityLevel: 'sensitive-engineering';
    } {
  if ((sensitiveEngineeringDocumentCategories as readonly DocumentCategory[]).includes(category)) {
    return {
      visibleToCustomer: false,
      visibilityLevel: 'sensitive-engineering',
    };
  }

  return defaultDocumentVisibility;
}
