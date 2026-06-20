import type { SupportedLocale } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type CreateCustomerHandoverExportApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly documentIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly accessToken: string;
};

export type CreateCustomerHandoverExportDownloadUrlApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly exportId: string;
  readonly accessToken: string;
};

export type CreateCustomerHandoverExportResponse = {
  readonly export: {
    readonly id: string;
    readonly result: 'succeeded';
    readonly checklistVersion: string;
    readonly documentCount: number;
    readonly totalDocumentBytes: number;
    readonly archiveByteLength: number;
    readonly createdAt: string;
    readonly completedAt: string;
  };
  readonly sensitiveCategories: readonly string[];
  readonly pdfStoragePath?: string;
};

export type CreateCustomerHandoverExportDownloadUrlResponse = {
  readonly exportId: string;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

export type CreateCustomerHandoverExportPdfDownloadUrlApiInput =
  CreateCustomerHandoverExportDownloadUrlApiInput;

export type CreateCustomerHandoverExportPdfDownloadUrlResponse =
  CreateCustomerHandoverExportDownloadUrlResponse;

export type CustomerHandoverExportFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function buildCreateCustomerHandoverExportUrl(
  input: Pick<CreateCustomerHandoverExportApiInput, 'machineId'>,
): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  return new URL(
    `/document-records/machines/${encodeURIComponent(machineId)}/customer-handover-exports`,
    apiBaseUrl,
  );
}

function buildCreateCustomerHandoverExportDownloadUrlUrl(
  input: Pick<CreateCustomerHandoverExportDownloadUrlApiInput, 'machineId' | 'exportId'>,
): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const exportId = normalizeRequiredText('Export ID', input.exportId);
  return new URL(
    `/document-records/machines/${encodeURIComponent(machineId)}/customer-handover-exports/${encodeURIComponent(exportId)}/download-url`,
    apiBaseUrl,
  );
}

function buildCreateCustomerHandoverExportPdfDownloadUrlUrl(
  input: Pick<CreateCustomerHandoverExportPdfDownloadUrlApiInput, 'machineId' | 'exportId'>,
): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const exportId = normalizeRequiredText('Export ID', input.exportId);
  return new URL(
    `/document-records/machines/${encodeURIComponent(machineId)}/customer-handover-exports/${encodeURIComponent(exportId)}/pdf-download-url`,
    apiBaseUrl,
  );
}

function createAuthorizationHeader(accessToken: string): string {
  return `Bearer ${normalizeRequiredText('Access token', accessToken)}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createCustomerHandoverExport(
  input: CreateCustomerHandoverExportApiInput,
  fetcher: CustomerHandoverExportFetcher = fetch,
): Promise<CreateCustomerHandoverExportResponse> {
  const organizationId = normalizeRequiredText('Organization ID', input.organizationId);
  const documentIds = input.documentIds.map((id) => normalizeRequiredText('Document ID', id));

  const response = await fetcher(buildCreateCustomerHandoverExportUrl(input), {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      documentIds,
      locale: input.locale,
    }),
  });

  return parseJsonResponse<CreateCustomerHandoverExportResponse>(response);
}

export type ListCustomerHandoverExportsApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type ListCustomerHandoverExportsResponse = {
  readonly exports: ReadonlyArray<{
    readonly id: string;
    readonly checklistVersion: string;
    readonly documentCount: number;
    readonly archiveByteLength: number;
    readonly totalDocumentBytes: number;
    readonly createdAt: string;
    readonly completedAt: string;
  }>;
};

function buildListCustomerHandoverExportsUrl(
  input: Pick<ListCustomerHandoverExportsApiInput, 'machineId' | 'organizationId'>,
): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const organizationId = normalizeRequiredText('Organization ID', input.organizationId);
  const url = new URL(
    `/document-records/machines/${encodeURIComponent(machineId)}/customer-handover-exports`,
    apiBaseUrl,
  );
  url.searchParams.set('organizationId', organizationId);
  return url;
}

export async function listCustomerHandoverExports(
  input: ListCustomerHandoverExportsApiInput,
  fetcher: CustomerHandoverExportFetcher = fetch,
): Promise<ListCustomerHandoverExportsResponse> {
  const response = await fetcher(buildListCustomerHandoverExportsUrl(input), {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<ListCustomerHandoverExportsResponse>(response);
}

export async function createCustomerHandoverExportDownloadUrl(
  input: CreateCustomerHandoverExportDownloadUrlApiInput,
  fetcher: CustomerHandoverExportFetcher = fetch,
): Promise<CreateCustomerHandoverExportDownloadUrlResponse> {
  const organizationId = normalizeRequiredText('Organization ID', input.organizationId);

  const response = await fetcher(buildCreateCustomerHandoverExportDownloadUrlUrl(input), {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
    }),
  });

  return parseJsonResponse<CreateCustomerHandoverExportDownloadUrlResponse>(response);
}

export async function createCustomerHandoverExportPdfDownloadUrl(
  input: CreateCustomerHandoverExportPdfDownloadUrlApiInput,
  fetcher: CustomerHandoverExportFetcher = fetch,
): Promise<CreateCustomerHandoverExportPdfDownloadUrlResponse> {
  const organizationId = normalizeRequiredText('Organization ID', input.organizationId);

  const response = await fetcher(buildCreateCustomerHandoverExportPdfDownloadUrlUrl(input), {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
    }),
  });

  return parseJsonResponse<CreateCustomerHandoverExportPdfDownloadUrlResponse>(response);
}
