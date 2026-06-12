import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MachineRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';
import { MachineStatus } from '@buildtrace/db';

import {
  createMachineFromRequest,
  getMachineFromRequest,
  listMachinesFromRequest,
  type MachineRecordsEndpointDependencies,
} from './machine-records.controller.js';

type ResolveInput = Parameters<
  MachineRecordsEndpointDependencies['resolveAuthenticatedTenantContext']
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
  readonly createMachineInputs: CreateMachineInput[];
  readonly listMachinesInputs: ListMachinesInput[];
  readonly getMachineInputs: GetMachineInput[];
};

const fakeDb = {} as PrismaClient;

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
  createdAt: new Date('2026-06-12T00:00:00.000Z'),
  updatedAt: new Date('2026-06-12T00:00:00.000Z'),
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

function createDependenciesWithMissingMachine(
  capturedCalls: CapturedCalls,
): MachineRecordsEndpointDependencies {
  return {
    ...createDependencies(capturedCalls),
    getMachineByOrganization: async (input) => {
      capturedCalls.getMachineInputs.push(input);

      return null;
    },
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createMachineInputs: [],
    listMachinesInputs: [],
    getMachineInputs: [],
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

async function runCreateMachineSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const response = await createMachineFromRequest({
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

  assert(response.machine.id === 'machine-1', 'Controller did not return the created machine.');

  const resolveInput = capturedCalls.resolveInputs[0];
  const createMachineInput = capturedCalls.createMachineInputs[0];

  assert(resolveInput !== undefined, 'Auth tenant context dependency was not called.');
  assert(createMachineInput !== undefined, 'Create machine dependency was not called.');

  assert(
    resolveInput.authorizationHeader === 'Bearer token-1',
    'Authorization header was not forwarded.',
  );
  assert(
    resolveInput.organizationId === 'organization-1',
    'Organization ID was not normalized for auth.',
  );
  assert(resolveInput.db === fakeDb, 'DB dependency was not forwarded to auth.');
  assert(
    resolveInput.allowedRoles?.join(',') === 'OWNER,ADMIN',
    'Machine create endpoint did not require OWNER or ADMIN role.',
  );

  assert(createMachineInput.db === fakeDb, 'DB dependency was not forwarded to machine create.');
  assert(
    createMachineInput.organizationId === 'organization-1',
    'Machine organization ID was wrong.',
  );
  assert(createMachineInput.customerId === 'customer-1', 'Customer ID was not normalized.');
  assert(
    createMachineInput.machineModelId === 'machine-model-1',
    'Machine model ID was not normalized.',
  );
  assert(createMachineInput.machineName === 'Press One', 'Machine name was not normalized.');
  assert(createMachineInput.serialNumber === 'SN-100', 'Serial number was not normalized.');
  assert(createMachineInput.actorUserId === 'app-user-1', 'Actor user ID was not forwarded.');
  assert(createMachineInput.plcType === 'S7-1500', 'PLC type was not normalized.');
  assert(createMachineInput.hmiType === 'Comfort Panel', 'HMI type was not normalized.');
  assert(
    createMachineInput.status === MachineStatus.MAINTENANCE,
    'Machine status was not forwarded.',
  );
  assert(createMachineInput.deliveryDate instanceof Date, 'Delivery date was not parsed.');
}

async function runReadMachineSmokeCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

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

  assert(listResponse.machines.length === 1, 'List endpoint did not return machines.');
  assert(getResponse.machine.id === 'machine-1', 'Get endpoint did not return the machine.');

  const listResolveInput = capturedCalls.resolveInputs[0];
  const getResolveInput = capturedCalls.resolveInputs[1];
  const listInput = capturedCalls.listMachinesInputs[0];
  const getInput = capturedCalls.getMachineInputs[0];

  assert(listResolveInput !== undefined, 'List auth tenant context dependency was not called.');
  assert(getResolveInput !== undefined, 'Get auth tenant context dependency was not called.');
  assert(listInput !== undefined, 'List machines dependency was not called.');
  assert(getInput !== undefined, 'Get machine dependency was not called.');

  assert(
    listResolveInput.allowedRoles?.join(',') === 'OWNER,ADMIN,MEMBER',
    'Machine list endpoint did not allow OWNER, ADMIN, MEMBER.',
  );
  assert(
    getResolveInput.allowedRoles?.join(',') === 'OWNER,ADMIN,MEMBER',
    'Machine get endpoint did not allow OWNER, ADMIN, MEMBER.',
  );

  assert(
    listInput.organizationId === 'organization-1',
    'List endpoint did not normalize organization ID.',
  );
  assert(
    getInput.organizationId === 'organization-1',
    'Get endpoint did not normalize organization ID.',
  );
  assert(getInput.machineId === 'machine-1', 'Get endpoint did not normalize machine ID.');
}

async function runValidationSmokeCheck(): Promise<void> {
  await expectBadRequest('missing organization ID', () =>
    createMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      body: {
        organizationId: '   ',
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

  await expectNotFound('machine not found', () =>
    getMachineFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependenciesWithMissingMachine(createCapturedCalls()),
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
  await runCreateMachineSmokeCheck();
  await runReadMachineSmokeCheck();
  await runValidationSmokeCheck();
}

await runMachineRecordsControllerSmokeCheck();

console.info('Machine records controller smoke check passed.');
