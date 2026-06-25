import { softwareTypes, supportedLocales } from '@buildtrace/shared';

import { softwareVersionsCopy, type SoftwareVersionsCopy } from './software-versions-copy.js';

type FlatStringKey = Exclude<keyof SoftwareVersionsCopy, 'typeLabels'>;

const flatRequiredKeys: readonly FlatStringKey[] = [
  'sectionTitle',
  'sectionDescription',
  'noVersionsMessage',
  'newVersionTitle',
  'versionNameLabel',
  'softwareTypeLabel',
  'notesLabel',
  'isDeliveredVersionLabel',
  'isCurrentKnownVersionLabel',
  'submitButtonLabel',
  'deliveredBadgeLabel',
  'currentBadgeLabel',
  'markAsCurrentLabel',
  'markAsDeliveredLabel',
  'uploadedLabel',
  'changedSinceDeliveryLabel',
  'errorTitle',
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runSoftwareVersionsCopySmokeCheck(): void {
  assert(
    Object.keys(softwareVersionsCopy).length === supportedLocales.length,
    'Software versions copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = softwareVersionsCopy[locale];

    for (const key of flatRequiredKeys) {
      const value = copy[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} software versions copy is missing or empty for key: ${key}.`,
      );
    }

    for (const key of softwareTypes) {
      const value = copy.typeLabels[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} software versions copy is missing or empty for typeLabels.${key}.`,
      );
    }
  }
}

runSoftwareVersionsCopySmokeCheck();

console.info('Software versions copy smoke check passed.');
