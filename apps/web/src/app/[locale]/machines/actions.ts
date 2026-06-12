'use server';

import {
  machineStatuses,
  supportedLocales,
  type MachineStatus,
  type SupportedLocale,
} from '@buildtrace/shared';
import { redirect } from 'next/navigation';

import {
  createCustomer,
  createMachineModel,
  createMachineRecord,
  type CreateCustomerApiInput,
  type CreateMachineModelApiInput,
  type CreateMachineRecordApiInput,
} from '@/machine-records-api';
import { readMachineRecordsSession } from '@/machine-records-session';

function formatActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown machine record action error.';
}

function redirectWithError(locale: string, queryName: string, message: string): never {
  redirect(`/${locale}/machines?${queryName}=${encodeURIComponent(message)}`);
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

  if (value === null || typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readOptionalPreferredLocale(formData: FormData): SupportedLocale | undefined {
  const preferredLocale = readOptionalFormText(formData, 'preferredLocale');

  if (!preferredLocale) {
    return undefined;
  }

  if (!supportedLocales.includes(preferredLocale as SupportedLocale)) {
    throw new Error(`Preferred locale is not supported: ${preferredLocale}`);
  }

  return preferredLocale as SupportedLocale;
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

export async function createCustomerRecordAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'customerCreateError',
      'Customer creation needs a signed-in workspace.',
    );
  }

  try {
    const contactName = readOptionalFormText(formData, 'contactName');
    const email = readOptionalFormText(formData, 'email');
    const phone = readOptionalFormText(formData, 'phone');
    const country = readOptionalFormText(formData, 'country');
    const preferredLocale = readOptionalPreferredLocale(formData);

    const input: CreateCustomerApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      companyName: readRequiredFormText(formData, 'companyName', 'Customer company name'),
      ...(contactName ? { contactName } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(country ? { country } : {}),
      ...(preferredLocale ? { preferredLocale } : {}),
    };

    await createCustomer(input);
  } catch (error) {
    redirectWithError(redirectLocale, 'customerCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?customerCreate=created`);
}

export async function createMachineModelRecordAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'machineModelCreateError',
      'Machine model creation needs a signed-in workspace.',
    );
  }

  try {
    const description = readOptionalFormText(formData, 'description');

    const input: CreateMachineModelApiInput = {
      organizationId: session.organizationId,
      accessToken: session.accessToken,
      modelName: readRequiredFormText(formData, 'modelName', 'Machine model name'),
      ...(description ? { description } : {}),
    };

    await createMachineModel(input);
  } catch (error) {
    redirectWithError(redirectLocale, 'machineModelCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?machineModelCreate=created`);
}

export async function createMachineRecordAction(locale: string, formData: FormData): Promise<void> {
  const redirectLocale = locale.trim() || 'en';
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirectWithError(
      redirectLocale,
      'machineCreateError',
      'Machine creation needs a signed-in workspace.',
    );
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
    redirectWithError(redirectLocale, 'machineCreateError', formatActionError(error));
  }

  redirect(`/${redirectLocale}/machines?machineCreate=created`);
}
