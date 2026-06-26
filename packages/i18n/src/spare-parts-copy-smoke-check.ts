import { sparePartCriticalities, supportedLocales } from '@buildtrace/shared';

import { sparePartsCopy, type SparePartsCopy } from './spare-parts-copy.js';

type FlatStringKey = Exclude<keyof SparePartsCopy, 'criticalityLabels'>;

const flatRequiredKeys: readonly FlatStringKey[] = [
  'sectionTitle',
  'sectionDescription',
  'noPartsMessage',
  'newPartTitle',
  'partNameLabel',
  'manufacturerLabel',
  'partNumberLabel',
  'quantityLabel',
  'categoryLabel',
  'criticalityLabel',
  'estimatedPriceLabel',
  'currencyLabel',
  'customerVisiblePriceLabel',
  'notesLabel',
  'submitButtonLabel',
  'criticalBadgeLabel',
  'errorTitle',
  'updateButtonLabel',
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runSparePartsCopySmokeCheck(): void {
  assert(
    Object.keys(sparePartsCopy).length === supportedLocales.length,
    'Spare parts copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = sparePartsCopy[locale];

    for (const key of flatRequiredKeys) {
      const value = copy[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} spare parts copy is missing or empty for key: ${key}.`,
      );
    }

    for (const criticality of sparePartCriticalities) {
      const value = copy.criticalityLabels[criticality];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} spare parts copy is missing or empty for criticalityLabels.${criticality}.`,
      );
    }
  }
}

runSparePartsCopySmokeCheck();

console.info('Spare parts copy smoke check passed.');
