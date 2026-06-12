import { BadRequestException } from '@nestjs/common';
import type { MachineRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';
import { MachineStatus } from '@buildtrace/db';

import {
  createMachineFromRequest,
  type CreateMachineEndpointDependencies,
} from './machine-records.controller.js';

type CapturedResolveInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
};

type CapturedCreateMachineInput = {
  readonly db: PrismaClient;
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly actorUserId?: string;
  readonly deliveryDate?: Date;
  readonly plcType?: string;
  readonly hmiType?: string;
  readonly status?: string;
};

type CapturedCalls = {
  readonly resolveInputs: CapturedResolveInput[];
  readonly createMachineInputs: CapturedCreateMachineInput[];
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

function createDependencies(capturedCalls: CapturedCalls): CreateMachineEndpointDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push({
        authorizationHeader: input.authorizationHeader,
        organizationId: input.organizationId,
        db: input.db,
        ...(input.allowedRoles ? { allowedRoles: input.allowedRoles } : {}),
      });

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
      capturedCalls.createMachineInputs.push(input as CapturedCreateMachineInput);

      return fakeMachine;
    },
  };
}

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createMachineInputs: [],
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

async function runMachineRecordsControllerSmokeCheck(): Promise<void> {
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

await runMachineRecordsControllerSmokeCheck();

console.info('Machine records controller smoke check passed.');
