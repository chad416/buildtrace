import type { SparePartCriticality } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type SparePartApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly partName: string;
  readonly manufacturer: string | null;
  readonly partNumber: string | null;
  readonly quantity: number;
  readonly category: string;
  readonly criticality: SparePartCriticality;
  readonly estimatedPrice: string | null;
  readonly currency: string;
  readonly customerVisiblePrice: string | null;
  readonly sourceDocumentId: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListSparePartsResponse = {
  readonly spareParts: readonly SparePartApiModel[];
};

export type CreateSparePartInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly partName: string;
  readonly manufacturer?: string | null;
  readonly partNumber?: string | null;
  readonly quantity?: number;
  readonly category?: string;
  readonly criticality?: SparePartCriticality;
  readonly estimatedPrice?: string | number | null;
  readonly currency?: string;
  readonly internalCost?: string | number | null;
  readonly customerVisiblePrice?: string | number | null;
  readonly sourceDocumentId?: string | null;
  readonly notes?: string | null;
  readonly accessToken: string;
};

export type ListSparePartsInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type UpdateSparePartInput = {
  readonly organizationId: string;
  readonly sparePartId: string;
  readonly partName?: string;
  readonly manufacturer?: string | null;
  readonly partNumber?: string | null;
  readonly quantity?: number;
  readonly category?: string;
  readonly criticality?: SparePartCriticality;
  readonly estimatedPrice?: string | number | null;
  readonly currency?: string;
  readonly customerVisiblePrice?: string | number | null;
  readonly notes?: string | null;
  readonly accessToken: string;
};

export type SparePartsFetcher = Fetcher;

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

export async function createSparePart(
  input: CreateSparePartInput,
  fetcher: SparePartsFetcher = fetch,
): Promise<SparePartApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/spare-parts/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    partName: normalizeRequiredText('Part name', input.partName),
  };

  addOptionalNullableText(body, 'manufacturer', input.manufacturer);
  addOptionalNullableText(body, 'partNumber', input.partNumber);

  if (input.quantity !== undefined) {
    body.quantity = input.quantity;
  }

  addOptionalText(body, 'category', input.category);

  if (input.criticality !== undefined) {
    body.criticality = input.criticality;
  }

  addOptionalNullableDecimal(body, 'estimatedPrice', input.estimatedPrice);
  addOptionalText(body, 'currency', input.currency);
  addOptionalNullableDecimal(body, 'internalCost', input.internalCost);
  addOptionalNullableDecimal(body, 'customerVisiblePrice', input.customerVisiblePrice);
  addOptionalNullableText(body, 'sourceDocumentId', input.sourceDocumentId);
  addOptionalNullableText(body, 'notes', input.notes);

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<SparePartApiModel>(response);
}

export async function listSpareParts(
  input: ListSparePartsInput,
  fetcher: SparePartsFetcher = fetch,
): Promise<ListSparePartsResponse> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/spare-parts/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);

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

  return parseJsonResponse<ListSparePartsResponse>(response);
}

export async function updateSparePart(
  input: UpdateSparePartInput,
  fetcher: SparePartsFetcher = fetch,
): Promise<SparePartApiModel> {
  const sparePartId = normalizeRequiredText('Spare part ID', input.sparePartId);
  const url = new URL(`/spare-parts/${encodeURIComponent(sparePartId)}`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
  };

  addOptionalText(body, 'partName', input.partName);
  addOptionalNullableText(body, 'manufacturer', input.manufacturer);
  addOptionalNullableText(body, 'partNumber', input.partNumber);

  if (input.quantity !== undefined) {
    body.quantity = input.quantity;
  }

  addOptionalText(body, 'category', input.category);

  if (input.criticality !== undefined) {
    body.criticality = input.criticality;
  }

  addOptionalNullableDecimal(body, 'estimatedPrice', input.estimatedPrice);
  addOptionalText(body, 'currency', input.currency);
  addOptionalNullableDecimal(body, 'customerVisiblePrice', input.customerVisiblePrice);
  addOptionalNullableText(body, 'notes', input.notes);

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<SparePartApiModel>(response);
}
