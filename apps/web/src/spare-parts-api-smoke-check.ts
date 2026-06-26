import {
  createSparePart,
  listSpareParts,
  updateSparePart,
  type SparePartApiModel,
  type SparePartsFetcher,
} from './spare-parts-api.js';

type CapturedRequest = {
  readonly input: Parameters<SparePartsFetcher>[0];
  readonly init: Parameters<SparePartsFetcher>[1];
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

function readUrl(input: Parameters<SparePartsFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<SparePartsFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

function readBody(init: Parameters<SparePartsFetcher>[1]): Record<string, unknown> {
  const rawBody = init?.body;
  const bodyText = typeof rawBody === 'string' ? rawBody : '';
  return JSON.parse(bodyText) as Record<string, unknown>;
}

function createFetcher(
  calls: CapturedRequest[],
  responseFactory: () => Response,
): SparePartsFetcher {
  return async (input, init) => {
    calls.push({ input, init });

    return responseFactory();
  };
}

const fakeSparePart: SparePartApiModel = {
  id: 'part-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  partName: 'Filter cartridge',
  manufacturer: 'Acme Parts',
  partNumber: 'FC-100',
  quantity: 2,
  category: 'filters',
  criticality: 'critical',
  estimatedPrice: '25.50',
  currency: 'EUR',
  customerVisiblePrice: '35.00',
  sourceDocumentId: null,
  notes: 'Keep one on site.',
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

function assertInternalCostHidden(record: object, message: string): void {
  assert(!Object.prototype.hasOwnProperty.call(record, 'internalCost'), message);
}

async function runCreateSparePartCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await createSparePart(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      partName: ' Filter cartridge ',
      manufacturer: ' Acme Parts ',
      partNumber: ' FC-100 ',
      quantity: 2,
      category: ' filters ',
      criticality: 'critical',
      estimatedPrice: ' 25.50 ',
      currency: ' EUR ',
      internalCost: ' 18.00 ',
      customerVisiblePrice: ' 35.00 ',
      sourceDocumentId: null,
      notes: ' Keep one on site. ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse(fakeSparePart)),
  );

  assert(result.id === 'part-1', 'Create spare part response ID was wrong.');
  assertInternalCostHidden(result, 'Create spare part response exposed internalCost.');

  const call = calls[0];
  assert(call !== undefined, 'Create spare part request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/spare-parts/machines/machine-1', 'Create spare part URL was wrong.');
  assert(call.init?.method === 'POST', 'Create spare part must use POST.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Create spare part authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Create spare part must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Create spare part organizationId was not normalized.');
  assert(body.partName === 'Filter cartridge', 'Create spare part partName was not normalized.');
  assert(body.manufacturer === 'Acme Parts', 'Create spare part manufacturer was not normalized.');
  assert(body.partNumber === 'FC-100', 'Create spare part partNumber was not normalized.');
  assert(body.quantity === 2, 'Create spare part quantity was wrong.');
  assert(body.category === 'filters', 'Create spare part category was not normalized.');
  assert(body.criticality === 'critical', 'Create spare part criticality was wrong.');
  assert(body.estimatedPrice === '25.50', 'Create spare part estimatedPrice was not normalized.');
  assert(body.currency === 'EUR', 'Create spare part currency was not normalized.');
  assert(body.internalCost === '18.00', 'Create spare part internalCost was not normalized.');
  assert(
    body.customerVisiblePrice === '35.00',
    'Create spare part customerVisiblePrice was not normalized.',
  );
  assert(body.sourceDocumentId === null, 'Create spare part sourceDocumentId was wrong.');
  assert(body.notes === 'Keep one on site.', 'Create spare part notes were not normalized.');

  await expectThrows('create spare part with empty part name', () =>
    createSparePart(
      {
        organizationId: 'org-1',
        machineId: 'machine-1',
        partName: '  ',
        accessToken: 'token-1',
      },
      async () => createJsonResponse(fakeSparePart),
    ),
  );
}

async function runListSparePartsCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await listSpareParts(
    {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () => createJsonResponse({ spareParts: [fakeSparePart] })),
  );

  assert(result.spareParts.length === 1, 'List spare parts count was wrong.');
  assert(result.spareParts[0]?.id === 'part-1', 'List spare parts ID was wrong.');
  assertInternalCostHidden(
    result.spareParts[0] ?? {},
    'List spare parts response exposed internalCost.',
  );

  const call = calls[0];
  assert(call !== undefined, 'List spare parts request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/spare-parts/machines/machine-1', 'List spare parts URL was wrong.');
  assert(
    url.searchParams.get('organizationId') === 'org-1',
    'List spare parts organizationId query was not normalized.',
  );
  assert(call.init?.method === 'GET', 'List spare parts must use GET.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'List spare parts authorization was not normalized.',
  );

  await expectThrows('list spare parts with failed response', () =>
    listSpareParts(
      { organizationId: 'org-1', machineId: 'machine-1', accessToken: 'token-1' },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

async function runUpdateSparePartCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];
  const result = await updateSparePart(
    {
      organizationId: ' org-1 ',
      sparePartId: ' part-1 ',
      partName: ' Filter cartridge XL ',
      manufacturer: null,
      partNumber: ' FC-200 ',
      quantity: 3,
      category: ' filters ',
      criticality: 'recommended',
      estimatedPrice: ' 30.00 ',
      currency: ' EUR ',
      customerVisiblePrice: ' 45.00 ',
      notes: null,
      accessToken: ' token-1 ',
    },
    createFetcher(calls, () =>
      createJsonResponse({
        ...fakeSparePart,
        partName: 'Filter cartridge XL',
        criticality: 'recommended',
      }),
    ),
  );

  assert(result.partName === 'Filter cartridge XL', 'Update spare part response was wrong.');
  assertInternalCostHidden(result, 'Update spare part response exposed internalCost.');

  const call = calls[0];
  assert(call !== undefined, 'Update spare part request was not captured.');

  const url = readUrl(call.input);
  assert(url.pathname === '/spare-parts/part-1', 'Update spare part URL was wrong.');
  assert(call.init?.method === 'PATCH', 'Update spare part must use PATCH.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Update spare part authorization was not normalized.',
  );
  assert(
    readHeaders(call.init)['content-type'] === 'application/json',
    'Update spare part must set content-type.',
  );

  const body = readBody(call.init);
  assert(body.organizationId === 'org-1', 'Update spare part organizationId was not normalized.');
  assert(body.partName === 'Filter cartridge XL', 'Update spare part partName was not normalized.');
  assert(body.manufacturer === null, 'Update spare part manufacturer was wrong.');
  assert(body.partNumber === 'FC-200', 'Update spare part partNumber was not normalized.');
  assert(body.quantity === 3, 'Update spare part quantity was wrong.');
  assert(body.criticality === 'recommended', 'Update spare part criticality was wrong.');
  assert(!('sparePartId' in body), 'Update spare part body must not include sparePartId.');
  assert(!('accessToken' in body), 'Update spare part body must not include accessToken.');
  assert(!('internalCost' in body), 'Update spare part body must not include internalCost.');
}

await runCreateSparePartCheck();
await runListSparePartsCheck();
await runUpdateSparePartCheck();

console.info('Spare parts web API smoke check passed.');
