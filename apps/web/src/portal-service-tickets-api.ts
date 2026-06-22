import type { TicketPriority } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type CreatePortalServiceTicketInput = {
  readonly qrToken: string;
  readonly machineId: string;
  readonly title: string;
  readonly description: string;
  readonly priority?: TicketPriority;
};

export type CreatePortalServiceTicketResponse = {
  readonly ticketId: string;
  readonly customerAccessToken: string;
};

export type PortalServiceTicketsFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createPortalServiceTicket(
  input: CreatePortalServiceTicketInput,
  fetcher: PortalServiceTicketsFetcher = fetch,
): Promise<CreatePortalServiceTicketResponse> {
  const qrToken = normalizeRequiredText('QR token', input.qrToken);
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(
    `/service-tickets/portal/${encodeURIComponent(qrToken)}/machines/${encodeURIComponent(machineId)}`,
    apiBaseUrl,
  );
  const body: Record<string, unknown> = {
    title: normalizeRequiredText('Title', input.title),
    description: normalizeRequiredText('Description', input.description),
  };

  if (input.priority !== undefined) {
    body.priority = input.priority;
  }

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<CreatePortalServiceTicketResponse>(response);
}
