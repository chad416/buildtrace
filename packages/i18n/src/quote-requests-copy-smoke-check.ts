import { quoteRequestStatuses, quoteRequestTypes, supportedLocales } from '@buildtrace/shared';

import { quoteRequestsCopy, type QuoteRequestsCopy } from './quote-requests-copy.js';

type FlatStringKey = Exclude<keyof QuoteRequestsCopy, 'typeLabels' | 'statusLabels'>;

const flatRequiredKeys: readonly FlatStringKey[] = [
  'sectionTitle',
  'sectionDescription',
  'noRequestsMessage',
  'newRequestTitle',
  'titleLabel',
  'descriptionLabel',
  'typeLabel',
  'currencyLabel',
  'quotedPriceLabel',
  'submitButtonLabel',
  'statusLabel',
  'updateStatusLabel',
  'errorTitle',
  'portalSectionTitle',
  'portalSectionDescription',
  'portalSubmitLabel',
  'portalCreatedMessage',
  'portalErrorTitle',
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runQuoteRequestsCopySmokeCheck(): void {
  assert(
    Object.keys(quoteRequestsCopy).length === supportedLocales.length,
    'Quote requests copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = quoteRequestsCopy[locale];

    for (const key of flatRequiredKeys) {
      const value = copy[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} quote requests copy is missing or empty for key: ${key}.`,
      );
    }

    for (const type of quoteRequestTypes) {
      const value = copy.typeLabels[type];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} quote requests copy is missing or empty for typeLabels.${type}.`,
      );
    }

    for (const status of quoteRequestStatuses) {
      const value = copy.statusLabels[status];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} quote requests copy is missing or empty for statusLabels.${status}.`,
      );
    }
  }
}

runQuoteRequestsCopySmokeCheck();

console.info('Quote requests copy smoke check passed.');
