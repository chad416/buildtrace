'use server';

import { machineStatuses, type MachineStatus } from '@buildtrace/shared';
import { redirect } from 'next/navigation';

import { createMachineRecord, type CreateMachineRecordApiInput } from '@/machine-records-api';
import { readMachineRecordsSession } from '@/machine-records-session';

function formatActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown machine creation error.';
}

function redirectWithError(locale: string, message: string): never {
  redirect(`/${locale}/machines?machineCreateError=${encodeURIComponent(message)}`);
}

function readRequiredFormText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);

  if (typeof value !== 'string') {
    throw new Error(`${label} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

function readOptionalFormText(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readOptionalMachineStatus(formData: FormData): MachineStatus | undefined {
  const status = readOptionalFormText(formData, 'status');

  if (!status) {
    return undefined;
  }

  if (!machineStatuses.includes(status as MachineStatus)) {
    throw new Error(`Machine status is not supported: ${status}`);
  }

  return status as MachineStatus;
}

export async function createMachineRecordAction(locale: string, formData: FormData): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(redirectLocale, 'Machine creation needs a signed-in workspace.');
  }

  try {
    const deliveryDate = readOptionalFormText(formData, 'deliveryDate');
    const plcType = readOptionalFormText(formData, 'plcType');
    const hmiType = readOptionalFormText(formData, 'hmiType');
    const status = readOptionalMachineStatus(formData);

    const input: CreateMachineRecordApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      customerId: readRequiredFormText(formData, 'customerId', 'Customer'),
      machineModelId: readRequiredFormText(formData, 'machineModelId', 'Machine model'),
      machineName: readRequiredFormText(formData, 'machineName', 'Machine name'),
      serialNumber: readRequiredFormText(formData, 'serialNumber', 'Serial number'),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(plcType ? { plcType } : {}),
      ...(hmiType ? { hmiType } : {}),
      ...(status ? { status } : {}),
    };

    await createMachineRecord(input);
  } catch (error) {
    redirectWithError(redirectLocale, formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?machineCreate=created`);
}
