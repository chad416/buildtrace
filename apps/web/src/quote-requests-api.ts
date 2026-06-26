import type { QuoteRequestStatus, QuoteRequestType } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type QuoteRequestApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly sparePartId: string | null;
  readonly ticketId: string | null;
  readonly type: QuoteRequestType;
  readonly title: string;
  readonly description: string | null;
  readonly quotedPrice: string | null;
  readonly currency: string;
  readonly status: QuoteRequestStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListQuoteRequestsResponse = {
  readonly quoteRequests: readonly QuoteRequestApiModel[];
};

export type CreateQuoteRequestInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly title: string;
  readonly type?: QuoteRequestType;
  readonly description?: string | null;
  readonly sparePartId?: string | null;
  readonly ticketId?: string | null;
  readonly currency?: string;
  readonly accessToken: string;
};

export type ListQuoteRequestsByMachineInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type UpdateQuoteRequestStatusInput = {
  readonly organizationId: string;
  readonly quoteRequestId: string;
  readonly status: QuoteRequestStatus;
  readonly quotedPrice?: string | number | null;
  readonly currency?: string;
  readonly accessToken: string;
};

export type QuoteRequestsFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function createAuthorizationHeader(accessToken: string): string {
  return `Bearer ${normalizeRequiredText('Access token', accessToken)}`;
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

function normalizeOptionalNullableDecimal(
  value: string | number | null | undefined,
): string | number | null | undefined {
  if (value === undefined || value === null || typeof value === 'number') {
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

function addOptionalText(
  body: Record<string, unknown>,
  name: string,
  value: string | undefined,
): void {
  const normalizedValue = normalizeOptionalText(value);

  if (normalizedValue !== undefined) {
    body[name] = normalizedValue;
  }
}

function addOptionalNullableText(
  body: Record<string, unknown>,
  name: string,
  value: string | null | undefined,
): void {
  const normalizedValue = normalizeOptionalNullableText(value);

  if (normalizedValue !== undefined) {
    body[name] = normalizedValue;
  }
}

function addOptionalNullableDecimal(
  body: Record<string, unknown>,
  name: string,
  value: string | number | null | undefined,
): void {
  const normalizedValue = normalizeOptionalNullableDecimal(value);

  if (normalizedValue !== undefined) {
    body[name] = normalizedValue;
  }
}

export async function createQuoteRequest(
  input: CreateQuoteRequestInput,
  fetcher: QuoteRequestsFetcher = fetch,
): Promise<QuoteRequestApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/quote-requests/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    title: normalizeRequiredText('Title', input.title),
  };

  if (input.type !== undefined) {
    body.type = input.type;
  }

  addOptionalNullableText(body, 'description', input.description);
  addOptionalNullableText(body, 'sparePartId', input.sparePartId);
  addOptionalNullableText(body, 'ticketId', input.ticketId);
  addOptionalText(body, 'currency', input.currency);

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<QuoteRequestApiModel>(response);
}

export async function listQuoteRequestsByMachine(
  input: ListQuoteRequestsByMachineInput,
  fetcher: QuoteRequestsFetcher = fetch,
): Promise<ListQuoteRequestsResponse> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/quote-requests/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);

  url.searchParams.set(
    'organizationId',
    normalizeRequiredText('Organization ID', input.organizationId),
  );

  const response = await fetcher(url, {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<ListQuoteRequestsResponse>(response);
}

export async function updateQuoteRequestStatus(
  input: UpdateQuoteRequestStatusInput,
  fetcher: QuoteRequestsFetcher = fetch,
): Promise<QuoteRequestApiModel> {
  const quoteRequestId = normalizeRequiredText('Quote request ID', input.quoteRequestId);
  const url = new URL(`/quote-requests/${encodeURIComponent(quoteRequestId)}/status`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    status: input.status,
  };

  addOptionalNullableDecimal(body, 'quotedPrice', input.quotedPrice);
  addOptionalText(body, 'currency', input.currency);

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<QuoteRequestApiModel>(response);
}
