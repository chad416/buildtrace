import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  CustomerRecord,
  MachineModelRecord,
  MachineRecord,
  OrganizationRole,
  PrismaClient,
} from '@buildtrace/db';
import { MachineStatus } from '@buildtrace/db';

import {
  createCustomerFromRequest,
  createMachineFromRequest,
  createMachineModelFromRequest,
  getCustomerFromRequest,
  getMachineFromRequest,
  getMachineModelFromRequest,
  listCustomersFromRequest,
  listMachineModelsFromRequest,
  listMachinesFromRequest,
  type MachineRecordsEndpointDependencies,
} from './machine-records.controller.js';

type ResolveInput = Parameters<
  MachineRecordsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];

type CreateCustomerInput = Parameters<MachineRecordsEndpointDependencies['createCustomer']>[0];

type ListCustomersInput = Parameters<
  MachineRecordsEndpointDependencies['listCustomersByOrganization']
>[0];

type GetCustomerInput = Parameters<
  MachineRecordsEndpointDependencies['getCustomerByOrganization']
>[0];

type CreateMachineModelInput = Parameters<
  MachineRecordsEndpointDependencies['createMachineModel']
>[0];

type ListMachineModelsInput = Parameters<
  MachineRecordsEndpointDependencies['listMachineModelsByOrganization']
>[0];

type GetMachineModelInput = Parameters<
  MachineRecordsEndpointDependencies['getMachineModelByOrganization']
>[0];

type CreateMachineInput = Parameters<MachineRecordsEndpointDependencies['createMachine']>[0];

type ListMachinesInput = Parameters<
  MachineRecordsEndpointDependencies['listMachinesByOrganization']
>[0];

type GetMachineInput = Parameters<
  MachineRecordsEndpointDependencies['getMachineByOrganization']
>[0];

type CapturedResolveInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
};

type CapturedCalls = {
  readonly resolveInputs: CapturedResolveInput[];
  readonly createCustomerInputs: CreateCustomerInput[];
  readonly listCustomersInputs: ListCustomersInput[];
  readonly getCustomerInputs: GetCustomerInput[];
  readonly createMachineModelInputs: CreateMachineModelInput[];
  readonly listMachineModelsInputs: ListMachineModelsInput[];
  readonly getMachineModelInputs: GetMachineModelInput[];
  readonly createMachineInputs: CreateMachineInput[];
  readonly listMachinesInputs: ListMachinesInput[];
  readonly getMachineInputs: GetMachineInput[];
};

const fakeDb = {} as PrismaClient;
const now = new Date('2026-06-12T00:00:00.000Z');

const fakeCustomer: CustomerRecord = {
  id: 'customer-1',
  organizationId: 'organization-1',
  companyName: 'Acme Industrial',
  contactName: 'Builder One',
  email: 'builder@example.com',
  phone: '+420123456789',
  country: 'CZ',
  preferredLocale: 'en',
  createdAt: now,
  updatedAt: now,
};

const fakeMachineModel: MachineModelRecord = {
  id: 'machine-model-1',
  organizationId: 'organization-1',
  modelName: 'MX-100',
  description: 'Compact press',
  createdAt: now,
  updatedAt: now,
};

const fakeMachine: MachineRecord = {
  id: 'machine-1',
  organizationId: 'organization-1',
  customerId: 'customer-1',
  machineModelId: 'machine-model-1',
  machineName: 'Press One',
  serialNumber: 'SN-100',
  status: MachineStatus.ACTIVE,
  deliveryDate: new Date('2026-06-12T00:00:00.000Z'),
  plcType: 'S7-1500',
  hmiType: 'Comfort Panel',
  createdAt: now,
  updatedAt: now,
  customer: {
    id: 'customer-1',
    companyName: 'Acme Industrial',
  },
  machineModel: {
    id: 'machine-model-1',
    modelName: 'MX-100',
  },
};

function captureResolveInput(input: ResolveInput): CapturedResolveInput {
  return {
    authorizationHeader: input.authorizationHeader,
    organizationId: input.organizationId,
    db: input.db,
    ...(input.allowedRoles ? { allowedRoles: input.allowedRoles } : {}),
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createCustomerInputs: [],
    listCustomersInputs: [],
    getCustomerInputs: [],
    createMachineModelInputs: [],
    listMachineModelsInputs: [],
    getMachineModelInputs: [],
    createMachineInputs: [],
    listMachinesInputs: [],
    getMachineInputs: [],
  };
}

function createDependencies(capturedCalls: CapturedCalls): MachineRecordsEndpointDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push(captureResolveInput(input));

      return {
        currentUser: {
          appUserId: 'app-user-1',
          authUserId: 'auth-user-1',
          email: 'builder@buildtrace.test',
          organizations: [
            {
              id: input.organizationId,
              role: 'OWNER',
            },
          ],
        },
        organizationAccess: {
          organizationId: input.organizationId,
          role: 'OWNER',
        },
      };
    },
    createCustomer: async (input) => {
      capturedCalls.createCustomerInputs.push(input);

      return fakeCustomer;
    },
    listCustomersByOrganization: async (input) => {
      capturedCalls.listCustomersInputs.push(input);

      return [fakeCustomer];
    },
    getCustomerByOrganization: async (input) => {
      capturedCalls.getCustomerInputs.push(input);

      return fakeCustomer;
    },
    createMachineModel: async (input) => {
      capturedCalls.createMachineModelInputs.push(input);

      return fakeMachineModel;
    },
    listMachineModelsByOrganization: async (input) => {
      capturedCalls.listMachineModelsInputs.push(input);

      return [fakeMachineModel];
    },
    getMachineModelByOrganization: async (input) => {
      capturedCalls.getMachineModelInputs.push(input);

      return fakeMachineModel;
    },
    createMachine: async (input) => {
      capturedCalls.createMachineInputs.push(input);

      return fakeMachine;
    },
    listMachinesByOrganization: async (input) => {
      capturedCalls.listMachinesInputs.push(input);

      return [fakeMachine];
    },
    getMachineByOrganization: async (input) => {
      capturedCalls.getMachineInputs.push(input);

      return fakeMachine;
    },
  };
}

function createDependenciesWithMissingRecords(
  capturedCalls: CapturedCalls,
): MachineRecordsEndpointDependencies {
  return {
    ...createDependencies(capturedCalls),
    getCustomerByOrganization: async (input) => {
      capturedCalls.getCustomerInputs.push(input);

      return null;
    },
    getMachineModelByOrganization: async (input) => {
      capturedCalls.getMachineModelInputs.push(input);

      return null;
    },
    getMachineByOrganization: async (input) => {
      capturedCalls.getMachineInputs.push(input);

      return null;
    },
  };
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

async function expectBadRequest(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw BadRequestException.`);
}

async function expectNotFound(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof NotFoundException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw NotFoundException.`);
}

function assertResolveInput(
  resolveInput: CapturedResolveInput | undefined,
  expectedRoles: readonly OrganizationRole[],
  label: string,
): void {
  assert(resolveInput !== undefined, `${label} auth tenant context dependency was not called.`);
  assert(
    resolveInput.authorizationHeader === 'Bearer token-1',
    `${label} auth header was not forwarded.`,
  );
  assert(
    resolveInput.organizationId === 'organization-1',
    `${label} organization ID was not normalized.`,
  );
  assert(resolveInput.db === fakeDb, `${label} DB dependency was not forwarded to auth.`);
  assert(
    resolveInput.allowedRoles?.join(',') === expectedRoles.join(','),
    `${label} allowed roles were wrong.`,
  );
}

async function runCustomerSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const createResponse = await createCustomerFromRequest({
    authorizationHeader: 'Bearer token-1',
    body: {
      organizationId: ' organization-1 ',
      companyName: ' Acme Industrial ',
      contactName: ' Builder One ',
      email: ' builder@example.com ',
      phone: ' +420123456789 ',
      country: ' CZ ',
      preferredLocale: ' en ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const listResponse = await listCustomersFromRequest({
    authorizationHeader: 'Bearer token-1',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const getResponse = await getCustomerFromRequest({
    authorizationHeader: 'Bearer token-1',
    customerId: ' customer-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(
    createResponse.customer.id === 'customer-1',
    'Create customer endpoint did not return customer.',
  );
  assert(listResponse.customers.length === 1, 'List customers endpoint did not return customers.');
  assert(
    getResponse.customer.id === 'customer-1',
    'Get customer endpoint did not return customer.',
  );

  assertResolveInput(capturedCalls.resolveInputs[0], ['OWNER', 'ADMIN'], 'Customer create');
  assertResolveInput(capturedCalls.resolveInputs[1], ['OWNER', 'ADMIN', 'MEMBER'], 'Customer list');
  assertResolveInput(capturedCalls.resolveInputs[2], ['OWNER', 'ADMIN', 'MEMBER'], 'Customer get');

  const createInput = capturedCalls.createCustomerInputs[0];
  const listInput = capturedCalls.listCustomersInputs[0];
  const getInput = capturedCalls.getCustomerInputs[0];

  assert(createInput !== undefined, 'Create customer dependency was not called.');
  assert(listInput !== undefined, 'List customers dependency was not called.');
  assert(getInput !== undefined, 'Get customer dependency was not called.');

  assert(createInput.db === fakeDb, 'DB dependency was not forwarded to customer create.');
  assert(
    createInput.organizationId === 'organization-1',
    'Customer create organization ID was wrong.',
  );
  assert(
    createInput.companyName === 'Acme Industrial',
    'Customer company name was not normalized.',
  );
  assert(createInput.actorUserId === 'app-user-1', 'Customer actor user ID was not forwarded.');
  assert(createInput.contactName === 'Builder One', 'Customer contact name was not normalized.');
  assert(createInput.email === 'builder@example.com', 'Customer email was not normalized.');
  assert(createInput.phone === '+420123456789', 'Customer phone was not normalized.');
  assert(createInput.country === 'CZ', 'Customer country was not normalized.');
  assert(createInput.preferredLocale === 'en', 'Customer preferred locale was not normalized.');

  assert(listInput.organizationId === 'organization-1', 'Customer list organization ID was wrong.');
  assert(getInput.organizationId === 'organization-1', 'Customer get organization ID was wrong.');
  assert(getInput.customerId === 'customer-1', 'Customer ID was not normalized.');
}

async function runMachineModelSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const createResponse = await createMachineModelFromRequest({
    authorizationHeader: 'Bearer token-1',
    body: {
      organizationId: ' organization-1 ',
      modelName: ' MX-100 ',
      description: ' Compact press ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const listResponse = await listMachineModelsFromRequest({
    authorizationHeader: 'Bearer token-1',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const getResponse = await getMachineModelFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineModelId: ' machine-model-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(
    createResponse.machineModel.id === 'machine-model-1',
    'Create machine model endpoint did not return model.',
  );
  assert(
    listResponse.machineModels.length === 1,
    'List machine models endpoint did not return models.',
  );
  assert(
    getResponse.machineModel.id === 'machine-model-1',
    'Get machine model endpoint did not return model.',
  );

  assertResolveInput(capturedCalls.resolveInputs[0], ['OWNER', 'ADMIN'], 'Machine model create');
  assertResolveInput(
    capturedCalls.resolveInputs[1],
    ['OWNER', 'ADMIN', 'MEMBER'],
    'Machine model list',
  );
  assertResolveInput(
    capturedCalls.resolveInputs[2],
    ['OWNER', 'ADMIN', 'MEMBER'],
    'Machine model get',
  );

  const createInput = capturedCalls.createMachineModelInputs[0];
  const listInput = capturedCalls.listMachineModelsInputs[0];
  const getInput = capturedCalls.getMachineModelInputs[0];

  assert(createInput !== undefined, 'Create machine model dependency was not called.');
  assert(listInput !== undefined, 'List machine models dependency was not called.');
  assert(getInput !== undefined, 'Get machine model dependency was not called.');

  assert(createInput.db === fakeDb, 'DB dependency was not forwarded to model create.');
  assert(
    createInput.organizationId === 'organization-1',
    'Model create organization ID was wrong.',
  );
  assert(createInput.modelName === 'MX-100', 'Model name was not normalized.');
  assert(createInput.actorUserId === 'app-user-1', 'Model actor user ID was not forwarded.');
  assert(createInput.description === 'Compact press', 'Model description was not normalized.');

  assert(listInput.organizationId === 'organization-1', 'Model list organization ID was wrong.');
  assert(getInput.organizationId === 'organization-1', 'Model get organization ID was wrong.');
  assert(getInput.machineModelId === 'machine-model-1', 'Model ID was not normalized.');
}

async function runMachineSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const createResponse = await createMachineFromRequest({
    authorizationHeader: 'Bearer token-1',
    body: {
      organizationId: ' organization-1 ',
      customerId: ' customer-1 ',
      machineModelId: ' machine-model-1 ',
      machineName: ' Press One ',
      serialNumber: ' SN-100 ',
      deliveryDate: '2026-06-12',
      plcType: ' S7-1500 ',
      hmiType: ' Comfort Panel ',
      status: MachineStatus.MAINTENANCE,
    },
    dependencies: createDependencies(capturedCalls),
  });

  const listResponse = await listMachinesFromRequest({
    authorizationHeader: 'Bearer token-1',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  const getResponse = await getMachineFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(
    createResponse.machine.id === 'machine-1',
    'Create machine endpoint did not return machine.',
  );
  assert(listResponse.machines.length === 1, 'List machines endpoint did not return machines.');
  assert(getResponse.machine.id === 'machine-1', 'Get machine endpoint did not return machine.');

  assertResolveInput(capturedCalls.resolveInputs[0], ['OWNER', 'ADMIN'], 'Machine create');
  assertResolveInput(capturedCalls.resolveInputs[1], ['OWNER', 'ADMIN', 'MEMBER'], 'Machine list');
  assertResolveInput(capturedCalls.resolveInputs[2], ['OWNER', 'ADMIN', 'MEMBER'], 'Machine get');

  const createInput = capturedCalls.createMachineInputs[0];
  const listInput = capturedCalls.listMachinesInputs[0];
  const getInput = capturedCalls.getMachineInputs[0];

  assert(createInput !== undefined, 'Create machine dependency was not called.');
  assert(listInput !== undefined, 'List machines dependency was not called.');
  assert(getInput !== undefined, 'Get machine dependency was not called.');

  assert(createInput.db === fakeDb, 'DB dependency was not forwarded to machine create.');
  assert(
    createInput.organizationId === 'organization-1',
    'Machine create organization ID was wrong.',
  );
  assert(createInput.customerId === 'customer-1', 'Customer ID was not normalized.');
  assert(createInput.machineModelId === 'machine-model-1', 'Machine model ID was not normalized.');
  assert(createInput.machineName === 'Press One', 'Machine name was not normalized.');
  assert(createInput.serialNumber === 'SN-100', 'Serial number was not normalized.');
  assert(createInput.actorUserId === 'app-user-1', 'Machine actor user ID was not forwarded.');
  assert(createInput.plcType === 'S7-1500', 'PLC type was not normalized.');
  assert(createInput.hmiType === 'Comfort Panel', 'HMI type was not normalized.');
  assert(createInput.status === MachineStatus.MAINTENANCE, 'Machine status was not forwarded.');
  assert(createInput.deliveryDate instanceof Date, 'Delivery date was not parsed.');

  assert(listInput.organizationId === 'organization-1', 'Machine list organization ID was wrong.');
  assert(getInput.organizationId === 'organization-1', 'Machine get organization ID was wrong.');
  assert(getInput.machineId === 'machine-1', 'Machine ID was not normalized.');
}

async function runValidationSmokeCheck(): Promise<void> {
  await expectBadRequest('missing customer organization ID', () =>
    createCustomerFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: '   ',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('invalid customer preferred locale', () =>
    createCustomerFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: 'organization-1',
        companyName: 'Acme Industrial',
        preferredLocale: 'xx',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing customer ID', () =>
    getCustomerFromRequest({
      authorizationHeader: 'Bearer token-1',
      customerId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing model name', () =>
    createMachineModelFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: 'organization-1',
        modelName: '   ',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing machine model ID', () =>
    getMachineModelFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineModelId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('invalid machine status', () =>
    createMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: 'organization-1',
        customerId: 'customer-1',
        machineModelId: 'machine-model-1',
        machineName: 'Press One',
        serialNumber: 'SN-100',
        status: 'BROKEN',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('invalid delivery date', () =>
    createMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: 'organization-1',
        customerId: 'customer-1',
        machineModelId: 'machine-model-1',
        machineName: 'Press One',
        serialNumber: 'SN-100',
        deliveryDate: 'not-a-date',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing machine ID', () =>
    getMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  const missingRecordDependencies = createDependenciesWithMissingRecords(createCapturedCalls());

  await expectNotFound('customer not found', () =>
    getCustomerFromRequest({
      authorizationHeader: 'Bearer token-1',
      customerId: 'customer-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: missingRecordDependencies,
    }),
  );

  await expectNotFound('machine model not found', () =>
    getMachineModelFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineModelId: 'machine-model-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: missingRecordDependencies,
    }),
  );

  await expectNotFound('machine not found', () =>
    getMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: missingRecordDependencies,
    }),
  );

  await expectThrows('auth dependency failure', () =>
    createMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: 'organization-1',
        customerId: 'customer-1',
        machineModelId: 'machine-model-1',
        machineName: 'Press One',
        serialNumber: 'SN-100',
      },
      dependencies: {
        ...createDependencies(createCapturedCalls()),
        resolveAuthenticatedTenantContext: async () => {
          throw new Error('auth failed');
        },
      },
    }),
  );
}

async function runMachineRecordsControllerSmokeCheck(): Promise<void> {
  await runCustomerSmokeCheck();
  await runMachineModelSmokeCheck();
  await runMachineSmokeCheck();
  await runValidationSmokeCheck();
}

await runMachineRecordsControllerSmokeCheck();

console.info('Machine records controller smoke check passed.');
