import { supportedLocales } from '@buildtrace/shared';

import { qrPortalCopy, type QrPortalCopy } from './qr-portal-copy.js';

const requiredStringKeys = [
  'title',
  'serialLabel',
  'portalDescription',
  'documentsTitle',
  'noDocumentsMessage',
  'ticketButtonLabel',
  'feedbackButtonLabel',
  'loadingMessage',
  'notFoundMessage',
  'errorMessage',
  'languageSwitcherLabel',
  'downloadButtonLabel',
  'ticketSectionTitle',
  'ticketTitleLabel',
  'ticketDescriptionLabel',
  'ticketPriorityLabel',
  'ticketSubmitLabel',
  'ticketCreatedMessage',
  'ticketErrorTitle',
] as const satisfies readonly (keyof QrPortalCopy)[];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const locale of supportedLocales) {
  const copy = qrPortalCopy[locale];

  assert(copy !== undefined, `QR portal copy is missing for ${locale}.`);

  for (const key of requiredStringKeys) {
    assert(
      typeof copy[key] === 'string' && copy[key].trim().length > 0,
      `QR portal copy ${locale}.${key} is missing.`,
    );
  }

  for (const priority of ['low', 'normal', 'high', 'urgent'] as const) {
    assert(
      copy.priorityLabels[priority].trim().length > 0,
      `QR portal copy ${locale}.priorityLabels.${priority} is missing.`,
    );
  }

  assert(
    Object.keys(copy).length === requiredStringKeys.length + 1,
    `QR portal copy ${locale} has unexpected keys.`,
  );
}

console.info('QR portal copy smoke check passed.');
