import { machineStatuses } from '@buildtrace/shared';

import {
  createMachineRecord,
  getMachineRecord,
  listMachineRecords,
  type MachineRecordApiModel,
} from './machine-records-api.js';

type CapturedFetchCall = {
  readonly input: RequestInfo | URL;
  readonly init: RequestInit | undefined;
};

const activeMachineStatus = 'ACTIVE';

const fakeMachine: MachineRecordApiModel = {
  id: 'machine-1',
  organizationId: 'organization-1',
  customerId: 'customer-1',
  machineModelId: 'machine-model-1',
  machineName: 'Press Line 1',
  serialNumber: 'SN-001',
  status: activeMachineStatus,
  deliveryDate: '2026-06-12T00:00:00.000Z',
  plcType: 'Siemens S7',
  hmiType: 'KTP700',
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
  customer: {
    id: 'customer-1',
    companyName: 'ACME Manufacturing',
  },
  machineModel: {
    id: 'machine-model-1',
    modelName: 'BT-9000',
  },
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function createCapturingFetcher(
  calls: CapturedFetchCall[],
  responseBody: unknown = {
    machine: fakeMachine,
    machines: [fakeMachine],
  },
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    calls.push({
      input,
      init,
    });

    return createJsonResponse(responseBody);
  };
}

function readHeader(headers: HeadersInit | undefined, name: string): string | undefined {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const normalizedName = name.toLowerCase();

  if (Array.isArray(headers)) {
    const matchedHeader = headers.find(
      ([headerName]) => headerName.toLowerCase() === normalizedName,
    );

    return matchedHeader?.[1];
  }

  const headerRecord = headers as Record<string, string>;

  return headerRecord[name] ?? headerRecord[normalizedName];
}

function readRequestBody(call: CapturedFetchCall): Record<string, unknown> {
  const body = call.init?.body;

  assert(typeof body === 'string', 'Expected request body to be JSON string.');

  return JSON.parse(body) as Record<string, unknown>;
}

function readCallUrl(call: CapturedFetchCall): URL {
  return new URL(String(call.input));
}

async function expectThrows(
  label: string,
  action: () => Promise<unknown> | unknown,
): Promise<void> {
  let threw = false;

  try {
    await action();
  } catch {
    threw = true;
  }

  assert(threw, `Expected ${label} to throw.`);
}

async function runMachineRecordsApiSmokeCheck(): Promise<void> {
  assert(
    machineStatuses.includes(activeMachineStatus),
    'Shared machine statuses must include ACTIVE.',
  );

  const createCalls: CapturedFetchCall[] = [];

  const createdMachine = await createMachineRecord(
    {
      organizationId: ' organization-1 ',
      customerId: ' customer-1 ',
      machineModelId: ' machine-model-1 ',
      machineName: ' Press Line 1 ',
      serialNumber: ' SN-001 ',
      accessToken: ' access-token ',
      deliveryDate: ' 2026-06-12 ',
      plcType: ' Siemens S7 ',
      hmiType: ' KTP700 ',
      status: activeMachineStatus,
    },
    createCapturingFetcher(createCalls),
  );

  assert(createdMachine.id === fakeMachine.id, 'Expected create response machine to be returned.');

  const createCall = createCalls.at(0);

  assert(createCall, 'Expected create call to be captured.');
  assert(
    String(createCall.input) === 'http://localhost:4000/machine-records/machines',
    'Unexpected create URL.',
  );
  assert(createCall.init?.method === 'POST', 'Expected create request to use POST.');
  assert(
    readHeader(createCall.init?.headers, 'authorization') === 'Bearer access-token',
    'Expected create request bearer token.',
  );
  assert(
    readHeader(createCall.init?.headers, 'content-type') === 'application/json',
    'Expected create request JSON content type.',
  );

  const createBody = readRequestBody(createCall);

  assert(
    createBody.organizationId === 'organization-1',
    'Expected normalized create organization ID.',
  );
  assert(createBody.customerId === 'customer-1', 'Expected normalized create customer ID.');
  assert(
    createBody.machineModelId === 'machine-model-1',
    'Expected normalized create machine model ID.',
  );
  assert(createBody.machineName === 'Press Line 1', 'Expected normalized create machine name.');
  assert(createBody.serialNumber === 'SN-001', 'Expected normalized create serial number.');
  assert(createBody.deliveryDate === '2026-06-12', 'Expected normalized create delivery date.');
  assert(createBody.plcType === 'Siemens S7', 'Expected normalized create PLC type.');
  assert(createBody.hmiType === 'KTP700', 'Expected normalized create HMI type.');
  assert(createBody.status === activeMachineStatus, 'Expected create status.');

  const listCalls: CapturedFetchCall[] = [];

  const listedMachines = await listMachineRecords(
    {
      organizationId: ' organization-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(listCalls),
  );

  const listedMachine = listedMachines.at(0);

  assert(listedMachine, 'Expected list response to include a machine.');
  assert(listedMachine.id === fakeMachine.id, 'Expected list response machine to be returned.');

  const listCall = listCalls.at(0);

  assert(listCall, 'Expected list call to be captured.');

  const listUrl = readCallUrl(listCall);

  assert(listUrl.pathname === '/machine-records/machines', 'Unexpected list URL path.');
  assert(
    listUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected list organization query.',
  );
  assert(listCall.init?.method === 'GET', 'Expected list request to use GET.');
  assert(
    readHeader(listCall.init?.headers, 'authorization') === 'Bearer access-token',
    'Expected list request bearer token.',
  );

  const getCalls: CapturedFetchCall[] = [];

  const machine = await getMachineRecord(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(getCalls),
  );

  assert(machine.id === fakeMachine.id, 'Expected get response machine to be returned.');

  const getCall = getCalls.at(0);

  assert(getCall, 'Expected get call to be captured.');

  const getUrl = readCallUrl(getCall);

  assert(getUrl.pathname === '/machine-records/machines/machine-1', 'Unexpected get URL path.');
  assert(
    getUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected get organization query.',
  );
  assert(getCall.init?.method === 'GET', 'Expected get request to use GET.');
  assert(
    readHeader(getCall.init?.headers, 'authorization') === 'Bearer access-token',
    'Expected get request bearer token.',
  );

  await expectThrows('missing organization ID', () =>
    listMachineRecords(
      {
        organizationId: '   ',
        accessToken: 'access-token',
      },
      createCapturingFetcher([]),
    ),
  );

  await expectThrows('missing access token', () =>
    getMachineRecord(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: '   ',
      },
      createCapturingFetcher([]),
    ),
  );

  await expectThrows('unsupported machine status', () =>
    createMachineRecord(
      {
        organizationId: 'organization-1',
        customerId: 'customer-1',
        machineModelId: 'machine-model-1',
        machineName: 'Press Line 1',
        serialNumber: 'SN-001',
        accessToken: 'access-token',
        status: 'BROKEN' as MachineRecordApiModel['status'],
      },
      createCapturingFetcher([]),
    ),
  );

  const failingFetcher = async (): Promise<Response> =>
    createJsonResponse(
      {
        message: 'nope',
      },
      500,
    );

  await expectThrows('API failure', () =>
    listMachineRecords(
      {
        organizationId: 'organization-1',
        accessToken: 'access-token',
      },
      failingFetcher,
    ),
  );
}

await runMachineRecordsApiSmokeCheck();

console.info('Machine records API smoke check passed.');
