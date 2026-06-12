import { activityLogActions } from '@buildtrace/shared';

import {
  createCustomer,
  createMachine,
  createMachineModel,
  getCustomerByOrganization,
  getMachineByOrganization,
  getMachineModelByOrganization,
  listCustomersByOrganization,
  listMachineModelsByOrganization,
  listMachinesByOrganization,
  updateMachine,
} from './machine-records.js';
import type { PrismaClient } from './generated/prisma/client';
import { MachineStatus } from './generated/prisma/enums';

type CapturedOperation = {
  readonly model: string;
  readonly operation: string;
  readonly args: unknown;
};

type FakeTransactionClient = {
  readonly activityLog: {
    readonly create: (args: unknown) => Promise<unknown>;
  };
  readonly customer: {
    readonly create: (args: unknown) => Promise<unknown>;
    readonly findFirst: (args: unknown) => Promise<unknown>;
    readonly findMany: (args: unknown) => Promise<unknown>;
  };
  readonly machineModel: {
    readonly create: (args: unknown) => Promise<unknown>;
    readonly findFirst: (args: unknown) => Promise<unknown>;
    readonly findMany: (args: unknown) => Promise<unknown>;
  };
  readonly machine: {
    readonly create: (args: unknown) => Promise<unknown>;
    readonly findFirst: (args: unknown) => Promise<unknown>;
    readonly findMany: (args: unknown) => Promise<unknown>;
    readonly update: (args: unknown) => Promise<unknown>;
  };
};

const now = new Date('2026-06-12T00:00:00.000Z');

function createRecord(model: string, args: unknown): Record<string, unknown> {
  const data = (args as { readonly data?: Record<string, unknown> }).data ?? {};

  if (model === 'customer') {
    return {
      id: 'customer-1',
      organizationId: data.organizationId,
      companyName: data.companyName,
      contactName: data.contactName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      country: data.country ?? null,
      preferredLocale: data.preferredLocale,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (model === 'machineModel') {
    return {
      id: 'machine-model-1',
      organizationId: data.organizationId,
      modelName: data.modelName,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (model === 'machine') {
    return {
      id: 'machine-1',
      organizationId: data.organizationId,
      customerId: data.customerId,
      machineModelId: data.machineModelId,
      machineName: data.machineName,
      serialNumber: data.serialNumber,
      status: data.status,
      deliveryDate: data.deliveryDate ?? null,
      plcType: data.plcType ?? null,
      hmiType: data.hmiType ?? null,
      createdAt: now,
      updatedAt: now,
      customer: {
        id: data.customerId,
        companyName: 'Acme Industrial',
      },
      machineModel: {
        id: data.machineModelId,
        modelName: 'MX-100',
      },
    };
  }

  if (model === 'activityLog') {
    return {
      id: 'activity-log-1',
      ...data,
      actorUserId: data.actorUserId ?? null,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      createdAt: now,
    };
  }

  throw new Error(`Unsupported model: ${model}`);
}

function createFindRecord(model: string, args: unknown): Record<string, unknown> {
  const where = (args as { readonly where?: Record<string, unknown> }).where ?? {};

  if (model === 'customer') {
    return {
      id: where.id ?? 'customer-1',
      organizationId: where.organizationId ?? 'organization-1',
      companyName: 'Acme Industrial',
      contactName: null,
      email: null,
      phone: null,
      country: null,
      preferredLocale: 'en',
      createdAt: now,
      updatedAt: now,
    };
  }

  if (model === 'machineModel') {
    return {
      id: where.id ?? 'machine-model-1',
      organizationId: where.organizationId ?? 'organization-1',
      modelName: 'MX-100',
      description: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (model === 'machine') {
    return {
      id: where.id ?? 'machine-1',
      organizationId: where.organizationId ?? 'organization-1',
      customerId: 'customer-1',
      machineModelId: 'machine-model-1',
      machineName: 'Press One',
      serialNumber: 'SN-100',
      status: MachineStatus.ACTIVE,
      deliveryDate: null,
      plcType: null,
      hmiType: null,
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
  }

  throw new Error(`Unsupported find model: ${model}`);
}

function createFakePrismaClient(capturedOperations: CapturedOperation[]): PrismaClient {
  function capture(model: string, operation: string, result: unknown) {
    return async (args: unknown): Promise<unknown> => {
      capturedOperations.push({
        model,
        operation,
        args,
      });

      return result;
    };
  }

  function captureFindFirst(model: string) {
    return async (args: unknown): Promise<unknown> => {
      capturedOperations.push({
        model,
        operation: 'findFirst',
        args,
      });

      return createFindRecord(model, args);
    };
  }

  const tx: FakeTransactionClient = {
    activityLog: {
      create: async (args) => {
        capturedOperations.push({
          model: 'activityLog',
          operation: 'create',
          args,
        });

        return createRecord('activityLog', args);
      },
    },
    customer: {
      create: async (args) => {
        capturedOperations.push({
          model: 'customer',
          operation: 'create',
          args,
        });

        return createRecord('customer', args);
      },
      findFirst: captureFindFirst('customer'),
      findMany: capture('customer', 'findMany', []),
    },
    machineModel: {
      create: async (args) => {
        capturedOperations.push({
          model: 'machineModel',
          operation: 'create',
          args,
        });

        return createRecord('machineModel', args);
      },
      findFirst: captureFindFirst('machineModel'),
      findMany: capture('machineModel', 'findMany', []),
    },
    machine: {
      create: async (args) => {
        capturedOperations.push({
          model: 'machine',
          operation: 'create',
          args,
        });

        return createRecord('machine', args);
      },
      findFirst: captureFindFirst('machine'),
      findMany: capture('machine', 'findMany', []),
      update: async (args) => {
        capturedOperations.push({
          model: 'machine',
          operation: 'update',
          args,
        });

        return createRecord('machine', args);
      },
    },
  };

  return {
    $transaction: async <T>(callback: (transactionClient: FakeTransactionClient) => Promise<T>) =>
      callback(tx),
    customer: {
      findFirst: tx.customer.findFirst,
      findMany: tx.customer.findMany,
    },
    machineModel: {
      findFirst: tx.machineModel.findFirst,
      findMany: tx.machineModel.findMany,
    },
    machine: {
      findFirst: tx.machine.findFirst,
      findMany: tx.machine.findMany,
    },
  } as unknown as PrismaClient;
}

function findOperation(
  capturedOperations: readonly CapturedOperation[],
  model: string,
  operation: string,
): CapturedOperation {
  const foundOperation = capturedOperations.find(
    (capturedOperation) =>
      capturedOperation.model === model && capturedOperation.operation === operation,
  );

  if (!foundOperation) {
    throw new Error(`Expected ${model}.${operation} to be called.`);
  }

  return foundOperation;
}

function findOperations(
  capturedOperations: readonly CapturedOperation[],
  model: string,
  operation: string,
): readonly CapturedOperation[] {
  return capturedOperations.filter(
    (capturedOperation) =>
      capturedOperation.model === model && capturedOperation.operation === operation,
  );
}

function requireOperationAt(
  operations: readonly CapturedOperation[],
  index: number,
  label: string,
): CapturedOperation {
  const operation = operations[index];

  if (!operation) {
    throw new Error(`Expected ${label} operation at index ${index}.`);
  }

  return operation;
}

function getData(operation: CapturedOperation): Record<string, unknown> {
  return (operation.args as { readonly data?: Record<string, unknown> }).data ?? {};
}

function getWhere(operation: CapturedOperation): Record<string, unknown> {
  return (operation.args as { readonly where?: Record<string, unknown> }).where ?? {};
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

function assertOrganizationScopedFind(
  operation: CapturedOperation,
  expectedIdField: string,
  expectedId: string,
): void {
  const where = getWhere(operation);

  if (where.organizationId !== 'organization-1' || where[expectedIdField] !== expectedId) {
    throw new Error(`${operation.model}.${operation.operation} was not scoped by organization.`);
  }
}

async function runMachineRecordsSmokeCheck(): Promise<void> {
  await expectThrows('blank organization ID', () =>
    listMachinesByOrganization({
      db: createFakePrismaClient([]),
      organizationId: '   ',
    }),
  );

  await expectThrows('blank customer ID', () =>
    getCustomerByOrganization({
      db: createFakePrismaClient([]),
      organizationId: 'organization-1',
      customerId: '   ',
    }),
  );

  await expectThrows('blank machine model ID', () =>
    getMachineModelByOrganization({
      db: createFakePrismaClient([]),
      organizationId: 'organization-1',
      machineModelId: '   ',
    }),
  );

  await expectThrows('blank update machine ID', () =>
    updateMachine({
      db: createFakePrismaClient([]),
      organizationId: 'organization-1',
      machineId: '   ',
      customerId: 'customer-1',
      machineModelId: 'machine-model-1',
      machineName: 'Press One',
      serialNumber: 'SN-100',
    }),
  );

  const capturedOperations: CapturedOperation[] = [];
  const db = createFakePrismaClient(capturedOperations);

  await createCustomer({
    db,
    organizationId: ' organization-1 ',
    companyName: ' Acme Industrial ',
    actorUserId: ' app-user-1 ',
    contactName: ' Builder One ',
    email: ' builder@example.com ',
    phone: ' +420123456789 ',
    country: ' CZ ',
  });

  await createMachineModel({
    db,
    organizationId: ' organization-1 ',
    modelName: ' MX-100 ',
    actorUserId: ' app-user-1 ',
    description: ' Compact press ',
  });

  await createMachine({
    db,
    organizationId: ' organization-1 ',
    customerId: ' customer-1 ',
    machineModelId: ' machine-model-1 ',
    machineName: ' Press One ',
    serialNumber: ' SN-100 ',
    actorUserId: ' app-user-1 ',
    plcType: ' S7-1500 ',
    hmiType: ' Comfort Panel ',
    status: MachineStatus.ACTIVE,
  });

  await updateMachine({
    db,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
    customerId: ' customer-1 ',
    machineModelId: ' machine-model-1 ',
    machineName: ' Press One Updated ',
    serialNumber: ' SN-101 ',
    actorUserId: ' app-user-1 ',
    deliveryDate: new Date('2026-06-12T00:00:00.000Z'),
    plcType: ' S7-1500F ',
    hmiType: ' Comfort Panel Pro ',
    status: MachineStatus.MAINTENANCE,
  });

  await listCustomersByOrganization({
    db,
    organizationId: ' organization-1 ',
  });

  await getCustomerByOrganization({
    db,
    organizationId: ' organization-1 ',
    customerId: ' customer-1 ',
  });

  await listMachineModelsByOrganization({
    db,
    organizationId: ' organization-1 ',
  });

  await getMachineModelByOrganization({
    db,
    organizationId: ' organization-1 ',
    machineModelId: ' machine-model-1 ',
  });

  await listMachinesByOrganization({
    db,
    organizationId: ' organization-1 ',
  });

  await getMachineByOrganization({
    db,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
  });

  const customerCreateData = getData(findOperation(capturedOperations, 'customer', 'create'));

  if (
    customerCreateData.organizationId !== 'organization-1' ||
    customerCreateData.companyName !== 'Acme Industrial'
  ) {
    throw new Error('Customer helper did not normalize required create fields.');
  }

  const machineCreateData = getData(findOperation(capturedOperations, 'machine', 'create'));

  if (
    machineCreateData.organizationId !== 'organization-1' ||
    machineCreateData.customerId !== 'customer-1' ||
    machineCreateData.machineModelId !== 'machine-model-1' ||
    machineCreateData.machineName !== 'Press One' ||
    machineCreateData.serialNumber !== 'SN-100'
  ) {
    throw new Error('Machine helper did not normalize required create fields.');
  }

  const machineUpdateOperation = findOperation(capturedOperations, 'machine', 'update');
  const machineUpdateData = getData(machineUpdateOperation);
  const machineUpdateWhere = getWhere(machineUpdateOperation);

  if (
    machineUpdateWhere.id !== 'machine-1' ||
    machineUpdateWhere.organizationId !== 'organization-1' ||
    machineUpdateData.customerId !== 'customer-1' ||
    machineUpdateData.machineModelId !== 'machine-model-1' ||
    machineUpdateData.machineName !== 'Press One Updated' ||
    machineUpdateData.serialNumber !== 'SN-101' ||
    machineUpdateData.status !== MachineStatus.MAINTENANCE ||
    machineUpdateData.plcType !== 'S7-1500F' ||
    machineUpdateData.hmiType !== 'Comfort Panel Pro'
  ) {
    throw new Error('Machine update helper did not normalize and scope update fields.');
  }

  const activityActions = capturedOperations
    .filter((operation) => operation.model === 'activityLog')
    .map((operation) => getData(operation).action);

  if (
    !activityActions.includes(activityLogActions.customerCreated) ||
    !activityActions.includes(activityLogActions.machineModelCreated) ||
    !activityActions.includes(activityLogActions.machineCreated) ||
    !activityActions.includes(activityLogActions.machineUpdated)
  ) {
    throw new Error('Machine record helpers did not write the expected activity log actions.');
  }

  const customerFindOperations = findOperations(capturedOperations, 'customer', 'findFirst');
  const machineModelFindOperations = findOperations(
    capturedOperations,
    'machineModel',
    'findFirst',
  );
  const machineFindOperations = findOperations(capturedOperations, 'machine', 'findFirst');

  if (
    customerFindOperations.length < 3 ||
    machineModelFindOperations.length < 3 ||
    machineFindOperations.length < 2
  ) {
    throw new Error('Read helpers and ownership checks were not fully exercised.');
  }

  assertOrganizationScopedFind(
    requireOperationAt(customerFindOperations, 0, 'create machine customer ownership check'),
    'id',
    'customer-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(customerFindOperations, 1, 'update machine customer ownership check'),
    'id',
    'customer-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(customerFindOperations, 2, 'customer read helper'),
    'id',
    'customer-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(machineModelFindOperations, 0, 'create machine model ownership check'),
    'id',
    'machine-model-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(machineModelFindOperations, 1, 'update machine model ownership check'),
    'id',
    'machine-model-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(machineModelFindOperations, 2, 'machine model read helper'),
    'id',
    'machine-model-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(machineFindOperations, 0, 'update machine ownership check'),
    'id',
    'machine-1',
  );
  assertOrganizationScopedFind(
    requireOperationAt(machineFindOperations, 1, 'machine read helper'),
    'id',
    'machine-1',
  );

  const customerListWhere = getWhere(findOperation(capturedOperations, 'customer', 'findMany'));
  const machineModelListWhere = getWhere(
    findOperation(capturedOperations, 'machineModel', 'findMany'),
  );
  const machineListWhere = getWhere(findOperation(capturedOperations, 'machine', 'findMany'));

  if (
    customerListWhere.organizationId !== 'organization-1' ||
    machineModelListWhere.organizationId !== 'organization-1' ||
    machineListWhere.organizationId !== 'organization-1'
  ) {
    throw new Error('Machine record helpers did not scope list reads by organization.');
  }
}

await runMachineRecordsSmokeCheck();

console.info('Machine records smoke check passed.');
