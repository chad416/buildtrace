import { locales } from '@buildtrace/i18n';

import { machineRecordsCreateCopy } from './machine-records-create-copy.js';
import { machineRecordsPageCopy } from './machine-records-page-copy.js';

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectLeafPaths(item, prefix ? `${prefix}.${index}` : String(index)),
    );
  }

  return Object.entries(value).flatMap(([key, childValue]) =>
    collectLeafPaths(childValue, prefix ? `${prefix}.${key}` : key),
  );
}

function assertLocaleCopyParity(name: string, copyByLocale: Record<string, unknown>): void {
  const expectedLocales = [...locales].sort();
  const actualLocales = Object.keys(copyByLocale).sort();

  if (expectedLocales.join('|') !== actualLocales.join('|')) {
    throw new Error(
      `${name} locale coverage drifted. Expected ${expectedLocales.join(', ')} but found ${actualLocales.join(', ')}.`,
    );
  }

  const [baseLocale] = expectedLocales;

  if (!baseLocale) {
    throw new Error('No supported locales are configured.');
  }

  const basePaths = collectLeafPaths(copyByLocale[baseLocale]).sort();

  for (const locale of expectedLocales) {
    const localePaths = collectLeafPaths(copyByLocale[locale]).sort();

    if (basePaths.join('|') !== localePaths.join('|')) {
      throw new Error(`${name} copy shape drifted for locale ${locale}.`);
    }
  }
}

function runMachineRecordsCopySmokeCheck(): void {
  assertLocaleCopyParity('machine records page', machineRecordsPageCopy);
  assertLocaleCopyParity('machine records create', machineRecordsCreateCopy);
}

runMachineRecordsCopySmokeCheck();

console.info('Machine records copy smoke check passed.');
