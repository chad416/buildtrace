import { getQrPortalMachine, type QrPortalFetcher } from './qr-portal-api.js';

type CapturedRequest = {
  readonly input: Parameters<QrPortalFetcher>[0];
  readonly init: Parameters<QrPortalFetcher>[1];
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

function readUrl(input: Parameters<QrPortalFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

const calls: CapturedRequest[] = [];

const fetcher: QrPortalFetcher = async (input, init) => {
  calls.push({ input, init });

  return createJsonResponse({
    machineId: 'machine-1',
    machineName: 'Press One',
    serialNumber: 'SN-100',
    portalDefaultLocale: 'de',
  });
};

const result = await getQrPortalMachine(
  {
    qrToken: ' public/token ',
  },
  fetcher,
);

assert(result.machineId === 'machine-1', 'Machine ID was not returned.');
assert(result.machineName === 'Press One', 'Machine name was not returned.');
assert(result.serialNumber === 'SN-100', 'Serial number was not returned.');
assert(result.portalDefaultLocale === 'de', 'Portal locale was not returned.');

const call = calls[0];

assert(call !== undefined, 'Portal request was not captured.');

const url = readUrl(call.input);

assert(
  url.pathname === '/qr-portal/portal/public%2Ftoken',
  'Portal request used the wrong or unencoded path.',
);
assert(call.init?.method === 'GET', 'Portal request must use GET.');
assert(call.init?.headers === undefined, 'Public portal request must not send headers.');

await expectThrows('missing QR token', () =>
  getQrPortalMachine(
    {
      qrToken: '   ',
    },
    fetcher,
  ),
);

await expectThrows('failed response', () =>
  getQrPortalMachine(
    {
      qrToken: 'unknown-token',
    },
    async () => new Response('not found', { status: 404 }),
  ),
);

console.info('QR portal web API smoke check passed.');
