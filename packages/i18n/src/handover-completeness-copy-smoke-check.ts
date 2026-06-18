import { supportedLocales } from '@buildtrace/shared';

import { handoverCompletenessCopy } from './handover-completeness-copy.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runHandoverCompletenessCopySmokeCheck(): void {
  assert(
    Object.keys(handoverCompletenessCopy).length === supportedLocales.length,
    'Handover completeness copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = handoverCompletenessCopy[locale];
    const values = Object.values(copy);

    assert(
      values.length === 7,
      `${locale} handover completeness copy has the wrong number of fields.`,
    );

    for (const value of values) {
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} handover completeness copy contains an empty value.`,
      );
    }
  }
}

runHandoverCompletenessCopySmokeCheck();

console.info('Handover completeness copy smoke check passed.');
