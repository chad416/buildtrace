import { activityLogActions } from '@buildtrace/shared';

import {
  createCustomer,
  createMachine,
  createMachineModel,
  getMachineByOrganization,
  listCustomersByOrganization,
  listMachineModelsByOrganization,
  listMachinesByOrganization,
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
      findFirst: capture('customer', 'findFirst', { id: 'customer-1' }),
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
      findFirst: capture('machineModel', 'findFirst', { id: 'machine-model-1' }),
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
      findFirst: capture('machine', 'findFirst', null),
      findMany: capture('machine', 'findMany', []),
    },
  };

  return {
    $transaction: async <T>(callback: (transactionClient: FakeTransactionClient) => Promise<T>) =>
      callback(tx),
    customer: {
      findMany: tx.customer.findMany,
    },
    machineModel: {
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

async function runMachineRecordsSmokeCheck(): Promise<void> {
  await expectThrows('blank organization ID', () =>
    listMachinesByOrganization({
      db: createFakePrismaClient([]),
      organizationId: '   ',
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

  await listCustomersByOrganization({
    db,
    organizationId: ' organization-1 ',
  });

  await listMachineModelsByOrganization({
    db,
    organizationId: ' organization-1 ',
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

  const activityActions = capturedOperations
    .filter((operation) => operation.model === 'activityLog')
    .map((operation) => getData(operation).action);

  if (
    !activityActions.includes(activityLogActions.customerCreated) ||
    !activityActions.includes(activityLogActions.machineModelCreated) ||
    !activityActions.includes(activityLogActions.machineCreated)
  ) {
    throw new Error('Machine record helpers did not write the expected activity log actions.');
  }

  const customerOwnershipWhere = getWhere(
    findOperation(capturedOperations, 'customer', 'findFirst'),
  );
  const machineModelOwnershipWhere = getWhere(
    findOperation(capturedOperations, 'machineModel', 'findFirst'),
  );

  if (
    customerOwnershipWhere.organizationId !== 'organization-1' ||
    customerOwnershipWhere.id !== 'customer-1' ||
    machineModelOwnershipWhere.organizationId !== 'organization-1' ||
    machineModelOwnershipWhere.id !== 'machine-model-1'
  ) {
    throw new Error('Machine helper did not validate related records inside the organization.');
  }

  const customerListWhere = getWhere(findOperation(capturedOperations, 'customer', 'findMany'));
  const machineListWhere = getWhere(findOperation(capturedOperations, 'machine', 'findMany'));
  const machineGetWhere = getWhere(findOperation(capturedOperations, 'machine', 'findFirst'));

  if (
    customerListWhere.organizationId !== 'organization-1' ||
    machineListWhere.organizationId !== 'organization-1' ||
    machineGetWhere.organizationId !== 'organization-1' ||
    machineGetWhere.id !== 'machine-1'
  ) {
    throw new Error('Machine record helpers did not scope reads by organization.');
  }
}

await runMachineRecordsSmokeCheck();

console.info('Machine records smoke check passed.');
