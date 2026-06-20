import {
  assignQrToken,
  generateQrToken,
  getMachineQrToken,
  getQrPortalMachine,
} from './qr-portal-records.js';
import type { PrismaClient } from './generated/prisma/client';
import { MachineStatus } from './generated/prisma/enums';

type CapturedOperation = {
  readonly model: string;
  readonly operation: string;
  readonly args: unknown;
};

type FakeMachineClient = {
  readonly updateMany: (args: unknown) => Promise<{ readonly count: number }>;
  readonly findFirst: (args: unknown) => Promise<unknown>;
};

const now = new Date('2026-06-21T00:00:00.000Z');

function assertGenerateQrTokenBehavior(): void {
  const firstToken = generateQrToken();
  const secondToken = generateQrToken();

  if (!firstToken) {
    throw new Error('generateQrToken() returned an empty string.');
  }

  if (firstToken.length < 32) {
    throw new Error('generateQrToken() returned a token shorter than 32 characters.');
  }

  if (firstToken === secondToken) {
    throw new Error('generateQrToken() returned identical tokens on consecutive calls.');
  }
}

function createFakePrismaClient(
  capturedOperations: CapturedOperation[],
  options: {
    readonly updateCount?: number;
    readonly storedQrToken?: string | null;
  } = {},
): PrismaClient {
  const machine: FakeMachineClient = {
    updateMany: async (args) => {
      capturedOperations.push({
        model: 'machine',
        operation: 'updateMany',
        args,
      });

      return {
        count: options.updateCount ?? 1,
      };
    },
    findFirst: async (args) => {
      capturedOperations.push({
        model: 'machine',
        operation: 'findFirst',
        args,
      });

      const where = (args as { readonly where?: Record<string, unknown> }).where ?? {};
      const select = (args as { readonly select?: Record<string, boolean> }).select;

      if (select?.qrToken) {
        return {
          qrToken: options.storedQrToken ?? null,
        };
      }

      if (typeof where.qrToken !== 'string') {
        return null;
      }

      return {
        id: 'machine-1',
        organizationId: 'organization-1',
        customerId: 'customer-1',
        machineModelId: 'machine-model-1',
        machineName: 'Press One',
        serialNumber: 'SN-100',
        deliveryDate: null,
        plcType: null,
        hmiType: null,
        status: MachineStatus.ACTIVE,
        qrToken: where.qrToken,
        qrPinEnabled: false,
        qrPinHash: null,
        portalDefaultLocale: 'en',
        createdAt: now,
        updatedAt: now,
      };
    },
  };

  return {
    machine,
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

function getWhere(operation: CapturedOperation): Record<string, unknown> {
  return (operation.args as { readonly where?: Record<string, unknown> }).where ?? {};
}

function getData(operation: CapturedOperation): Record<string, unknown> {
  return (operation.args as { readonly data?: Record<string, unknown> }).data ?? {};
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

async function runQrPortalRecordsSmokeCheck(): Promise<void> {
  assertGenerateQrTokenBehavior();

  await expectThrows('blank organization ID for assignQrToken', () =>
    assignQrToken({
      db: createFakePrismaClient([]),
      organizationId: '   ',
      machineId: 'machine-1',
    }),
  );

  await expectThrows('blank machine ID for assignQrToken', () =>
    assignQrToken({
      db: createFakePrismaClient([]),
      organizationId: 'organization-1',
      machineId: '   ',
    }),
  );

  await expectThrows('blank QR token for getQrPortalMachine', () =>
    getQrPortalMachine({
      db: createFakePrismaClient([]),
      qrToken: '   ',
    }),
  );

  const assignOperations: CapturedOperation[] = [];
  const assignDb = createFakePrismaClient(assignOperations);
  const assigned = await assignQrToken({
    db: assignDb,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
  });

  if (!assigned.qrToken || assigned.qrToken.length < 32) {
    throw new Error('assignQrToken() did not return a valid QR token.');
  }

  const assignUpdateOperation = findOperation(assignOperations, 'machine', 'updateMany');
  const assignUpdateWhere = getWhere(assignUpdateOperation);
  const assignUpdateData = getData(assignUpdateOperation);

  if (
    assignUpdateWhere.id !== 'machine-1' ||
    assignUpdateWhere.organizationId !== 'organization-1' ||
    assignUpdateData.qrToken !== assigned.qrToken
  ) {
    throw new Error('assignQrToken() did not scope and update the machine correctly.');
  }

  const portalOperations: CapturedOperation[] = [];
  const portalDb = createFakePrismaClient(portalOperations);
  const portalMachine = await getQrPortalMachine({
    db: portalDb,
    qrToken: ` ${assigned.qrToken} `,
  });

  if (!portalMachine || portalMachine.qrToken !== assigned.qrToken.trim()) {
    throw new Error('getQrPortalMachine() did not return the expected machine record.');
  }

  const portalFindWhere = getWhere(findOperation(portalOperations, 'machine', 'findFirst'));

  if (portalFindWhere.qrToken !== assigned.qrToken) {
    throw new Error('getQrPortalMachine() did not query by the normalized QR token.');
  }

  if (portalFindWhere.organizationId) {
    throw new Error('getQrPortalMachine() should not scope by organization ID.');
  }

  const tokenReadOperations: CapturedOperation[] = [];
  const tokenReadDb = createFakePrismaClient(tokenReadOperations, {
    storedQrToken: assigned.qrToken,
  });
  const machineToken = await getMachineQrToken({
    db: tokenReadDb,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
  });

  if (machineToken.qrToken !== assigned.qrToken) {
    throw new Error('getMachineQrToken() did not return the stored QR token.');
  }

  const tokenReadWhere = getWhere(findOperation(tokenReadOperations, 'machine', 'findFirst'));

  if (tokenReadWhere.id !== 'machine-1' || tokenReadWhere.organizationId !== 'organization-1') {
    throw new Error('getMachineQrToken() did not scope by organization and machine ID.');
  }

  const missingMachineDb = createFakePrismaClient([], { updateCount: 0 });

  await expectThrows('missing machine for assignQrToken', () =>
    assignQrToken({
      db: missingMachineDb,
      organizationId: 'organization-1',
      machineId: 'machine-1',
    }),
  );
}

await runQrPortalRecordsSmokeCheck();

console.info('QR portal records smoke check passed.');
