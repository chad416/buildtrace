import { machineStatuses, supportedLocales } from '@buildtrace/shared';

import {
  createCustomer,
  createMachineModel,
  createMachineRecord,
  getCustomer,
  getMachineModel,
  getMachineRecord,
  listCustomers,
  listMachineModels,
  listMachineRecords,
  type CustomerRecordApiModel,
  type MachineModelRecordApiModel,
  type MachineRecordApiModel,
} from './machine-records-api.js';

type CapturedFetchCall = {
  readonly input: RequestInfo | URL;
  readonly init: RequestInit | undefined;
};

const activeMachineStatus = 'ACTIVE';

const fakeCustomer: CustomerRecordApiModel = {
  id: 'customer-1',
  organizationId: 'organization-1',
  companyName: 'ACME Manufacturing',
  contactName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+420 123 456 789',
  country: 'CZ',
  preferredLocale: 'en',
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
};

const fakeMachineModel: MachineModelRecordApiModel = {
  id: 'machine-model-1',
  organizationId: 'organization-1',
  modelName: 'BT-9000',
  description: 'Packaging line',
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
};

const fakeMachine: MachineRecordApiModel = {
  id: 'machine-1',
  organizationId: 'organization-1',
  customerId: fakeCustomer.id,
  machineModelId: fakeMachineModel.id,
  machineName: 'Press Line 1',
  serialNumber: 'SN-001',
  status: activeMachineStatus,
  deliveryDate: '2026-06-12T00:00:00.000Z',
  plcType: 'Siemens S7',
  hmiType: 'KTP700',
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
  customer: {
    id: fakeCustomer.id,
    companyName: fakeCustomer.companyName,
  },
  machineModel: {
    id: fakeMachineModel.id,
    modelName: fakeMachineModel.modelName,
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

function createDefaultResponseBody(): Record<string, unknown> {
  return {
    customer: fakeCustomer,
    customers: [fakeCustomer],
    machineModel: fakeMachineModel,
    machineModels: [fakeMachineModel],
    machine: fakeMachine,
    machines: [fakeMachine],
  };
}

function createCapturingFetcher(
  calls: CapturedFetchCall[],
  responseBody: unknown = createDefaultResponseBody(),
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

function assertBearerToken(call: CapturedFetchCall, label: string): void {
  assert(
    readHeader(call.init?.headers, 'authorization') === 'Bearer access-token',
    `Expected ${label} bearer token.`,
  );
}

function assertJsonContentType(call: CapturedFetchCall, label: string): void {
  assert(
    readHeader(call.init?.headers, 'content-type') === 'application/json',
    `Expected ${label} JSON content type.`,
  );
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

async function verifyCustomerCalls(): Promise<void> {
  const createCalls: CapturedFetchCall[] = [];

  const createdCustomer = await createCustomer(
    {
      organizationId: ' organization-1 ',
      companyName: ' ACME Manufacturing ',
      contactName: ' Ada Lovelace ',
      email: ' ada@example.com ',
      phone: ' +420 123 456 789 ',
      country: ' CZ ',
      preferredLocale: 'en',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(createCalls),
  );

  assert(createdCustomer.id === fakeCustomer.id, 'Expected create response customer.');

  const createCall = createCalls.at(0);

  assert(createCall, 'Expected create customer call.');
  assert(
    String(createCall.input) === 'http://localhost:4000/machine-records/customers',
    'Unexpected create customer URL.',
  );
  assert(createCall.init?.method === 'POST', 'Expected create customer POST.');
  assertBearerToken(createCall, 'create customer');
  assertJsonContentType(createCall, 'create customer');

  const createBody = readRequestBody(createCall);

  assert(createBody.organizationId === 'organization-1', 'Expected customer organization ID.');
  assert(createBody.companyName === 'ACME Manufacturing', 'Expected customer company name.');
  assert(createBody.contactName === 'Ada Lovelace', 'Expected customer contact name.');
  assert(createBody.email === 'ada@example.com', 'Expected customer email.');
  assert(createBody.phone === '+420 123 456 789', 'Expected customer phone.');
  assert(createBody.country === 'CZ', 'Expected customer country.');
  assert(createBody.preferredLocale === 'en', 'Expected customer preferred locale.');

  const listCalls: CapturedFetchCall[] = [];
  const customers = await listCustomers(
    {
      organizationId: ' organization-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(listCalls),
  );

  assert(customers.at(0)?.id === fakeCustomer.id, 'Expected listed customer.');

  const listCall = listCalls.at(0);

  assert(listCall, 'Expected list customers call.');

  const listUrl = readCallUrl(listCall);

  assert(listUrl.pathname === '/machine-records/customers', 'Unexpected list customers path.');
  assert(
    listUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected list customers organization query.',
  );
  assert(listCall.init?.method === 'GET', 'Expected list customers GET.');
  assertBearerToken(listCall, 'list customers');

  const getCalls: CapturedFetchCall[] = [];
  const customer = await getCustomer(
    {
      organizationId: ' organization-1 ',
      customerId: ' customer-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(getCalls),
  );

  assert(customer.id === fakeCustomer.id, 'Expected get response customer.');

  const getCall = getCalls.at(0);

  assert(getCall, 'Expected get customer call.');

  const getUrl = readCallUrl(getCall);

  assert(
    getUrl.pathname === '/machine-records/customers/customer-1',
    'Unexpected get customer path.',
  );
  assert(
    getUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected get customer organization query.',
  );
  assert(getCall.init?.method === 'GET', 'Expected get customer GET.');
  assertBearerToken(getCall, 'get customer');
}

async function verifyMachineModelCalls(): Promise<void> {
  const createCalls: CapturedFetchCall[] = [];

  const createdMachineModel = await createMachineModel(
    {
      organizationId: ' organization-1 ',
      modelName: ' BT-9000 ',
      description: ' Packaging line ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(createCalls),
  );

  assert(createdMachineModel.id === fakeMachineModel.id, 'Expected create response machine model.');

  const createCall = createCalls.at(0);

  assert(createCall, 'Expected create machine model call.');
  assert(
    String(createCall.input) === 'http://localhost:4000/machine-records/machine-models',
    'Unexpected create machine model URL.',
  );
  assert(createCall.init?.method === 'POST', 'Expected create machine model POST.');
  assertBearerToken(createCall, 'create machine model');
  assertJsonContentType(createCall, 'create machine model');

  const createBody = readRequestBody(createCall);

  assert(createBody.organizationId === 'organization-1', 'Expected model organization ID.');
  assert(createBody.modelName === 'BT-9000', 'Expected model name.');
  assert(createBody.description === 'Packaging line', 'Expected model description.');

  const listCalls: CapturedFetchCall[] = [];
  const machineModels = await listMachineModels(
    {
      organizationId: ' organization-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(listCalls),
  );

  assert(machineModels.at(0)?.id === fakeMachineModel.id, 'Expected listed machine model.');

  const listCall = listCalls.at(0);

  assert(listCall, 'Expected list machine models call.');

  const listUrl = readCallUrl(listCall);

  assert(
    listUrl.pathname === '/machine-records/machine-models',
    'Unexpected list machine models path.',
  );
  assert(
    listUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected list machine models organization query.',
  );
  assert(listCall.init?.method === 'GET', 'Expected list machine models GET.');
  assertBearerToken(listCall, 'list machine models');

  const getCalls: CapturedFetchCall[] = [];
  const machineModel = await getMachineModel(
    {
      organizationId: ' organization-1 ',
      machineModelId: ' machine-model-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(getCalls),
  );

  assert(machineModel.id === fakeMachineModel.id, 'Expected get response machine model.');

  const getCall = getCalls.at(0);

  assert(getCall, 'Expected get machine model call.');

  const getUrl = readCallUrl(getCall);

  assert(
    getUrl.pathname === '/machine-records/machine-models/machine-model-1',
    'Unexpected get machine model path.',
  );
  assert(
    getUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected get machine model organization query.',
  );
  assert(getCall.init?.method === 'GET', 'Expected get machine model GET.');
  assertBearerToken(getCall, 'get machine model');
}

async function verifyMachineCalls(): Promise<void> {
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

  assert(createdMachine.id === fakeMachine.id, 'Expected create response machine.');

  const createCall = createCalls.at(0);

  assert(createCall, 'Expected create machine call.');
  assert(
    String(createCall.input) === 'http://localhost:4000/machine-records/machines',
    'Unexpected create machine URL.',
  );
  assert(createCall.init?.method === 'POST', 'Expected create machine POST.');
  assertBearerToken(createCall, 'create machine');
  assertJsonContentType(createCall, 'create machine');

  const createBody = readRequestBody(createCall);

  assert(createBody.organizationId === 'organization-1', 'Expected machine organization ID.');
  assert(createBody.customerId === 'customer-1', 'Expected machine customer ID.');
  assert(createBody.machineModelId === 'machine-model-1', 'Expected machine model ID.');
  assert(createBody.machineName === 'Press Line 1', 'Expected machine name.');
  assert(createBody.serialNumber === 'SN-001', 'Expected machine serial number.');
  assert(createBody.deliveryDate === '2026-06-12', 'Expected machine delivery date.');
  assert(createBody.plcType === 'Siemens S7', 'Expected machine PLC type.');
  assert(createBody.hmiType === 'KTP700', 'Expected machine HMI type.');
  assert(createBody.status === activeMachineStatus, 'Expected machine status.');

  const listCalls: CapturedFetchCall[] = [];

  const listedMachines = await listMachineRecords(
    {
      organizationId: ' organization-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(listCalls),
  );

  assert(listedMachines.at(0)?.id === fakeMachine.id, 'Expected listed machine.');

  const listCall = listCalls.at(0);

  assert(listCall, 'Expected list machine call.');

  const listUrl = readCallUrl(listCall);

  assert(listUrl.pathname === '/machine-records/machines', 'Unexpected list machine path.');
  assert(
    listUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected list machine organization query.',
  );
  assert(listCall.init?.method === 'GET', 'Expected list machine GET.');
  assertBearerToken(listCall, 'list machine');

  const getCalls: CapturedFetchCall[] = [];

  const machine = await getMachineRecord(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' access-token ',
    },
    createCapturingFetcher(getCalls),
  );

  assert(machine.id === fakeMachine.id, 'Expected get response machine.');

  const getCall = getCalls.at(0);

  assert(getCall, 'Expected get machine call.');

  const getUrl = readCallUrl(getCall);

  assert(getUrl.pathname === '/machine-records/machines/machine-1', 'Unexpected get machine path.');
  assert(
    getUrl.searchParams.get('organizationId') === 'organization-1',
    'Expected get machine organization query.',
  );
  assert(getCall.init?.method === 'GET', 'Expected get machine GET.');
  assertBearerToken(getCall, 'get machine');
}

async function verifyFailures(): Promise<void> {
  assert(supportedLocales.includes('en'), 'Supported locales must include en.');

  await expectThrows('missing organization ID', () =>
    listCustomers(
      {
        organizationId: '   ',
        accessToken: 'access-token',
      },
      createCapturingFetcher([]),
    ),
  );

  await expectThrows('missing access token', () =>
    getMachineModel(
      {
        organizationId: 'organization-1',
        machineModelId: 'machine-model-1',
        accessToken: '   ',
      },
      createCapturingFetcher([]),
    ),
  );

  await expectThrows('unsupported preferred locale', () =>
    createCustomer(
      {
        organizationId: 'organization-1',
        companyName: 'ACME Manufacturing',
        accessToken: 'access-token',
        preferredLocale: 'zz' as CustomerRecordApiModel['preferredLocale'],
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

async function runMachineRecordsApiSmokeCheck(): Promise<void> {
  await verifyCustomerCalls();
  await verifyMachineModelCalls();
  await verifyMachineCalls();
  await verifyFailures();
}

await runMachineRecordsApiSmokeCheck();

console.info('Machine records API smoke check passed.');
