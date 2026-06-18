import { dataExportAudiences, dataExportResults } from '@buildtrace/shared';

import { DataExportAudience, DataExportResult } from './generated/prisma/enums';

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
      name +
        ' drifted. Expected ' +
        [...expected].sort().join(', ') +
        ' but found ' +
        [...actual].sort().join(', ') +
        '.',
    );
  }
}

function runDataExportSchemaDriftCheck(): void {
  assertSameValues(
    'DataExportAudience',
    dataExportAudiences,
    Object.values(DataExportAudience).map(toKebabCase),
  );

  assertSameValues(
    'DataExportResult',
    dataExportResults,
    Object.values(DataExportResult).map(toLowerCase),
  );
}

runDataExportSchemaDriftCheck();

console.info('Data export schema drift check passed.');
