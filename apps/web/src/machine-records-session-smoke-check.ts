import { cookies } from 'next/headers';

export const machineRecordsSessionCookieNames = {
  organizationId: 'buildtrace_organization_id',
  accessToken: 'buildtrace_access_token',
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
  readonly organizationId?: string | null;
  readonly accessToken?: string | null;
};

function normalizeOptionalCookieValue(value: string | null | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

export function resolveMachineRecordsSessionFromCookieValues({
  organizationId = null,
  accessToken = null,
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
console.info('Machine records session smoke check passed.');
