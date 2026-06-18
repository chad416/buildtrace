import type { CustomerHandoverCompleteness } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type GetHandoverCompletenessApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type HandoverCompletenessFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function buildHandoverCompletenessUrl(input: GetHandoverCompletenessApiInput): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(
    `/document-records/machines/${encodeURIComponent(machineId)}/handover-completeness`,
    apiBaseUrl,
  );

  url.searchParams.set(
    'organizationId',
    normalizeRequiredText('Organization ID', input.organizationId),
  );

  return url;
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

export async function getHandoverCompleteness(
  input: GetHandoverCompletenessApiInput,
  fetcher: HandoverCompletenessFetcher = fetch,
): Promise<CustomerHandoverCompleteness> {
  const response = await fetcher(buildHandoverCompletenessUrl(input), {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<CustomerHandoverCompleteness>(response);
}
