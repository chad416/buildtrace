import type { QuoteRequestType } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type CreatePortalQuoteRequestInput = {
  readonly qrToken: string;
  readonly machineId: string;
  readonly title: string;
  readonly type?: QuoteRequestType;
  readonly description?: string | null;
  readonly sparePartId?: string | null;
  readonly currency?: string;
};

export type CreatePortalQuoteRequestResponse = {
  readonly quoteRequestId: string;
  readonly customerAccessToken: string;
};

export type PortalQuoteRequestsFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.trim() || undefined;
}

function normalizeOptionalNullableText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return value.trim() || null;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createPortalQuoteRequest(
  input: CreatePortalQuoteRequestInput,
  fetcher: PortalQuoteRequestsFetcher = fetch,
): Promise<CreatePortalQuoteRequestResponse> {
  const qrToken = normalizeRequiredText('QR token', input.qrToken);
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(
    `/quote-requests/portal/${encodeURIComponent(qrToken)}/machines/${encodeURIComponent(machineId)}`,
    apiBaseUrl,
  );
  const body: Record<string, unknown> = {
    title: normalizeRequiredText('Title', input.title),
  };
  const description = normalizeOptionalNullableText(input.description);
  const sparePartId = normalizeOptionalNullableText(input.sparePartId);
  const currency = normalizeOptionalText(input.currency);

  if (input.type !== undefined) {
    body.type = input.type;
  }

  if (description !== undefined) {
    body.description = description;
  }

  if (sparePartId !== undefined) {
    body.sparePartId = sparePartId;
  }

  if (currency !== undefined) {
    body.currency = currency;
  }

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<CreatePortalQuoteRequestResponse>(response);
}
