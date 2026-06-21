import type { Fetcher } from './document-records-api';

export type QrPortalBuilderApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type MachineQrTokenResponse = {
  readonly machineId: string;
  readonly qrToken: string;
};

export type GetMachineQrTokenResponse = {
  readonly machineId: string;
  readonly qrToken: string | null;
};

export type DisableMachineQrPortalResponse = {
  readonly machineId: string;
  readonly disabled: true;
};

export type QrPortalBuilderFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function buildMachineQrTokenUrl(input: Pick<QrPortalBuilderApiInput, 'machineId'>): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);

  return new URL(`/qr-portal/machines/${encodeURIComponent(machineId)}/qr-token`, apiBaseUrl);
}

function buildRotateMachineQrTokenUrl(input: Pick<QrPortalBuilderApiInput, 'machineId'>): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);

  return new URL(
    `/qr-portal/machines/${encodeURIComponent(machineId)}/qr-token/rotate`,
    apiBaseUrl,
  );
}

function buildDisableMachineQrPortalUrl(input: Pick<QrPortalBuilderApiInput, 'machineId'>): URL {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);

  return new URL(
    `/qr-portal/machines/${encodeURIComponent(machineId)}/qr-token/disable`,
    apiBaseUrl,
  );
}

function appendOrganizationId(url: URL, organizationId: string): URL {
  url.searchParams.set('organizationId', normalizeRequiredText('Organization ID', organizationId));

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

export async function assignMachineQrToken(
  input: QrPortalBuilderApiInput,
  fetcher: QrPortalBuilderFetcher = fetch,
): Promise<MachineQrTokenResponse> {
  const url = appendOrganizationId(buildMachineQrTokenUrl(input), input.organizationId);

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<MachineQrTokenResponse>(response);
}

export async function getMachineQrToken(
  input: QrPortalBuilderApiInput,
  fetcher: QrPortalBuilderFetcher = fetch,
): Promise<GetMachineQrTokenResponse> {
  const url = appendOrganizationId(buildMachineQrTokenUrl(input), input.organizationId);

  const response = await fetcher(url, {
    method: 'GET',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<GetMachineQrTokenResponse>(response);
}

export async function rotateMachineQrToken(
  input: QrPortalBuilderApiInput,
  fetcher: QrPortalBuilderFetcher = fetch,
): Promise<MachineQrTokenResponse> {
  const url = appendOrganizationId(buildRotateMachineQrTokenUrl(input), input.organizationId);

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<MachineQrTokenResponse>(response);
}

export async function disableMachineQrPortal(
  input: QrPortalBuilderApiInput,
  fetcher: QrPortalBuilderFetcher = fetch,
): Promise<DisableMachineQrPortalResponse> {
  const url = appendOrganizationId(buildDisableMachineQrPortalUrl(input), input.organizationId);

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
    },
  });

  return parseJsonResponse<DisableMachineQrPortalResponse>(response);
}
