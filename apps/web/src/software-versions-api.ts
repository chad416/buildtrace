import type { SoftwareType } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type SoftwareVersionApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionName: string;
  readonly softwareType: SoftwareType;
  readonly notes: string | null;
  readonly isDeliveredVersion: boolean;
  readonly isCurrentKnownVersion: boolean;
  readonly storagePath: string | null;
  readonly checksum: string | null;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListSoftwareVersionsResponse = {
  readonly versions: readonly SoftwareVersionApiModel[];
};

export type CreateSoftwareVersionInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionName: string;
  readonly softwareType: SoftwareType;
  readonly notes?: string | null;
  readonly isDeliveredVersion?: boolean;
  readonly isCurrentKnownVersion?: boolean;
  readonly accessToken: string;
};

export type ListSoftwareVersionsInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly softwareType?: SoftwareType;
  readonly accessToken: string;
};

export type MarkSoftwareVersionInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionId: string;
  readonly accessToken: string;
};

export type SoftwareVersionsFetcher = Fetcher;

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

export async function createSoftwareVersion(
  input: CreateSoftwareVersionInput,
  fetcher: SoftwareVersionsFetcher = fetch,
): Promise<SoftwareVersionApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/software-versions/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    versionName: normalizeRequiredText('Version name', input.versionName),
    softwareType: input.softwareType,
  };
  const notes = normalizeOptionalNullableText(input.notes);

  if (notes !== undefined) {
    body.notes = notes;
  }

  if (input.isDeliveredVersion !== undefined) {
    body.isDeliveredVersion = input.isDeliveredVersion;
  }

  if (input.isCurrentKnownVersion !== undefined) {
    body.isCurrentKnownVersion = input.isCurrentKnownVersion;
  }

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<SoftwareVersionApiModel>(response);
}

export async function listSoftwareVersions(
  input: ListSoftwareVersionsInput,
  fetcher: SoftwareVersionsFetcher = fetch,
): Promise<ListSoftwareVersionsResponse> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/software-versions/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);

  url.searchParams.set(
    'organizationId',
    normalizeRequiredText('Organization ID', input.organizationId),
  );

  if (input.softwareType !== undefined) {
    url.searchParams.set('softwareType', input.softwareType);
  }

  const response = await fetcher(url, {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<ListSoftwareVersionsResponse>(response);
}

export async function markVersionAsCurrent(
  input: MarkSoftwareVersionInput,
  fetcher: SoftwareVersionsFetcher = fetch,
): Promise<SoftwareVersionApiModel> {
  const versionId = normalizeRequiredText('Version ID', input.versionId);
  const url = new URL(
    `/software-versions/${encodeURIComponent(versionId)}/mark-current`,
    apiBaseUrl,
  );

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      machineId: normalizeRequiredText('Machine ID', input.machineId),
    }),
  });

  return parseJsonResponse<SoftwareVersionApiModel>(response);
}

export async function markVersionAsDelivered(
  input: MarkSoftwareVersionInput,
  fetcher: SoftwareVersionsFetcher = fetch,
): Promise<SoftwareVersionApiModel> {
  const versionId = normalizeRequiredText('Version ID', input.versionId);
  const url = new URL(
    `/software-versions/${encodeURIComponent(versionId)}/mark-delivered`,
    apiBaseUrl,
  );

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      machineId: normalizeRequiredText('Machine ID', input.machineId),
    }),
  });

  return parseJsonResponse<SoftwareVersionApiModel>(response);
}
