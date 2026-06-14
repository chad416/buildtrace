import {
  documentCategories,
  documentLanguageCodes,
  documentVisibilityLevels,
} from '@buildtrace/shared';

import {
  DocumentCategory,
  DocumentLanguage,
  DocumentVisibilityLevel,
} from './generated/prisma/enums';

function toKebabCase(value: string): string {
  return value.toLowerCase().replaceAll('_', '-');
}

function toLowerCase(value: string): string {
  return value.toLowerCase();
}

function assertSameValues(
  name: string,
  expected: readonly string[],
  actual: readonly string[],
): void {
  const expectedKey = [...expected].sort().join('|');
  const actualKey = [...actual].sort().join('|');

  if (expectedKey !== actualKey) {
    throw new Error(
      `${name} drifted. Expected ${[...expected].sort().join(', ')} but found ${[...actual].sort().join(', ')}.`,
    );
  }
}

function runDocumentSchemaDriftCheck(): void {
  assertSameValues(
    'DocumentCategory',
    documentCategories,
    Object.values(DocumentCategory).map(toKebabCase),
  );

  assertSameValues(
    'DocumentVisibilityLevel',
    documentVisibilityLevels,
    Object.values(DocumentVisibilityLevel).map(toKebabCase),
  );

  assertSameValues(
    'DocumentLanguage',
    documentLanguageCodes,
    Object.values(DocumentLanguage).map(toLowerCase),
  );
}

runDocumentSchemaDriftCheck();

console.info('Document schema drift check passed.');
