import {
  documentCategories,
  documentClassificationSources,
  documentClassificationStatuses,
  documentLanguageCodes,
  documentVisibilityLevels,
  supportedLocales,
} from '@buildtrace/shared';

import { documentLabels } from './document-labels.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertLabelMap(name: string, labels: object, expectedKeys: readonly string[]): void {
  const labelRecord = labels as Record<string, unknown>;
  const actualKeys = Object.keys(labelRecord);

  assert(actualKeys.length === expectedKeys.length, `${name} has an unexpected number of labels.`);

  for (const key of expectedKeys) {
    const value = labelRecord[key];

    assert(
      typeof value === 'string' && value.trim().length > 0,
      `${name}.${key} must be a non-empty string.`,
    );
  }

  for (const key of actualKeys) {
    assert(expectedKeys.includes(key), `${name}.${key} is not a supported key.`);
  }
}

function runDocumentLabelsSmokeCheck(): void {
  assert(
    Object.keys(documentLabels).length === supportedLocales.length,
    'Document labels must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const labels = documentLabels[locale];

    assertLabelMap(`${locale}.categories`, labels.categories, documentCategories);
    assertLabelMap(`${locale}.visibilityLevels`, labels.visibilityLevels, documentVisibilityLevels);
    assertLabelMap(`${locale}.languages`, labels.languages, documentLanguageCodes);
    assertLabelMap(
      `${locale}.classificationStatuses`,
      labels.classificationStatuses,
      documentClassificationStatuses,
    );
    assertLabelMap(
      `${locale}.classificationSources`,
      labels.classificationSources,
      documentClassificationSources,
    );
  }
}

runDocumentLabelsSmokeCheck();

console.info('Document labels smoke check passed.');
