'use server';

import { isSupportedLocale, qrPortalCopy, quoteRequestsCopy, type Locale } from '@buildtrace/i18n';
import {
  quoteRequestTypes,
  ticketPriorities,
  type QuoteRequestType,
  type TicketPriority,
} from '@buildtrace/shared';
import { redirect } from 'next/navigation';

import { createPortalQuoteRequest } from '@/portal-quote-requests-api';
import { createPortalServiceTicket } from '@/portal-service-tickets-api';
import { createQrPortalDocumentDownloadUrl } from '@/qr-portal-api';

function readRequiredFormText(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== 'string') {
    throw new Error(`${name} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function readLocale(formData: FormData): Locale {
  const value = formData.get('locale');
  const normalizedValue = typeof value === 'string' ? value.trim() : '';

  return isSupportedLocale(normalizedValue) ? normalizedValue : 'en';
}

function readOptionalFormText(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if (value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readOptionalPortalQuoteRequestType(
  formData: FormData,
  locale: Locale,
): QuoteRequestType | undefined {
  const type = readOptionalFormText(formData, 'type');

  if (type === undefined) {
    return undefined;
  }

  if (!(quoteRequestTypes as readonly string[]).includes(type)) {
    throw new Error(quoteRequestsCopy[locale].portalErrorTitle);
  }

  return type as QuoteRequestType;
}

export async function createQrPortalDocumentDownloadUrlAction(formData: FormData): Promise<void> {
  let qrToken = '';
  let documentId = '';
  let locale = 'en';
  let redirectUrl = '';

  try {
    qrToken = readRequiredFormText(formData, 'qrToken');
    documentId = readRequiredFormText(formData, 'documentId');
    const rawLocale = formData.get('locale');
    if (typeof rawLocale === 'string' && rawLocale.trim()) {
      locale = rawLocale.trim();
    }

    const result = await createQrPortalDocumentDownloadUrl({
      qrToken,
      documentId,
    });
    redirectUrl = result.downloadUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown download error.';
    const queryParams = new URLSearchParams({
      lang: locale,
      downloadError: message,
    });
    redirectUrl = `/portal/${encodeURIComponent(qrToken)}?${queryParams.toString()}`;
  }

  redirect(redirectUrl);
}

export async function createPortalServiceTicketAction(formData: FormData): Promise<void> {
  let qrToken = '';
  let machineId = '';
  const locale = readLocale(formData);
  let redirectUrl = '';

  try {
    qrToken = readRequiredFormText(formData, 'qrToken');
    machineId = readRequiredFormText(formData, 'machineId');
    const title = readRequiredFormText(formData, 'title');
    const description = readRequiredFormText(formData, 'description');
    const rawPriority = formData.get('priority');
    let priority: TicketPriority | undefined;

    if (typeof rawPriority === 'string' && rawPriority.trim()) {
      const normalizedPriority = rawPriority.trim();

      if (!(ticketPriorities as readonly string[]).includes(normalizedPriority)) {
        throw new Error(qrPortalCopy[locale].ticketErrorTitle);
      }

      priority = normalizedPriority as TicketPriority;
    }

    const result = await createPortalServiceTicket({
      qrToken,
      machineId,
      title,
      description,
      ...(priority !== undefined ? { priority } : {}),
    });
    const queryParams = new URLSearchParams({
      ticketCreated: '1',
      ticketRef: result.customerAccessToken,
      lang: locale,
    });
    redirectUrl = `/portal/${encodeURIComponent(qrToken)}?${queryParams.toString()}`;
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : qrPortalCopy[locale].ticketErrorTitle;
    const queryParams = new URLSearchParams({
      ticketError: message,
      lang: locale,
    });
    redirectUrl = `/portal/${encodeURIComponent(qrToken)}?${queryParams.toString()}`;
  }

  redirect(redirectUrl);
}

export async function createPortalQuoteRequestAction(formData: FormData): Promise<void> {
  let qrToken = '';
  let machineId = '';
  const locale = readLocale(formData);
  let redirectUrl = '';

  try {
    qrToken = readRequiredFormText(formData, 'qrToken');
    machineId = readRequiredFormText(formData, 'machineId');
    const title = readRequiredFormText(formData, 'title');
    const type = readOptionalPortalQuoteRequestType(formData, locale);
    const description = readOptionalFormText(formData, 'description');
    const currency = readOptionalFormText(formData, 'currency');

    const result = await createPortalQuoteRequest({
      qrToken,
      machineId,
      title,
      ...(type !== undefined ? { type } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(currency !== undefined ? { currency } : {}),
    });
    const queryParams = new URLSearchParams({
      quoteCreated: '1',
      quoteRef: result.customerAccessToken,
      lang: locale,
    });
    redirectUrl = `/portal/${encodeURIComponent(qrToken)}?${queryParams.toString()}`;
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : quoteRequestsCopy[locale].portalErrorTitle;
    const queryParams = new URLSearchParams({
      quoteError: message,
      lang: locale,
    });
    redirectUrl = `/portal/${encodeURIComponent(qrToken)}?${queryParams.toString()}`;
  }

  redirect(redirectUrl);
}
