import {
  addTicketComment,
  createTicketCommentAttachmentDownloadUrl,
  createServiceTicket,
  listServiceTickets,
  listTicketComments,
  updateTicketStatus,
  type ServiceTicketsFetcher,
} from './service-tickets-api.js';

type CapturedRequest = {
  readonly input: Parameters<ServiceTicketsFetcher>[0];
  readonly init: Parameters<ServiceTicketsFetcher>[1];
};

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

function readUrl(input: Parameters<ServiceTicketsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<ServiceTicketsFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

function readBody(init: Parameters<ServiceTicketsFetcher>[1]): Record<string, unknown> {
  const rawBody = init?.body;
  const bodyText = typeof rawBody === 'string' ? rawBody : '';
  return JSON.parse(bodyText) as Record<string, unknown>;
}

function createFetcher(
  calls: CapturedRequest[],
  responseFactory: () => Response,
): ServiceTicketsFetcher {
  return async (input, init) => {
    calls.push({ input, init });

    return responseFactory();
  };
}

const fakeTicket = {
  id: 'ticket-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  customerId: null,
  title: 'Press fault',
  description: 'Machine stopped',
  status: 'open',
  priority: 'normal',
  createdFromPortal: false,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
};

const fakeComment = {
  id: 'comment-1',
  organizationId: 'org-1',
  ticketId: 'ticket-1',
  authorType: 'builder',
  message: 'Investigating now.',
  internalOnly: false,
  attachmentStoragePath: null,
  createdAt: '2026-06-21T00:00:00.000Z',
};

async function runCreateTicketCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createServiceTicket(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      title: ' Press fault ',
      description: ' Machine stopped ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse(fakeTicket)),
  );

  assert(result.id === 'ticket-1', 'Create ticket response ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Create ticket request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/service-tickets/machines/machine-1', 'Create ticket URL was wrong.');
  assert(call.init?.method === 'POST', 'Create ticket must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Create ticket authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Create ticket must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Create ticket body organizationId was not normalized.');
  assert(body.title === 'Press fault', 'Create ticket body title was not normalized.');
  assert(
    body.description === 'Machine stopped',
    'Create ticket body description was not normalized.',
  );

  const callsWithPriority: CapturedRequest[] = [];
  await createServiceTicket(
    {
      organizationId: 'org-1',
      machineId: 'machine-1',
      title: 'Fault',
      description: 'Stopped',
      priority: 'urgent',
      accessToken: 'token-1',
    },
    createFetcher(callsWithPriority, () => createJsonResponse(fakeTicket)),
  );

  const bodyWithPriority = readBody(callsWithPriority[0]?.init);
  assert(bodyWithPriority.priority === 'urgent', 'Create ticket body priority was wrong.');

  await expectThrows('create ticket with empty machine ID', () =>
    createServiceTicket(
      {
        organizationId: 'org-1',
        machineId: '  ',
        title: 'Fault',
        description: 'Stopped',
        accessToken: 'token-1',
      },
      async () => createJsonResponse(fakeTicket),
    ),
  );
}

async function runListTicketsCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await listServiceTickets(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ tickets: [fakeTicket] })),
  );

  assert(result.tickets.length === 1, 'List tickets count was wrong.');
  assert(result.tickets[0]?.id === 'ticket-1', 'List tickets ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'List tickets request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/service-tickets/machines/machine-1', 'List tickets URL was wrong.');
  assert(
    url.searchParams.get('organizationId') === 'org-1',
    'List tickets organizationId query was not normalized.',
  );
  assert(call.init?.method === 'GET', 'List tickets must use GET.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'List tickets authorization was not normalized.',
  );

  await expectThrows('list tickets with failed response', () =>
    listServiceTickets(
      { organizationId: 'org-1', machineId: 'machine-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runUpdateStatusCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await updateTicketStatus(
    {
      organizationId: ' org-1 ',
      ticketId: ' ticket-1 ',
      status: 'resolved',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ ...fakeTicket, status: 'resolved' })),
  );

  assert(result.status === 'resolved', 'Update status response status was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Update status request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/service-tickets/ticket-1/status', 'Update status URL was wrong.');
  assert(call.init?.method === 'PATCH', 'Update status must use PATCH.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Update status authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Update status must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Update status body organizationId was not normalized.');
  assert(body.status === 'resolved', 'Update status body status was wrong.');

  await expectThrows('update status with failed response', () =>
    updateTicketStatus(
      { organizationId: 'org-1', ticketId: 'ticket-1', status: 'open', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runAddCommentCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await addTicketComment(
    {
      organizationId: ' org-1 ',
      ticketId: ' ticket-1 ',
      message: ' Investigating now. ',
      internalOnly: true,
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ ...fakeComment, internalOnly: true })),
  );

  assert(result.id === 'comment-1', 'Add comment response ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Add comment request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/service-tickets/ticket-1/comments', 'Add comment URL was wrong.');
  assert(call.init?.method === 'POST', 'Add comment must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Add comment authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Add comment must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Add comment body organizationId was not normalized.');
  assert(body.message === 'Investigating now.', 'Add comment body message was not normalized.');
  assert(body.internalOnly === true, 'Add comment body internalOnly was wrong.');

  const callsNoInternal: CapturedRequest[] = [];
  await addTicketComment(
    {
      organizationId: 'org-1',
      ticketId: 'ticket-1',
      message: 'Hello',
      accessToken: 'token-1',
    },
    createFetcher(callsNoInternal, () => createJsonResponse(fakeComment)),
  );

  const bodyNoInternal = readBody(callsNoInternal[0]?.init);
  assert(
    !('internalOnly' in bodyNoInternal),
    'Add comment without internalOnly must not include the field.',
  );
}

async function runListCommentsCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await listTicketComments(
    {
      organizationId: ' org-1 ',
      ticketId: ' ticket-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ comments: [fakeComment] })),
  );

  assert(result.comments.length === 1, 'List comments count was wrong.');
  assert(result.comments[0]?.id === 'comment-1', 'List comments ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'List comments request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/service-tickets/ticket-1/comments', 'List comments URL was wrong.');
  assert(
    url.searchParams.get('organizationId') === 'org-1',
    'List comments organizationId query was not normalized.',
  );
  assert(call.init?.method === 'GET', 'List comments must use GET.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'List comments authorization was not normalized.',
  );

  await expectThrows('list comments with failed response', () =>
    listTicketComments(
      { organizationId: 'org-1', ticketId: 'ticket-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runCreateCommentAttachmentDownloadUrlCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createTicketCommentAttachmentDownloadUrl(
    {
      organizationId: ' org-1 ',
      ticketId: ' ticket-1 ',
      commentId: ' comment-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () =>
      createJsonResponse({
        commentId: 'comment-1',
        downloadUrl: 'https://storage.test/ticket-attachment',
        expiresInSeconds: 300,
      }),
    ),
  );

  assert(result.commentId === 'comment-1', 'Attachment download comment ID was wrong.');
  assert(
    result.downloadUrl === 'https://storage.test/ticket-attachment',
    'Attachment download URL was wrong.',
  );

  const call = calls[0];
  assert(call !== undefined, 'Attachment download request was not captured.');
  const url = readUrl(call.input);
  assert(
    url.pathname === '/service-tickets/ticket-1/comments/comment-1/attachment-url',
    'Attachment download URL path was wrong.',
  );
  assert(call.init?.method === 'POST', 'Attachment download must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Attachment download authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Attachment download must set content-type.',
  );
  assert(
    readBody(call.init).organizationId === 'org-1',
    'Attachment download organizationId was not normalized.',
  );

  await expectThrows('attachment download with failed response', () =>
    createTicketCommentAttachmentDownloadUrl(
      {
        organizationId: 'org-1',
        ticketId: 'ticket-1',
        commentId: 'comment-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 404 }),
    ),
  );
}

await runCreateTicketCheck();
await runListTicketsCheck();
await runUpdateStatusCheck();
await runAddCommentCheck();
await runListCommentsCheck();
await runCreateCommentAttachmentDownloadUrlCheck();

console.info('Service tickets web API smoke check passed.');
