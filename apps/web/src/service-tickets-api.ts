import type { TicketAuthorType, TicketPriority, TicketStatus } from '@buildtrace/shared';

import type { Fetcher } from './document-records-api';

export type ServiceTicketApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly customerId: string | null;
  readonly title: string;
  readonly description: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly createdFromPortal: boolean;
  readonly meetingLink: string | null;
  readonly meetingNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TicketCommentApiModel = {
  readonly id: string;
  readonly organizationId: string;
  readonly ticketId: string;
  readonly authorType: TicketAuthorType;
  readonly message: string;
  readonly internalOnly: boolean;
  readonly attachmentStoragePath: string | null;
  readonly createdAt: string;
};

export type ListServiceTicketsResponse = {
  readonly tickets: readonly ServiceTicketApiModel[];
};

export type ListTicketCommentsResponse = {
  readonly comments: readonly TicketCommentApiModel[];
};

export type CreateServiceTicketInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly title: string;
  readonly description: string;
  readonly priority?: TicketPriority;
  readonly accessToken: string;
};

export type ListServiceTicketsInput = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly accessToken: string;
};

export type UpdateTicketStatusInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly status: TicketStatus;
  readonly accessToken: string;
};

export type UpdateTicketMeetingLinkInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly meetingLink?: string | null;
  readonly meetingNotes?: string | null;
  readonly accessToken: string;
};

export type AddTicketCommentInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly message: string;
  readonly internalOnly?: boolean;
  readonly accessToken: string;
};

export type ListTicketCommentsInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly accessToken: string;
};

export type CreateTicketCommentAttachmentDownloadUrlInput = {
  readonly organizationId: string;
  readonly ticketId: string;
  readonly commentId: string;
  readonly accessToken: string;
};

export type TicketCommentAttachmentDownloadUrlResponse = {
  readonly commentId: string;
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

export type ServiceTicketsFetcher = Fetcher;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function createAuthorizationHeader(accessToken: string): string {
  return `Bearer ${normalizeRequiredText('Access token', accessToken)}`;
}

function normalizeOptionalNullableText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return value.trim() || null;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(`API request failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createServiceTicket(
  input: CreateServiceTicketInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<ServiceTicketApiModel> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/service-tickets/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);

  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    title: normalizeRequiredText('Title', input.title),
    description: normalizeRequiredText('Description', input.description),
  };

  if (input.priority !== undefined) {
    body.priority = input.priority;
  }

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<ServiceTicketApiModel>(response);
}

export async function listServiceTickets(
  input: ListServiceTicketsInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<ListServiceTicketsResponse> {
  const machineId = normalizeRequiredText('Machine ID', input.machineId);
  const url = new URL(`/service-tickets/machines/${encodeURIComponent(machineId)}`, apiBaseUrl);

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

  return parseJsonResponse<ListServiceTicketsResponse>(response);
}

export async function updateTicketStatus(
  input: UpdateTicketStatusInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<ServiceTicketApiModel> {
  const ticketId = normalizeRequiredText('Ticket ID', input.ticketId);
  const url = new URL(`/service-tickets/${encodeURIComponent(ticketId)}/status`, apiBaseUrl);

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
      status: input.status,
    }),
  });

  return parseJsonResponse<ServiceTicketApiModel>(response);
}

export async function updateTicketMeetingLink(
  input: UpdateTicketMeetingLinkInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<ServiceTicketApiModel> {
  const ticketId = normalizeRequiredText('Ticket ID', input.ticketId);
  const url = new URL(`/service-tickets/${encodeURIComponent(ticketId)}/meeting`, apiBaseUrl);
  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
  };
  const meetingLink = normalizeOptionalNullableText(input.meetingLink);
  const meetingNotes = normalizeOptionalNullableText(input.meetingNotes);

  if (meetingLink !== undefined) {
    body.meetingLink = meetingLink;
  }

  if (meetingNotes !== undefined) {
    body.meetingNotes = meetingNotes;
  }

  const response = await fetcher(url, {
    method: 'PATCH',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<ServiceTicketApiModel>(response);
}

export async function addTicketComment(
  input: AddTicketCommentInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<TicketCommentApiModel> {
  const ticketId = normalizeRequiredText('Ticket ID', input.ticketId);
  const url = new URL(`/service-tickets/${encodeURIComponent(ticketId)}/comments`, apiBaseUrl);

  const body: Record<string, unknown> = {
    organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    message: normalizeRequiredText('Message', input.message),
  };

  if (input.internalOnly !== undefined) {
    body.internalOnly = input.internalOnly;
  }

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<TicketCommentApiModel>(response);
}

export async function listTicketComments(
  input: ListTicketCommentsInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<ListTicketCommentsResponse> {
  const ticketId = normalizeRequiredText('Ticket ID', input.ticketId);
  const url = new URL(`/service-tickets/${encodeURIComponent(ticketId)}/comments`, apiBaseUrl);

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

  return parseJsonResponse<ListTicketCommentsResponse>(response);
}

export async function createTicketCommentAttachmentDownloadUrl(
  input: CreateTicketCommentAttachmentDownloadUrlInput,
  fetcher: ServiceTicketsFetcher = fetch,
): Promise<TicketCommentAttachmentDownloadUrlResponse> {
  const ticketId = normalizeRequiredText('Ticket ID', input.ticketId);
  const commentId = normalizeRequiredText('Comment ID', input.commentId);
  const url = new URL(
    `/service-tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}/attachment-url`,
    apiBaseUrl,
  );

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      authorization: createAuthorizationHeader(input.accessToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: normalizeRequiredText('Organization ID', input.organizationId),
    }),
  });

  return parseJsonResponse<TicketCommentAttachmentDownloadUrlResponse>(response);
}
