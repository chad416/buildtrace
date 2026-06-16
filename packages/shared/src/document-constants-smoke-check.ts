import {
  activityLogActions,
  defaultDocumentVisibility,
  documentCategories,
  documentClassificationNeedsReviewThreshold,
  documentClassificationSources,
  documentClassificationStatuses,
  documentVisibilityLevels,
  fileVisibilityLevels,
  getDefaultDocumentVisibilityForCategory,
  sensitiveEngineeringDocumentCategories,
} from './index.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueValues(name: string, values: readonly string[]): void {
  const uniqueValues = new Set(values);

  assert(uniqueValues.size === values.length, `${name} contains duplicate values.`);
}

function runSharedDocumentConstantsSmokeCheck(): void {
  assertUniqueValues('fileVisibilityLevels', fileVisibilityLevels);
  assertUniqueValues('documentVisibilityLevels', documentVisibilityLevels);
  assertUniqueValues('documentCategories', documentCategories);
  assertUniqueValues('documentClassificationStatuses', documentClassificationStatuses);
  assertUniqueValues('documentClassificationSources', documentClassificationSources);
  assertUniqueValues(
    'sensitiveEngineeringDocumentCategories',
    sensitiveEngineeringDocumentCategories,
  );

  assert(
    fileVisibilityLevels.includes('public'),
    'Generic file visibility levels should keep public for non-document future use.',
  );

  assert(
    !documentVisibilityLevels.includes('public' as never),
    'Phase 4 document visibility levels must not include public.',
  );

  assert(
    documentClassificationStatuses.join('|') ===
      'unclassified|classified|needs-review|manually-confirmed',
    'Document classification statuses drifted.',
  );

  assert(
    documentClassificationSources.join('|') === 'filename-type|manual',
    'Document classification sources drifted.',
  );

  assert(
    documentClassificationNeedsReviewThreshold === 70,
    'Document classification needs-review threshold drifted.',
  );

  assert(
    defaultDocumentVisibility.visibleToCustomer === false,
    'Documents must default to not customer-visible.',
  );

  assert(
    defaultDocumentVisibility.visibilityLevel === 'internal',
    'Documents must default to internal visibility.',
  );

  for (const category of sensitiveEngineeringDocumentCategories) {
    const defaults = getDefaultDocumentVisibilityForCategory(category);

    assert(
      defaults.visibleToCustomer === false,
      `${category} documents must default to not customer-visible.`,
    );

    assert(
      defaults.visibilityLevel === 'sensitive-engineering',
      `${category} documents must default to sensitive-engineering visibility.`,
    );
  }

  assert(
    activityLogActions.documentUploaded === 'document.uploaded',
    'Document upload action drifted.',
  );

  assert(
    activityLogActions.documentCategoryChanged === 'document.category_changed',
    'Document category-change action drifted.',
  );

  assert(
    activityLogActions.documentVisibilityChanged === 'document.visibility_changed',
    'Document visibility-change action drifted.',
  );

  assert(
    activityLogActions.documentDownloadUrlIssued === 'document.download_url_issued',
    'Document signed URL issuance action drifted.',
  );

  assert(
    activityLogActions.documentClassificationConfirmed === 'document.classification_confirmed',
    'Document classification confirmation action drifted.',
  );
}

runSharedDocumentConstantsSmokeCheck();

console.info('Shared document constants smoke check passed.');
