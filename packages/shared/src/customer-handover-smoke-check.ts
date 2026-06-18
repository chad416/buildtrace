import {
  customerHandoverChecklistVersion,
  customerHandoverRequiredCategories,
  evaluateCustomerHandoverCompleteness,
  isCustomerExportEligibleDocument,
  type CustomerHandoverDocument,
} from './index.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createDocument(
  overrides: Partial<CustomerHandoverDocument> = {},
): CustomerHandoverDocument {
  return {
    category: 'other',
    suggestedCategory: null,
    visibilityLevel: 'customer-visible',
    visibleToCustomer: true,
    ...overrides,
  };
}

function runCustomerHandoverSmokeCheck(): void {
  assert(
    customerHandoverChecklistVersion === 'customer-handover-beta-v1',
    'Checklist version drifted.',
  );

  assert(
    customerHandoverRequiredCategories.join('|') ===
      'manuals|safety-instructions|spare-parts-bom|certificates',
    'Required categories drifted.',
  );

  assert(
    new Set(customerHandoverRequiredCategories).size === customerHandoverRequiredCategories.length,
    'Checklist contains duplicate categories.',
  );

  const empty = evaluateCustomerHandoverCompleteness([]);

  assert(empty.completedCount === 0, 'Empty handover must have no completed requirements.');
  assert(empty.percentage === 0, 'Empty handover must be zero percent complete.');
  assert(
    empty.missingCategories.join('|') === customerHandoverRequiredCategories.join('|'),
    'Empty handover must report every missing category.',
  );

  assert(
    isCustomerExportEligibleDocument(createDocument()),
    'Consistently customer-visible document must be eligible.',
  );

  assert(
    !isCustomerExportEligibleDocument(createDocument({ visibleToCustomer: false })),
    'Inconsistent customer visibility must fail closed.',
  );

  for (const visibilityLevel of ['internal', 'sensitive-engineering', 'restricted'] as const) {
    assert(
      !isCustomerExportEligibleDocument(
        createDocument({ visibilityLevel, visibleToCustomer: true }),
      ),
      `${visibilityLevel} document must fail closed.`,
    );
  }

  const suggestionOnly = evaluateCustomerHandoverCompleteness([
    createDocument({ category: 'other', suggestedCategory: 'manuals' }),
  ]);

  assert(suggestionOnly.completedCount === 0, 'Suggested category must not satisfy a requirement.');

  const duplicates = evaluateCustomerHandoverCompleteness([
    createDocument({ category: 'manuals' }),
    createDocument({ category: 'manuals' }),
  ]);

  assert(duplicates.completedCount === 1, 'Duplicate categories must count once.');
  assert(duplicates.percentage === 25, 'One of four requirements must produce 25 percent.');
  assert(
    duplicates.missingCategories.join('|') === 'safety-instructions|spare-parts-bom|certificates',
    'Missing categories must retain checklist order.',
  );

  const complete = evaluateCustomerHandoverCompleteness(
    customerHandoverRequiredCategories.map((category) => createDocument({ category })),
  );

  assert(complete.completedCount === 4, 'All requirements must be completed.');
  assert(complete.missingCategories.length === 0, 'No requirements should remain missing.');
  assert(complete.percentage === 100, 'Complete handover must reach 100 percent.');
}

runCustomerHandoverSmokeCheck();

console.info('Shared customer handover smoke check passed.');
