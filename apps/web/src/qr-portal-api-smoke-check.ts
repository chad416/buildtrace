import {
  getQrPortalMachine,
  listQrPortalDocuments,
  createQrPortalDocumentDownloadUrl,
  type QrPortalFetcher,
} from './qr-portal-api.js';

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

// 1. Test getQrPortalMachine
{
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

  const result = await getQrPortalMachine({ qrToken: ' public/token ' }, fetcher);
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

  await expectThrows('missing QR token', () => getQrPortalMachine({ qrToken: '   ' }, fetcher));

  await expectThrows('failed response', () =>
    getQrPortalMachine(
      { qrToken: 'unknown-token' },
      async () => new Response('not found', { status: 404 }),
    ),
  );
}

// 2. Test listQrPortalDocuments
{
  const calls: CapturedRequest[] = [];
  const fetcher: QrPortalFetcher = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      documents: [
        {
          id: 'doc-1',
          fileName: 'doc.pdf',
          category: 'manuals',
          language: 'en',
          uploadedAt: '2026-06-21T00:00:00.000Z',
        },
      ],
    });
  };

  const result = await listQrPortalDocuments({ qrToken: ' public/token ' }, fetcher);
  assert(result.documents.length === 1, 'Documents list was empty.');
  const doc = result.documents[0];
  assert(doc?.id === 'doc-1', 'Document ID was incorrect.');
  assert(doc?.fileName === 'doc.pdf', 'Document filename was incorrect.');
  assert(doc?.category === 'manuals', 'Document category was incorrect.');
  assert(doc?.language === 'en', 'Document language was incorrect.');

  const call = calls[0];
  assert(call !== undefined, 'List documents request was not captured.');
  const url = readUrl(call.input);
  assert(
    url.pathname === '/qr-portal/portal/public%2Ftoken/documents',
    'List documents request used wrong path.',
  );
  assert(call.init?.method === 'GET', 'List documents request must use GET.');
  assert(call.init?.headers === undefined, 'List documents request must not send headers.');

  await expectThrows('missing QR token for list', () =>
    listQrPortalDocuments({ qrToken: '   ' }, fetcher),
  );

  await expectThrows('failed response for list', () =>
    listQrPortalDocuments(
      { qrToken: 'unknown-token' },
      async () => new Response('not found', { status: 404 }),
    ),
  );
}

// 3. Test createQrPortalDocumentDownloadUrl
{
  const calls: CapturedRequest[] = [];
  const fetcher: QrPortalFetcher = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      downloadUrl: 'https://test-storage.local/file.pdf',
      expiresInSeconds: 3600,
    });
  };

  const result = await createQrPortalDocumentDownloadUrl(
    { qrToken: ' public/token ', documentId: ' doc-1 ' },
    fetcher,
  );
  assert(
    result.downloadUrl === 'https://test-storage.local/file.pdf',
    'Download URL was incorrect.',
  );
  assert(result.expiresInSeconds === 3600, 'Expiry was incorrect.');

  const call = calls[0];
  assert(call !== undefined, 'Create download URL request was not captured.');
  const url = readUrl(call.input);
  assert(
    url.pathname === '/qr-portal/portal/public%2Ftoken/documents/doc-1/download-url',
    'Create download URL request used wrong path.',
  );
  assert(call.init?.method === 'POST', 'Create download URL request must use POST.');
  assert(
    call.init?.headers !== undefined &&
      (call.init.headers as Record<string, string>)['content-type'] === 'application/json',
    'Create download URL request must send content-type header.',
  );
  assert(call.init?.body === '{}', 'Create download URL request must send empty JSON object body.');

  await expectThrows('missing QR token for download', () =>
    createQrPortalDocumentDownloadUrl({ qrToken: '   ', documentId: 'doc-1' }, fetcher),
  );

  await expectThrows('missing document ID for download', () =>
    createQrPortalDocumentDownloadUrl({ qrToken: 'token', documentId: '   ' }, fetcher),
  );

  await expectThrows('failed response for download', () =>
    createQrPortalDocumentDownloadUrl(
      { qrToken: 'token', documentId: 'doc-1' },
      async () => new Response('not found', { status: 404 }),
    ),
  );
}

console.info('QR portal web API smoke check passed.');
