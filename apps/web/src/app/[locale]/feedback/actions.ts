'use server';

import { ticketPriorities, type TicketPriority } from '@buildtrace/shared';
import { redirect } from 'next/navigation';

import { readMachineRecordsSession } from '@/machine-records-session';
import { createServiceTicket } from '@/service-tickets-api';

function normalizeLocale(locale: string): string {
  const normalizedLocale = locale.trim();

  return normalizedLocale || 'en';
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

function readOptionalTicketPriority(formData: FormData): TicketPriority | undefined {
  const value = formData.get('priority');

  if (value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !(ticketPriorities as readonly string[]).includes(value)) {
    throw new Error(`Priority must be one of: ${ticketPriorities.join(', ')}.`);
  }

  return value as TicketPriority;
}

function formatActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown feedback error.';
}

export async function createFeedbackTicketAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const redirectLocale = normalizeLocale(locale);
  const session = await readMachineRecordsSession();

  if (session.status === 'missing') {
    redirect(
      `/${redirectLocale}/feedback?feedbackError=${encodeURIComponent('Sign in before sending feedback.')}`,
    );
  }

  try {
    const priority = readOptionalTicketPriority(formData);

    await createServiceTicket({
      organizationId: session.organizationId,
      machineId: readRequiredFormText(formData, 'machineId', 'Machine'),
      title: readRequiredFormText(formData, 'title', 'Title'),
      description: readRequiredFormText(formData, 'description', 'Description'),
      accessToken: session.accessToken,
      ...(priority ? { priority } : {}),
    });
  } catch (error) {
    redirect(
      `/${redirectLocale}/feedback?feedbackError=${encodeURIComponent(formatActionError(error))}`,
    );
  }

  redirect(`/${redirectLocale}/feedback?feedback=created`);
}
