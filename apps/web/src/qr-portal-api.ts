import type { Fetcher } from './document-records-api';

export type GetQrPortalMachineApiInput = {
  readonly qrToken: string;
};

export type QrPortalMachineApiModel = {
  readonly machineId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly portalDefaultLocale: string;
};

export type QrPortalDocumentApiModel = {
  readonly id: string;
  readonly fileName: string;
  readonly category: string;
  readonly language: string;
  readonly uploadedAt: string;
};

export type ListQrPortalDocumentsResponse = {
  readonly documents: readonly QrPortalDocumentApiModel[];
};

export type ListQrPortalDocumentsApiInput = {
  readonly qrToken: string;
};

export type CreateQrPortalDocumentDownloadUrlApiInput = {
  readonly qrToken: string;
  readonly documentId: string;
};

export type QrPortalDocumentDownloadUrlResponse = {
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

export type QrPortalFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function buildQrPortalMachineUrl(input: GetQrPortalMachineApiInput): URL {
  const qrToken = normalizeRequiredText('QR token', input.qrToken);

  return new URL(`/qr-portal/portal/${encodeURIComponent(qrToken)}`, apiBaseUrl);
}

function buildQrPortalDocumentsUrl(input: ListQrPortalDocumentsApiInput): URL {
  const qrToken = normalizeRequiredText('QR token', input.qrToken);

  return new URL(`/qr-portal/portal/${encodeURIComponent(qrToken)}/documents`, apiBaseUrl);
}

function buildQrPortalDocumentDownloadUrl(input: CreateQrPortalDocumentDownloadUrlApiInput): URL {
  const qrToken = normalizeRequiredText('QR token', input.qrToken);
  const documentId = normalizeRequiredText('Document ID', input.documentId);

  return new URL(
    `/qr-portal/portal/${encodeURIComponent(qrToken)}/documents/${encodeURIComponent(documentId)}/download-url`,
    apiBaseUrl,
  );
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function getQrPortalMachine(
  input: GetQrPortalMachineApiInput,
  fetcher: QrPortalFetcher = fetch,
): Promise<QrPortalMachineApiModel> {
  const response = await fetcher(buildQrPortalMachineUrl(input), {
    method: 'GET',
  });

  return parseJsonResponse<QrPortalMachineApiModel>(response);
}

export async function listQrPortalDocuments(
  input: ListQrPortalDocumentsApiInput,
  fetcher: QrPortalFetcher = fetch,
): Promise<ListQrPortalDocumentsResponse> {
  const response = await fetcher(buildQrPortalDocumentsUrl(input), {
    method: 'GET',
  });

  return parseJsonResponse<ListQrPortalDocumentsResponse>(response);
}

export async function createQrPortalDocumentDownloadUrl(
  input: CreateQrPortalDocumentDownloadUrlApiInput,
  fetcher: QrPortalFetcher = fetch,
): Promise<QrPortalDocumentDownloadUrlResponse> {
  const response = await fetcher(buildQrPortalDocumentDownloadUrl(input), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  return parseJsonResponse<QrPortalDocumentDownloadUrlResponse>(response);
}
