import {
  createPortalQuoteRequest,
  type PortalQuoteRequestsFetcher,
} from './portal-quote-requests-api.js';

type CapturedRequest = {
  readonly input: Parameters<PortalQuoteRequestsFetcher>[0];
  readonly init: Parameters<PortalQuoteRequestsFetcher>[1];
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

function readUrl(input: Parameters<PortalQuoteRequestsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readBody(init: Parameters<PortalQuoteRequestsFetcher>[1]): Record<string, unknown> {
  const rawBody = init?.body;
  const bodyText = typeof rawBody === 'string' ? rawBody : '';
  return JSON.parse(bodyText) as Record<string, unknown>;
}

const calls: CapturedRequest[] = [];
const fetcher: PortalQuoteRequestsFetcher = async (input, init) => {
  calls.push({ input, init });
  return createJsonResponse({
    quoteRequestId: 'quote-1',
    customerAccessToken: 'customer-access-token-1',
  });
};

const result = await createPortalQuoteRequest(
  {
    qrToken: ' public/token ',
    machineId: ' machine/1 ',
    title: ' Filter replacement ',
    type: 'spare-part',
    description: ' Please quote filters. ',
    sparePartId: null,
    currency: ' EUR ',
  },
  fetcher,
);

assert(result.quoteRequestId === 'quote-1', 'Quote request ID was not returned.');
assert(
  result.customerAccessToken === 'customer-access-token-1',
  'Customer access token was not returned.',
);

const call = calls[0];
assert(call !== undefined, 'Portal quote request was not captured.');
const url = readUrl(call.input);
assert(
  url.pathname === '/quote-requests/portal/public%2Ftoken/machines/machine%2F1',
  'Portal quote request used the wrong or unencoded path.',
);
assert(call.init?.method === 'POST', 'Portal quote request must use POST.');

const headers = new Headers(call.init?.headers);
assert(
  headers.get('content-type') === 'application/json',
  'Portal quote request must send JSON content type.',
);
assert(headers.get('authorization') === null, 'Portal quote request must not send auth.');

const body = readBody(call.init);
assert(body.title === 'Filter replacement', 'Portal quote title was not normalized.');
assert(body.type === 'spare-part', 'Portal quote type was wrong.');
assert(
  body.description === 'Please quote filters.',
  'Portal quote description was not normalized.',
);
assert(body.sparePartId === null, 'Portal quote sparePartId was wrong.');
assert(body.currency === 'EUR', 'Portal quote currency was not normalized.');

await expectThrows('missing QR token', () =>
  createPortalQuoteRequest(
    {
      qrToken: '   ',
      machineId: 'machine-1',
      title: 'Filter replacement',
    },
    fetcher,
  ),
);

await expectThrows('failed response', () =>
  createPortalQuoteRequest(
    {
      qrToken: 'token-1',
      machineId: 'machine-1',
      title: 'Filter replacement',
    },
    async () => new Response('not found', { status: 404 }),
  ),
);

console.info('Portal quote requests web API smoke check passed.');
