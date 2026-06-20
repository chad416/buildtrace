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
