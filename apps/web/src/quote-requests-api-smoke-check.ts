import {
  createQuoteRequest,
  listQuoteRequestsByMachine,
  updateQuoteRequestStatus,
  type QuoteRequestApiModel,
  type QuoteRequestsFetcher,
} from './quote-requests-api.js';

type CapturedRequest = {
  readonly input: Parameters<QuoteRequestsFetcher>[0];
  readonly init: Parameters<QuoteRequestsFetcher>[1];
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

function readUrl(input: Parameters<QuoteRequestsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<QuoteRequestsFetcher>[1]): Headers {
  return new Headers(init?.headers);
}

function readBody(init: Parameters<QuoteRequestsFetcher>[1]): Record<string, unknown> {
  const rawBody = init?.body;
  const bodyText = typeof rawBody === 'string' ? rawBody : '';
  return JSON.parse(bodyText) as Record<string, unknown>;
}

function createFetcher(
  calls: CapturedRequest[],
  responseFactory: () => Response,
): QuoteRequestsFetcher {
  return async (input, init) => {
    calls.push({ input, init });

    return responseFactory();
  };
}

const fakeQuoteRequest: QuoteRequestApiModel = {
  id: 'quote-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  sparePartId: 'part-1',
  ticketId: null,
  type: 'spare-part',
  title: 'Filter replacement',
  description: 'Please quote two filter cartridges.',
  quotedPrice: null,
  currency: 'EUR',
  status: 'requested',
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

function assertCustomerAccessTokenHidden(record: object, message: string): void {
  assert(!Object.prototype.hasOwnProperty.call(record, 'customerAccessToken'), message);
}

async function runCreateQuoteRequestCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createQuoteRequest(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      title: ' Filter replacement ',
      type: 'spare-part',
      description: ' Please quote two filter cartridges. ',
      sparePartId: ' part-1 ',
      ticketId: null,
      currency: ' EUR ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse(fakeQuoteRequest)),
  );

  assert(result.id === 'quote-1', 'Create quote request response ID was wrong.');
  assertCustomerAccessTokenHidden(result, 'Create quote response exposed customerAccessToken.');

  const call = calls[0];
  assert(call !== undefined, 'Create quote request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/quote-requests/machines/machine-1',
    'Create quote request URL was wrong.',
  );
  assert(call.init?.method === 'POST', 'Create quote request must use POST.');
  assert(
    readHeaders(call.init).get('authorization') === 'Bearer token-1',
    'Create quote request authorization was not normalized.',
  );
  assert(
    readHeaders(call.init).get('content-type') === 'application/json',
    'Create quote request must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Create quote organizationId was not normalized.');
  assert(body.title === 'Filter replacement', 'Create quote title was not normalized.');
  assert(body.type === 'spare-part', 'Create quote type was wrong.');
  assert(
    body.description === 'Please quote two filter cartridges.',
    'Create quote description was not normalized.',
  );
  assert(body.sparePartId === 'part-1', 'Create quote sparePartId was not normalized.');
  assert(body.ticketId === null, 'Create quote ticketId was wrong.');
  assert(body.currency === 'EUR', 'Create quote currency was not normalized.');

  await expectThrows('create quote request with empty title', () =>
    createQuoteRequest(
      {
        organizationId: 'org-1',
        machineId: 'machine-1',
        title: '  ',
        accessToken: 'token-1',
      },
      async () => createJsonResponse(fakeQuoteRequest),
    ),
  );
}

async function runListQuoteRequestsByMachineCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await listQuoteRequestsByMachine(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ quoteRequests: [fakeQuoteRequest] })),
  );

  assert(result.quoteRequests.length === 1, 'List quote requests count was wrong.');
  assert(result.quoteRequests[0]?.id === 'quote-1', 'List quote requests ID was wrong.');
  assertCustomerAccessTokenHidden(
    result.quoteRequests[0] ?? {},
    'List quote response exposed customerAccessToken.',
  );

  const call = calls[0];
  assert(call !== undefined, 'List quote request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/quote-requests/machines/machine-1',
    'List quote requests URL was wrong.',
  );
  assert(
    url.searchParams.get('organizationId') === 'org-1',
    'List quote requests organizationId query was not normalized.',
  );
  assert(call.init?.method === 'GET', 'List quote requests must use GET.');
  assert(
    readHeaders(call.init).get('authorization') === 'Bearer token-1',
    'List quote requests authorization was not normalized.',
  );

  await expectThrows('list quote requests with failed response', () =>
    listQuoteRequestsByMachine(
      { organizationId: 'org-1', machineId: 'machine-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runUpdateQuoteRequestStatusCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await updateQuoteRequestStatus(
    {
      organizationId: ' org-1 ',
      quoteRequestId: ' quote-1 ',
      status: 'quote-sent',
      quotedPrice: ' 125.50 ',
      currency: ' EUR ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () =>
      createJsonResponse({
        ...fakeQuoteRequest,
        quotedPrice: '125.50',
        status: 'quote-sent',
      }),
    ),
  );

  assert(result.status === 'quote-sent', 'Update quote status response status was wrong.');
  assert(result.quotedPrice === '125.50', 'Update quote status response price was wrong.');
  assertCustomerAccessTokenHidden(result, 'Update quote response exposed customerAccessToken.');

  const call = calls[0];
  assert(call !== undefined, 'Update quote request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/quote-requests/quote-1/status', 'Update quote status URL was wrong.');
  assert(call.init?.method === 'PATCH', 'Update quote status must use PATCH.');
  assert(
    readHeaders(call.init).get('authorization') === 'Bearer token-1',
    'Update quote status authorization was not normalized.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Update quote organizationId was not normalized.');
  assert(body.status === 'quote-sent', 'Update quote status was wrong.');
  assert(body.quotedPrice === '125.50', 'Update quote price was not normalized.');
  assert(body.currency === 'EUR', 'Update quote currency was not normalized.');
  assert(!('quoteRequestId' in body), 'Update quote body must not include quoteRequestId.');
  assert(!('accessToken' in body), 'Update quote body must not include accessToken.');
  assert(
    !('customerAccessToken' in body),
    'Update quote body must not include customerAccessToken.',
  );
}

await runCreateQuoteRequestCheck();
await runListQuoteRequestsByMachineCheck();
await runUpdateQuoteRequestStatusCheck();

console.info('Quote requests web API smoke check passed.');
