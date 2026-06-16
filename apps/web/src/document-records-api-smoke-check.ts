import {
  applyDocumentClassificationSuggestion,
  createDocumentDownloadUrl,
  getDocument,
  listDocuments,
  updateDocumentCategory,
  updateDocumentVisibility,
  uploadDocument,
  type DocumentMetadataApiModel,
  type Fetcher,
} from './document-records-api.js';

type CapturedRequest = {
  readonly input: Parameters<Fetcher>[0];
  readonly init: Parameters<Fetcher>[1];
};

const now = '2026-06-15T00:00:00.000Z';

function createDocument(
  overrides: Partial<DocumentMetadataApiModel> = {},
): DocumentMetadataApiModel {
  return {
    id: 'document-1',
    organizationId: 'organization-1',
    machineId: 'machine-1',
    fileName: 'Manual.pdf',
    fileType: 'application/pdf',
    category: 'manuals',
    suggestedCategory: null,
    classificationConfidence: null,
    classificationStatus: 'unclassified',
    classificationSource: null,
    visibilityLevel: 'internal',
    visibleToCustomer: false,
    language: 'en',
    uploadedByUserId: 'user-1',
    uploadedAt: now,
    lastDownloadUrlIssuedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function createCapturingFetcher(calls: CapturedRequest[]): Fetcher {
  return async (input, init) => {
    calls.push({ input, init });

    const url = input instanceof URL ? input : new URL(String(input));

    if (url.pathname.endsWith('/classification-suggestion')) {
      return createJsonResponse({
        document: createDocument({
          suggestedCategory: 'plc',
          classificationConfidence: 96,
          classificationStatus: 'classified',
          classificationSource: 'filename-type',
        }),
      });
    }

    if (url.pathname.endsWith('/download-url')) {
      return createJsonResponse({
        document: createDocument({ lastDownloadUrlIssuedAt: now }),
        downloadUrl: 'https://storage.example/signed/manual.pdf',
        expiresInSeconds: 900,
      });
    }

    if (url.pathname.endsWith('/upload')) {
      return createJsonResponse({
        document: {
          id: 'document-1',
          organizationId: 'organization-1',
          machineId: 'machine-1',
          fileName: 'Manual.pdf',
        },
      });
    }

    if (url.pathname.endsWith('/category')) {
      return createJsonResponse({
        document: createDocument({ category: 'plc', visibilityLevel: 'sensitive-engineering' }),
      });
    }

    if (url.pathname.endsWith('/visibility')) {
      return createJsonResponse({
        document: createDocument({ visibilityLevel: 'customer-visible', visibleToCustomer: true }),
      });
    }

    if (url.pathname.endsWith('/documents/document-1')) {
      return createJsonResponse({
        document: createDocument(),
      });
    }

    return createJsonResponse({
      documents: [createDocument()],
    });
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readCapturedCall(calls: CapturedRequest[], index: number): CapturedRequest {
  const call = calls[index];

  if (!call) {
    throw new Error(`Expected captured request ${index}.`);
  }

  return call;
}

function readUrl(input: Parameters<Fetcher>[0]): URL {
  if (input instanceof URL) {
    return input;
  }

  return new URL(String(input));
}

function readHeaders(init: Parameters<Fetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

async function runDocumentRecordsApiSmokeCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const fetcher = createCapturingFetcher(calls);

  const documents = await listDocuments(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    fetcher,
  );

  assert(documents.length === 1, 'Documents were not returned.');

  const listCall = readCapturedCall(calls, 0);
  const listUrl = readUrl(listCall.input);

  assert(listUrl.pathname === '/document-records/machines/machine-1/documents', 'Wrong list path.');
  assert(
    listUrl.searchParams.get('organizationId') === 'organization-1',
    'Wrong organization query.',
  );
  assert(listCall.init?.method === 'GET', 'List used wrong method.');
  assert(
    readHeaders(listCall.init).authorization === 'Bearer token-1',
    'List auth header missing.',
  );

  const document = await getDocument(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      accessToken: 'token-1',
    },
    fetcher,
  );

  assert(document.id === 'document-1', 'Document was not returned.');

  const uploadResult = await uploadDocument(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      accessToken: 'token-1',
      file: new Blob(['manual-content'], { type: 'application/pdf' }),
      fileName: 'Manual.pdf',
      category: 'manuals',
      language: 'en',
    },
    fetcher,
  );

  assert(uploadResult.id === 'document-1', 'Upload document response was not returned.');

  const uploadCall = readCapturedCall(calls, 2);
  const uploadUrl = readUrl(uploadCall.input);

  assert(
    uploadUrl.pathname === '/document-records/machines/machine-1/documents/upload',
    'Wrong upload path.',
  );
  assert(uploadCall.init?.method === 'POST', 'Upload used wrong method.');
  assert(uploadCall.init?.body instanceof FormData, 'Upload did not send FormData.');
  assert(
    !('content-type' in readHeaders(uploadCall.init)),
    'Upload must let fetch set the multipart content type.',
  );

  const categoryDocument = await updateDocumentCategory(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      accessToken: 'token-1',
      category: 'plc',
    },
    fetcher,
  );

  assert(categoryDocument.category === 'plc', 'Category update response was not returned.');

  const visibilityDocument = await updateDocumentVisibility(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      accessToken: 'token-1',
      visibilityLevel: 'customer-visible',
    },
    fetcher,
  );

  assert(
    visibilityDocument.visibilityLevel === 'customer-visible',
    'Visibility update response was not returned.',
  );

  const classificationDocument = await applyDocumentClassificationSuggestion(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      accessToken: 'token-1',
    },
    fetcher,
  );

  assert(
    classificationDocument.suggestedCategory === 'plc',
    'Classification suggestion response was not returned.',
  );
  assert(
    classificationDocument.classificationStatus === 'classified',
    'Classification status response was not returned.',
  );

  const classificationCall = readCapturedCall(calls, 5);
  const classificationUrl = readUrl(classificationCall.input);

  assert(
    classificationUrl.pathname ===
      '/document-records/machines/machine-1/documents/document-1/classification-suggestion',
    'Wrong classification suggestion path.',
  );
  assert(
    classificationCall.init?.method === 'POST',
    'Classification suggestion used wrong method.',
  );

  const downloadUrl = await createDocumentDownloadUrl(
    {
      organizationId: 'organization-1',
      machineId: 'machine-1',
      documentId: 'document-1',
      accessToken: 'token-1',
    },
    fetcher,
  );

  assert(downloadUrl.expiresInSeconds === 900, 'Signed URL TTL was not returned.');
  assert(
    downloadUrl.downloadUrl === 'https://storage.example/signed/manual.pdf',
    'Signed URL was not returned.',
  );

  await expectThrows('public visibility', () =>
    updateDocumentVisibility(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        documentId: 'document-1',
        accessToken: 'token-1',
        visibilityLevel: 'public' as never,
      },
      fetcher,
    ),
  );

  await expectThrows('invalid category', () =>
    uploadDocument(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
        file: new Blob(['manual-content'], { type: 'application/pdf' }),
        fileName: 'Manual.pdf',
        category: 'public' as never,
      },
      fetcher,
    ),
  );

  await expectThrows('failed response', () =>
    listDocuments(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

await runDocumentRecordsApiSmokeCheck();

console.info('Document records web API smoke check passed.');
