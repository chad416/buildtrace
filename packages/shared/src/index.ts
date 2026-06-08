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

export const defaultDocumentVisibility = {
  visibleToCustomer: false,
  visibilityLevel: 'internal',
} as const;
