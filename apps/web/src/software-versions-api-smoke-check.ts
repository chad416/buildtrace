import {
  createSoftwareVersion,
  createSoftwareVersionFileDownloadUrl,
  listSoftwareVersions,
  markVersionAsCurrent,
  markVersionAsDelivered,
  type SoftwareVersionsFetcher,
} from './software-versions-api.js';

type CapturedRequest = {
  readonly input: Parameters<SoftwareVersionsFetcher>[0];
  readonly init: Parameters<SoftwareVersionsFetcher>[1];
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

function readUrl(input: Parameters<SoftwareVersionsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<SoftwareVersionsFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

function readBody(init: Parameters<SoftwareVersionsFetcher>[1]): Record<string, unknown> {
  const rawBody = init?.body;
  const bodyText = typeof rawBody === 'string' ? rawBody : '';
  return JSON.parse(bodyText) as Record<string, unknown>;
}

function createFetcher(
  calls: CapturedRequest[],
  responseFactory: () => Response,
): SoftwareVersionsFetcher {
  return async (input, init) => {
    calls.push({ input, init });

    return responseFactory();
  };
}

const fakeVersion = {
  id: 'version-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  versionName: 'PLC 1.2.3',
  softwareType: 'plc',
  notes: 'Commissioning baseline',
  isDeliveredVersion: true,
  isCurrentKnownVersion: true,
  hasFile: false,
  checksum: null,
  uploadedByUserId: 'user-1',
  uploadedAt: '2026-06-25T00:00:00.000Z',
  createdAt: '2026-06-25T00:00:00.000Z',
  updatedAt: '2026-06-25T00:00:00.000Z',
};

async function runCreateSoftwareVersionCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createSoftwareVersion(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      versionName: ' PLC 1.2.3 ',
      softwareType: 'plc',
      notes: ' Commissioning baseline ',
      isDeliveredVersion: true,
      isCurrentKnownVersion: false,
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse(fakeVersion)),
  );

  assert(result.id === 'version-1', 'Create software version response ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Create software version request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/software-versions/machines/machine-1',
    'Create software version URL was wrong.',
  );
  assert(call.init?.method === 'POST', 'Create software version must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Create software version authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Create software version must set content-type.',
  );

  const body = readBody(call.init);
  assert(
    body.organizationId === 'org-1',
    'Create software version body organizationId was not normalized.',
  );
  assert(
    body.versionName === 'PLC 1.2.3',
    'Create software version body versionName was not normalized.',
  );
  assert(body.softwareType === 'plc', 'Create software version body softwareType was wrong.');
  assert(
    body.notes === 'Commissioning baseline',
    'Create software version body notes was not normalized.',
  );
  assert(body.isDeliveredVersion === true, 'Create software version delivered flag was wrong.');
  assert(body.isCurrentKnownVersion === false, 'Create software version current flag was wrong.');

  await expectThrows('create software version with empty machine ID', () =>
    createSoftwareVersion(
      {
        organizationId: 'org-1',
        machineId: '  ',
        versionName: 'PLC 1.2.3',
        softwareType: 'plc',
        accessToken: 'token-1',
      },
      async () => createJsonResponse(fakeVersion),
    ),
  );
}

async function runListSoftwareVersionsCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await listSoftwareVersions(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      softwareType: 'hmi',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ versions: [fakeVersion] })),
  );

  assert(result.versions.length === 1, 'List software versions count was wrong.');
  assert(result.versions[0]?.id === 'version-1', 'List software versions ID was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'List software versions request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/software-versions/machines/machine-1',
    'List software versions URL was wrong.',
  );
  assert(
    url.searchParams.get('organizationId') === 'org-1',
    'List software versions organizationId query was not normalized.',
  );
  assert(
    url.searchParams.get('softwareType') === 'hmi',
    'List software versions softwareType query was wrong.',
  );
  assert(call.init?.method === 'GET', 'List software versions must use GET.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'List software versions authorization was not normalized.',
  );

  await expectThrows('list software versions with failed response', () =>
    listSoftwareVersions(
      { organizationId: 'org-1', machineId: 'machine-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runMarkVersionAsCurrentCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await markVersionAsCurrent(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      versionId: ' version-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ ...fakeVersion, isCurrentKnownVersion: true })),
  );

  assert(result.isCurrentKnownVersion, 'Mark current response flag was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Mark current request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/software-versions/version-1/mark-current',
    'Mark current URL was wrong.',
  );
  assert(call.init?.method === 'PATCH', 'Mark current must use PATCH.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Mark current authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Mark current must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Mark current organizationId was not normalized.');
  assert(body.machineId === 'machine-1', 'Mark current machineId was not normalized.');
}

async function runMarkVersionAsDeliveredCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await markVersionAsDelivered(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      versionId: ' version-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ ...fakeVersion, isDeliveredVersion: true })),
  );

  assert(result.isDeliveredVersion, 'Mark delivered response flag was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'Mark delivered request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/software-versions/version-1/mark-delivered',
    'Mark delivered URL was wrong.',
  );
  assert(call.init?.method === 'PATCH', 'Mark delivered must use PATCH.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Mark delivered authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Mark delivered must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Mark delivered organizationId was not normalized.');
  assert(body.machineId === 'machine-1', 'Mark delivered machineId was not normalized.');

  await expectThrows('mark delivered with failed response', () =>
    markVersionAsDelivered(
      {
        organizationId: 'org-1',
        machineId: 'machine-1',
        versionId: 'version-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 404 }),
    ),
  );
}

async function runCreateSoftwareVersionFileDownloadUrlCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createSoftwareVersionFileDownloadUrl(
    {
      organizationId: ' org-1 ',
      versionId: ' version-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () =>
      createJsonResponse({
        versionId: 'version-1',
        downloadUrl: 'https://storage.test/software-version-file',
        expiresInSeconds: 300,
      }),
    ),
  );

  assert(
    result.downloadUrl === 'https://storage.test/software-version-file',
    'File download URL response was wrong.',
  );
  assert(result.expiresInSeconds === 300, 'File download URL expiry was wrong.');

  const call = calls[0];
  assert(call !== undefined, 'File download URL request was not captured.');

  const url = readUrl(call.input);
  assert(
    url.pathname === '/software-versions/version-1/file-download-url',
    'File download URL endpoint path was wrong.',
  );
  assert(call.init?.method === 'POST', 'File download URL must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'File download URL authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'File download URL must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'File download URL organizationId was not normalized.');

  await expectThrows('file download URL with failed response', () =>
    createSoftwareVersionFileDownloadUrl(
      { organizationId: 'org-1', versionId: 'version-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 404 }),
    ),
  );
}

await runCreateSoftwareVersionCheck();
await runListSoftwareVersionsCheck();
await runMarkVersionAsCurrentCheck();
await runMarkVersionAsDeliveredCheck();
await runCreateSoftwareVersionFileDownloadUrlCheck();

console.info('Software versions web API smoke check passed.');
