import { supportedLocales } from '@buildtrace/shared';

import { serviceTicketsCopy, type ServiceTicketsCopy } from './service-tickets-copy.js';

type FlatStringKey = Exclude<keyof ServiceTicketsCopy, 'priorityLabels' | 'statusLabels'>;

const flatRequiredKeys: readonly FlatStringKey[] = [
  'sectionTitle',
  'sectionDescription',
  'noTicketsMessage',
  'newTicketTitle',
  'titleLabel',
  'descriptionLabel',
  'priorityLabel',
  'submitButtonLabel',
  'statusLabel',
  'commentsTitle',
  'noCommentsMessage',
  'commentMessageLabel',
  'internalOnlyLabel',
  'addCommentButtonLabel',
  'downloadAttachmentLabel',
  'internalBadgeLabel',
  'createdFromPortalBadgeLabel',
  'updateStatusLabel',
  'errorTitle',
];

const priorityKeys = ['low', 'normal', 'high', 'urgent'] as const;
const statusKeys = ['open', 'under-review', 'waiting-for-buyer', 'quote-sent', 'resolved'] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runServiceTicketsCopySmokeCheck(): void {
  assert(
    Object.keys(serviceTicketsCopy).length === supportedLocales.length,
    'Service tickets copy must include every supported locale.',
  );

  for (const locale of supportedLocales) {
    const copy = serviceTicketsCopy[locale];

    for (const key of flatRequiredKeys) {
      const value = copy[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} service tickets copy is missing or empty for key: ${key}.`,
      );
    }

    for (const key of priorityKeys) {
      const value = copy.priorityLabels[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} service tickets copy is missing or empty for priorityLabels.${key}.`,
      );
    }

    for (const key of statusKeys) {
      const value = copy.statusLabels[key];
      assert(
        typeof value === 'string' && value.trim().length > 0,
        `${locale} service tickets copy is missing or empty for statusLabels.${key}.`,
      );
    }
  }
}

runServiceTicketsCopySmokeCheck();

console.info('Service tickets copy smoke check passed.');
