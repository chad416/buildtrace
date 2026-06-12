import { machineStatuses, type MachineStatus as MachineStatusValue } from '@buildtrace/shared';

export type MachineRecordApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly status: MachineStatusValue;
  readonly deliveryDate: string | null;
  readonly plcType: string | null;
  readonly hmiType: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customer: {
    readonly id: string;
    readonly companyName: string;
  };
  readonly machineModel: {
    readonly id: string;
    readonly modelName: string;
  };
};

export type CreateMachineRecordApiInput = {
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly accessToken: string;
  readonly deliveryDate?: string;
  readonly plcType?: string;
  readonly hmiType?: string;
  readonly status?: MachineStatusValue;
};

export type ListMachineRecordsApiInput = {
  readonly organizationId: string;
  readonly accessToken: string;
};

export type GetMachineRecordApiInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

type MachineRecordResponseBody = {
  readonly machine: MachineRecordApiModel;
};

type MachineRecordsResponseBody = {
  readonly machines: readonly MachineRecordApiModel[];
};

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

type Fetcher = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function buildApiUrl(path: string): URL {
  return new URL(path, apiBaseUrl);
}

function createAuthorizationHeader(accessToken: string): string {
  return `Bearer ${normalizeRequiredText('Access token', accessToken)}`;
}

function assertMachineStatus(status: MachineStatusValue | undefined): void {
  if (!status) {
    return;
  }

  if (!machineStatuses.includes(status)) {
    throw new Error(`Machine status is not supported: ${status}`);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createMachineRecord(
  input: CreateMachineRecordApiInput,
  fetcher: Fetcher = fetch,
): Promise<MachineRecordApiModel> {
  assertMachineStatus(input.status);

  const deliveryDate = normalizeOptionalText(input.deliveryDate);
  const plcType = normalizeOptionalText(input.plcType);
  const hmiType = normalizeOptionalText(input.hmiType);

  const requestBody = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    customerId: normalizeRequiredText('Customer ID', input.customerId),
    machineModelId: normalizeRequiredText('Machine model ID', input.machineModelId),
    machineName: normalizeRequiredText('Machine name', input.machineName),
    serialNumber: normalizeRequiredText('Machine serial number', input.serialNumber),
    ...(deliveryDate ? { deliveryDate } : {}),
    ...(plcType ? { plcType } : {}),
    ...(hmiType ? { hmiType } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  const response = await fetcher(buildApiUrl('/machine-records/machines'), {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseBody = await parseJsonResponse<MachineRecordResponseBody>(response);

  return responseBody.machine;
}

export async function listMachineRecords(
  input: ListMachineRecordsApiInput,
  fetcher: Fetcher = fetch,
): Promise<readonly MachineRecordApiModel[]> {
  const url = buildApiUrl('/machine-records/machines');
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

  const responseBody = await parseJsonResponse<MachineRecordsResponseBody>(response);

  return responseBody.machines;
}

export async function getMachineRecord(
  input: GetMachineRecordApiInput,
  fetcher: Fetcher = fetch,
): Promise<MachineRecordApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = buildApiUrl(`/machine-records/machines/${encodeURIComponent(machineId)}`);
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

  const responseBody = await parseJsonResponse<MachineRecordResponseBody>(response);

  return responseBody.machine;
}
