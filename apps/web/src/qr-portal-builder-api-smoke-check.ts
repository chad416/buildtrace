import {
  assignMachineQrToken,
  disableMachineQrPortal,
  getMachineQrToken,
  rotateMachineQrToken,
  type QrPortalBuilderFetcher,
} from './qr-portal-builder-api.js';

type CapturedRequest = {
  readonly input: Parameters<QrPortalBuilderFetcher>[0];
  readonly init: Parameters<QrPortalBuilderFetcher>[1];
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

function readUrl(input: Parameters<QrPortalBuilderFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<QrPortalBuilderFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

function createFetcher(
  calls: CapturedRequest[],
  responseFactory: () => Response,
): QrPortalBuilderFetcher {
  return async (input, init) => {
    calls.push({ input, init });

    return responseFactory();
  };
}

async function runQrPortalBuilderApiSmokeCheck(): Promise<void> {
  const assignCalls: CapturedRequest[] = [];
  const assignResult = await assignMachineQrToken(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(assignCalls, () =>
      createJsonResponse({
        machineId: 'machine-1',
        qrToken: 'qr-token-1',
      }),
    ),
  );

  assert(assignResult.qrToken === 'qr-token-1', 'Assign response did not return the QR token.');

  const assignCall = assignCalls[0];
  assert(assignCall !== undefined, 'Assign request was not captured.');

  const assignUrl = readUrl(assignCall.input);
  assert(
    assignUrl.pathname === '/qr-portal/machines/machine-1/qr-token',
    'Assign request used the wrong path.',
  );
  assert(
    assignUrl.searchParams.get('organizationId') === 'organization-1',
    'Assign organization query was not normalized.',
  );
  assert(assignCall.init?.method === 'POST', 'Assign request must use POST.');
  assert(
    readHeaders(assignCall.init).authorization === 'Bearer token-1',
    'Assign authorization header was not normalized.',
  );

  const getCalls: CapturedRequest[] = [];
  const getResult = await getMachineQrToken(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(getCalls, () =>
      createJsonResponse({
        machineId: 'machine-1',
        qrToken: 'qr-token-1',
      }),
    ),
  );

  assert(getResult.qrToken === 'qr-token-1', 'Get response did not return the QR token.');

  const getCall = getCalls[0];
  assert(getCall !== undefined, 'Get request was not captured.');
  assert(
    readUrl(getCall.input).pathname === '/qr-portal/machines/machine-1/qr-token',
    'Get request used the wrong path.',
  );
  assert(getCall.init?.method === 'GET', 'Get request must use GET.');
  assert(
    readHeaders(getCall.init).authorization === 'Bearer token-1',
    'Get authorization header was not normalized.',
  );

  const rotateCalls: CapturedRequest[] = [];
  const rotateResult = await rotateMachineQrToken(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(rotateCalls, () =>
      createJsonResponse({
        machineId: 'machine-1',
        qrToken: 'qr-token-2',
      }),
    ),
  );

  assert(rotateResult.qrToken === 'qr-token-2', 'Rotate response did not return the QR token.');

  const rotateCall = rotateCalls[0];
  assert(rotateCall !== undefined, 'Rotate request was not captured.');
  assert(
    readUrl(rotateCall.input).pathname === '/qr-portal/machines/machine-1/qr-token/rotate',
    'Rotate request used the wrong path.',
  );
  assert(rotateCall.init?.method === 'POST', 'Rotate request must use POST.');
  assert(
    readHeaders(rotateCall.init).authorization === 'Bearer token-1',
    'Rotate authorization header was not normalized.',
  );

  const disableCalls: CapturedRequest[] = [];
  const disableResult = await disableMachineQrPortal(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(disableCalls, () =>
      createJsonResponse({
        machineId: 'machine-1',
        disabled: true,
      }),
    ),
  );

  assert(disableResult.disabled === true, 'Disable response did not return disabled=true.');

  const disableCall = disableCalls[0];
  assert(disableCall !== undefined, 'Disable request was not captured.');
  assert(
    readUrl(disableCall.input).pathname === '/qr-portal/machines/machine-1/qr-token/disable',
    'Disable request used the wrong path.',
  );
  assert(disableCall.init?.method === 'POST', 'Disable request must use POST.');
  assert(
    readHeaders(disableCall.init).authorization === 'Bearer token-1',
    'Disable authorization header was not normalized.',
  );

  await expectThrows('assign failed response', () =>
    assignMachineQrToken(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );

  await expectThrows('get failed response', () =>
    getMachineQrToken(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );

  await expectThrows('rotate failed response', () =>
    rotateMachineQrToken(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );

  await expectThrows('disable failed response', () =>
    disableMachineQrPortal(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

await runQrPortalBuilderApiSmokeCheck();

console.info('QR portal builder web API smoke check passed.');
