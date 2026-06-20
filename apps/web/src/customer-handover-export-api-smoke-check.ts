import {
  createCustomerHandoverExport,
  createCustomerHandoverExportDownloadUrl,
  createCustomerHandoverExportPdfDownloadUrl,
  type CustomerHandoverExportFetcher,
} from './customer-handover-export-api.js';

type CapturedRequest = {
  readonly input: Parameters<CustomerHandoverExportFetcher>[0];
  readonly init: Parameters<CustomerHandoverExportFetcher>[1];
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

function readUrl(input: Parameters<CustomerHandoverExportFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<CustomerHandoverExportFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

async function runCustomerHandoverExportApiSmokeCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];

  const fetcher: CustomerHandoverExportFetcher = async (input, init) => {
    calls.push({ input, init });

    const url = readUrl(input);

    if (url.pathname.endsWith('download-url')) {
      return createJsonResponse({
        exportId: 'export-1',
        downloadUrl: 'https://example.com/download',
        expiresInSeconds: 3600,
      });
    }

    return createJsonResponse({
      export: {
        id: 'export-1',
        result: 'succeeded',
        checklistVersion: 'customer-handover-beta-v1',
        documentCount: 2,
        totalDocumentBytes: 1024,
        archiveByteLength: 512,
        createdAt: '2026-06-20T18:00:00.000Z',
        completedAt: '2026-06-20T18:01:00.000Z',
      },
    });
  };

  // Test createCustomerHandoverExport
  const createResult = await createCustomerHandoverExport(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      documentIds: [' doc-1 ', ' doc-2 '],
      locale: 'en',
      accessToken: ' token-1 ',
    },
    fetcher,
  );

  assert(createResult.export.id === 'export-1', 'Export ID was not returned.');
  assert(createResult.export.result === 'succeeded', 'Result was not succeeded.');
  assert(
    createResult.export.checklistVersion === 'customer-handover-beta-v1',
    'Checklist version mismatch.',
  );
  assert(createResult.export.documentCount === 2, 'Document count mismatch.');
  assert(createResult.export.totalDocumentBytes === 1024, 'Total document bytes mismatch.');
  assert(createResult.export.archiveByteLength === 512, 'Archive byte length mismatch.');
  assert(createResult.export.createdAt === '2026-06-20T18:00:00.000Z', 'CreatedAt mismatch.');
  assert(createResult.export.completedAt === '2026-06-20T18:01:00.000Z', 'CompletedAt mismatch.');

  const call1 = calls[0];
  assert(call1 !== undefined, 'Create export request was not captured.');

  const url1 = readUrl(call1.input);
  assert(
    url1.pathname === '/document-records/machines/machine-1/customer-handover-exports',
    'Create export request used the wrong path.',
  );
  assert(call1.init?.method === 'POST', 'Create export request must use POST.');
  assert(
    readHeaders(call1.init).authorization === 'Bearer token-1',
    'Authorization header was not normalized.',
  );

  const body1 = JSON.parse(call1.init?.body as string);
  assert(body1.organizationId === 'organization-1', 'Organization ID was not normalized.');
  assert(
    Array.isArray(body1.documentIds) &&
      body1.documentIds.length === 2 &&
      body1.documentIds[0] === 'doc-1' &&
      body1.documentIds[1] === 'doc-2',
    'Document IDs were not normalized.',
  );
  assert(body1.locale === 'en', 'Locale was not sent.');

  // Test createCustomerHandoverExportDownloadUrl
  const downloadUrlResult = await createCustomerHandoverExportDownloadUrl(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      exportId: ' export-1 ',
      accessToken: ' token-1 ',
    },
    fetcher,
  );

  assert(downloadUrlResult.exportId === 'export-1', 'Download URL export ID mismatch.');
  assert(
    downloadUrlResult.downloadUrl === 'https://example.com/download',
    'Download URL mismatch.',
  );
  assert(downloadUrlResult.expiresInSeconds === 3600, 'Expires in seconds mismatch.');

  const call2 = calls[1];
  assert(call2 !== undefined, 'Download URL request was not captured.');

  const url2 = readUrl(call2.input);
  assert(
    url2.pathname ===
      '/document-records/machines/machine-1/customer-handover-exports/export-1/download-url',
    'Download URL request used the wrong path.',
  );
  assert(call2.init?.method === 'POST', 'Download URL request must use POST.');
  assert(
    readHeaders(call2.init).authorization === 'Bearer token-1',
    'Authorization header was not normalized.',
  );

  const body2 = JSON.parse(call2.init?.body as string);
  assert(body2.organizationId === 'organization-1', 'Organization ID was not normalized.');

  const pdfDownloadUrlResult = await createCustomerHandoverExportPdfDownloadUrl(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      exportId: ' export-1 ',
      accessToken: ' token-1 ',
    },
    fetcher,
  );

  assert(pdfDownloadUrlResult.exportId === 'export-1', 'PDF download export ID mismatch.');
  assert(
    pdfDownloadUrlResult.downloadUrl === 'https://example.com/download',
    'PDF download URL mismatch.',
  );

  const call3 = calls[2];
  assert(call3 !== undefined, 'PDF download URL request was not captured.');
  assert(
    readUrl(call3.input).pathname ===
      '/document-records/machines/machine-1/customer-handover-exports/export-1/pdf-download-url',
    'PDF download URL request used the wrong path.',
  );

  // Validation checks for invalid inputs
  await expectThrows('missing organization ID in create', () =>
    createCustomerHandoverExport(
      {
        organizationId: '   ',
        machineId: 'machine-1',
        documentIds: ['doc-1'],
        locale: 'en',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing machine ID in create', () =>
    createCustomerHandoverExport(
      {
        organizationId: 'organization-1',
        machineId: '   ',
        documentIds: ['doc-1'],
        locale: 'en',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing document ID in create documentIds list', () =>
    createCustomerHandoverExport(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        documentIds: ['doc-1', '  '],
        locale: 'en',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing access token in create', () =>
    createCustomerHandoverExport(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        documentIds: ['doc-1'],
        locale: 'en',
        accessToken: '   ',
      },
      fetcher,
    ),
  );

  await expectThrows('failed response in create', () =>
    createCustomerHandoverExport(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        documentIds: ['doc-1'],
        locale: 'en',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );

  await expectThrows('missing organization ID in downloadUrl', () =>
    createCustomerHandoverExportDownloadUrl(
      {
        organizationId: '   ',
        machineId: 'machine-1',
        exportId: 'export-1',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing machine ID in downloadUrl', () =>
    createCustomerHandoverExportDownloadUrl(
      {
        organizationId: 'organization-1',
        machineId: '   ',
        exportId: 'export-1',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing export ID in downloadUrl', () =>
    createCustomerHandoverExportDownloadUrl(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        exportId: '   ',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing access token in downloadUrl', () =>
    createCustomerHandoverExportDownloadUrl(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        exportId: 'export-1',
        accessToken: '   ',
      },
      fetcher,
    ),
  );

  await expectThrows('failed response in downloadUrl', () =>
    createCustomerHandoverExportDownloadUrl(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        exportId: 'export-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

await runCustomerHandoverExportApiSmokeCheck();

console.info('Customer handover export web API smoke check passed.');
