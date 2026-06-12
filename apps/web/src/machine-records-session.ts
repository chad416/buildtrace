import { cookies } from 'next/headers';

export const machineRecordsSessionCookieNames = {
  organizationId: 'buildtrace_machine_records_organization_id',
  accessToken: 'buildtrace_machine_records_access_token',
} as const;

export type MachineRecordsSessionMissingField = keyof typeof machineRecordsSessionCookieNames;

export type MachineRecordsSession =
  | {
      readonly status: 'ready';
      readonly organizationId: string;
      readonly accessToken: string;
    }
  | {
      readonly status: 'missing';
      readonly missingFields: readonly MachineRecordsSessionMissingField[];
    };

type MachineRecordsSessionCookieValues = {
  readonly organizationId: string | null;
  readonly accessToken: string | null;
};

function normalizeOptionalCookieValue(value: string | null): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

export function resolveMachineRecordsSessionFromCookieValues({
  organizationId,
  accessToken,
}: MachineRecordsSessionCookieValues): MachineRecordsSession {
  const normalizedOrganizationId = normalizeOptionalCookieValue(organizationId);
  const normalizedAccessToken = normalizeOptionalCookieValue(accessToken);

  if (!normalizedOrganizationId && !normalizedAccessToken) {
    return {
      status: 'missing',
      missingFields: ['organizationId', 'accessToken'],
    };
  }

  if (!normalizedOrganizationId) {
    return {
      status: 'missing',
      missingFields: ['organizationId'],
    };
  }

  if (!normalizedAccessToken) {
    return {
      status: 'missing',
      missingFields: ['accessToken'],
    };
  }

  return {
    status: 'ready',
    organizationId: normalizedOrganizationId,
    accessToken: normalizedAccessToken,
  };
}

export async function readMachineRecordsSession(): Promise<MachineRecordsSession> {
  const cookieStore = await cookies();

  const organizationId =
    cookieStore.get(machineRecordsSessionCookieNames.organizationId)?.value ?? null;
  const accessToken = cookieStore.get(machineRecordsSessionCookieNames.accessToken)?.value ?? null;

  return resolveMachineRecordsSessionFromCookieValues({
    organizationId,
    accessToken,
  });
}
