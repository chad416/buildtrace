'use server';

import { redirect } from 'next/navigation';

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
