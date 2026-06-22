import {
  createPortalServiceTicket,
  type PortalServiceTicketsFetcher,
} from './portal-service-tickets-api.js';

type CapturedRequest = {
  readonly input: Parameters<PortalServiceTicketsFetcher>[0];
  readonly init: Parameters<PortalServiceTicketsFetcher>[1];
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

function readUrl(input: Parameters<PortalServiceTicketsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

const calls: CapturedRequest[] = [];
const fetcher: PortalServiceTicketsFetcher = async (input, init) => {
  calls.push({ input, init });
  return createJsonResponse({
    ticketId: 'ticket-1',
    customerAccessToken: 'customer-access-token-1',
  });
};

const result = await createPortalServiceTicket(
  {
    qrToken: ' public/token ',
    machineId: ' machine/1 ',
    title: ' Press fault ',
    description: ' Machine stopped unexpectedly. ',
    priority: 'urgent',
  },
  fetcher,
);

assert(result.ticketId === 'ticket-1', 'Ticket ID was not returned.');
assert(
  result.customerAccessToken === 'customer-access-token-1',
  'Customer access token was not returned.',
);

const call = calls[0];
assert(call !== undefined, 'Portal ticket request was not captured.');
const url = readUrl(call.input);
assert(
  url.pathname === '/service-tickets/portal/public%2Ftoken/machines/machine%2F1',
  'Portal ticket request used the wrong or unencoded path.',
);
assert(call.init?.method === 'POST', 'Portal ticket request must use POST.');
assert(call.init?.headers !== undefined, 'Portal ticket request headers were missing.');

const headers = new Headers(call.init.headers);
assert(
  headers.get('content-type') === 'application/json',
  'Portal ticket request must send JSON content type.',
);
assert(headers.get('authorization') === null, 'Portal ticket request must not send auth.');
assert(
  call.init.body ===
    JSON.stringify({
      title: 'Press fault',
      description: 'Machine stopped unexpectedly.',
      priority: 'urgent',
    }),
  'Portal ticket request body was wrong.',
);

await expectThrows('missing QR token', () =>
  createPortalServiceTicket(
    {
      qrToken: '   ',
      machineId: 'machine-1',
      title: 'Press fault',
      description: 'Machine stopped.',
    },
    fetcher,
  ),
);

await expectThrows('failed response', () =>
  createPortalServiceTicket(
    {
      qrToken: 'token-1',
      machineId: 'machine-1',
      title: 'Press fault',
      description: 'Machine stopped.',
    },
    async () => new Response('not found', { status: 404 }),
  ),
);

console.info('Portal service tickets web API smoke check passed.');
