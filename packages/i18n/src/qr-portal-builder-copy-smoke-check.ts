import { supportedLocales } from '@buildtrace/shared';

import { qrPortalBuilderCopy } from './qr-portal-builder-copy.js';

const requiredKeys = [
  'sectionTitle',
  'sectionDescription',
  'assignButtonLabel',
  'rotateButtonLabel',
  'disableButtonLabel',
  'qrTokenLabel',
  'portalLinkLabel',
  'noTokenMessage',
  'assignedMessage',
  'rotatedMessage',
  'disabledMessage',
  'errorTitle',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runQrPortalBuilderCopySmokeCheck(): void {
  assert(
    Object.keys(qrPortalBuilderCopy).length === supportedLocales.length,
    'QR portal builder copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = qrPortalBuilderCopy[locale];

    for (const key of requiredKeys) {
      const value = copy[key];

      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} QR portal builder copy is missing or empty for key: ${key}.`,
      );
    }
  }
}

runQrPortalBuilderCopySmokeCheck();

console.info('QR portal builder copy smoke check passed.');
