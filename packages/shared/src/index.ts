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
} as const;

export type ActivityLogAction = (typeof activityLogActions)[keyof typeof activityLogActions];

export const defaultDocumentVisibility = {
  visibleToCustomer: false,
  visibilityLevel: 'internal',
} as const;
