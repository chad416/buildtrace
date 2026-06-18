import type { DocumentCategory, DocumentVisibilityLevel } from './index';

export const customerHandoverChecklistVersion = 'customer-handover-beta-v1' as const;

export const customerHandoverRequiredCategories = [
  'manuals',
  'safety-instructions',
  'spare-parts-bom',
  'certificates',
] as const satisfies readonly [DocumentCategory, ...DocumentCategory[]];

export type CustomerHandoverDocument = {
  readonly category: DocumentCategory;
  readonly suggestedCategory: DocumentCategory | null;
  readonly visibilityLevel: DocumentVisibilityLevel;
  readonly visibleToCustomer: boolean;
};

export type CustomerHandoverCompleteness = {
  readonly checklistVersion: typeof customerHandoverChecklistVersion;
  readonly requiredCategories: readonly DocumentCategory[];
  readonly presentCategories: readonly DocumentCategory[];
  readonly missingCategories: readonly DocumentCategory[];
  readonly completedCount: number;
  readonly requiredCount: number;
  readonly percentage: number;
};

export function isCustomerExportEligibleDocument(
  document: Pick<CustomerHandoverDocument, 'visibilityLevel' | 'visibleToCustomer'>,
): boolean {
  return document.visibilityLevel === 'customer-visible' && document.visibleToCustomer === true;
}

export function evaluateCustomerHandoverCompleteness(
  documents: readonly CustomerHandoverDocument[],
): CustomerHandoverCompleteness {
  const requiredCategorySet = new Set<DocumentCategory>(customerHandoverRequiredCategories);
  const presentCategorySet = new Set<DocumentCategory>();

  for (const document of documents) {
    if (isCustomerExportEligibleDocument(document) && requiredCategorySet.has(document.category)) {
      presentCategorySet.add(document.category);
    }
  }

  const presentCategories = customerHandoverRequiredCategories.filter((category) =>
    presentCategorySet.has(category),
  );
  const missingCategories = customerHandoverRequiredCategories.filter(
    (category) => !presentCategorySet.has(category),
  );
  const completedCount = presentCategories.length;
  const requiredCount = customerHandoverRequiredCategories.length;

  return {
    checklistVersion: customerHandoverChecklistVersion,
    requiredCategories: customerHandoverRequiredCategories,
    presentCategories,
    missingCategories,
    completedCount,
    requiredCount,
    percentage: Math.floor((completedCount / requiredCount) * 100),
  };
}
