import { randomUUID } from 'node:crypto';
import { config as loadDotenv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPrismaClient } from './client.js';
import type { PrismaClient } from './generated/prisma/client';
import { MachineStatus } from './generated/prisma/enums';
import {
  createCustomer,
  createMachine,
  createMachineModel,
  getMachineByOrganization,
  listMachinesByOrganization,
  updateMachine,
} from './machine-records.js';

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

loadDotenv();
loadDotenv({
  path: resolve(sourceDirectory, '../../../.env'),
  override: false,
});

type IsolationFixtureInput = {
  readonly label: 'A' | 'B';
  readonly organizationSlug: string;
};

type IsolationFixture = {
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineId: string;
  readonly serialNumber: string;
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${String(expected)}, received ${String(actual)}.`);
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

function assertNonProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Machine record isolation check must never run in production.');
  }
}

async function cleanupIsolationFixtures(
  db: PrismaClient,
  organizationSlugs: readonly string[],
): Promise<void> {
  const organizations = await db.organization.findMany({
    where: {
      slug: {
        in: [...organizationSlugs],
      },
    },
    select: {
      id: true,
    },
  });

  const organizationIds = organizations.map((organization) => organization.id);

  if (organizationIds.length === 0) {
    return;
  }

  await db.activityLog.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  });

  await db.machine.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  });

  await db.customer.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  });

  await db.machineModel.deleteMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
  });

  await db.organization.deleteMany({
    where: {
      id: {
        in: organizationIds,
      },
    },
  });
}

async function createIsolationFixture(
  db: PrismaClient,
  fixtureInput: IsolationFixtureInput,
): Promise<IsolationFixture> {
  const organization = await db.organization.create({
    data: {
      name: `Tenant Isolation ${fixtureInput.label}`,
      slug: fixtureInput.organizationSlug,
    },
  });

  const customer = await createCustomer({
    db,
    organizationId: organization.id,
    companyName: `Tenant Isolation Customer ${fixtureInput.label}`,
    contactName: `Tenant Contact ${fixtureInput.label}`,
    email: `customer-${fixtureInput.label.toLowerCase()}-${randomUUID()}@buildtrace.test`,
    phone: `+42000000000${fixtureInput.label === 'A' ? '1' : '2'}`,
    country: 'CZ',
    preferredLocale: 'en',
  });

  const machineModel = await createMachineModel({
    db,
    organizationId: organization.id,
    modelName: `Tenant Isolation Model ${fixtureInput.label}`,
    description: `Tenant isolation model fixture ${fixtureInput.label}`,
  });

  const machine = await createMachine({
    db,
    organizationId: organization.id,
    customerId: customer.id,
    machineModelId: machineModel.id,
    machineName: `Tenant Isolation Machine ${fixtureInput.label}`,
    serialNumber: `TENANT-${fixtureInput.label}-${randomUUID()}`,
    deliveryDate: new Date('2026-06-12T00:00:00.000Z'),
    plcType: `PLC ${fixtureInput.label}`,
    hmiType: `HMI ${fixtureInput.label}`,
    status: MachineStatus.ACTIVE,
  });

  return {
    organizationId: organization.id,
    customerId: customer.id,
    machineModelId: machineModel.id,
    machineId: machine.id,
    serialNumber: machine.serialNumber,
  };
}

async function runMachineRecordIsolationCheck(): Promise<void> {
  assertNonProductionEnvironment();

  const db = createPrismaClient();
  const runId = randomUUID();
  const fixtureInputs = [
    {
      label: 'A',
      organizationSlug: `tenant-isolation-a-${runId}`,
    },
    {
      label: 'B',
      organizationSlug: `tenant-isolation-b-${runId}`,
    },
  ] as const;
  const organizationSlugs = fixtureInputs.map((fixtureInput) => fixtureInput.organizationSlug);

  try {
    const fixtureA = await createIsolationFixture(db, fixtureInputs[0]);
    const fixtureB = await createIsolationFixture(db, fixtureInputs[1]);

    const organizationAMachines = await listMachinesByOrganization({
      db,
      organizationId: fixtureA.organizationId,
    });
    const organizationBMachines = await listMachinesByOrganization({
      db,
      organizationId: fixtureB.organizationId,
    });

    assertEqual(
      organizationAMachines.length,
      1,
      'Organization A must list exactly its fixture machine.',
    );
    assertEqual(
      organizationBMachines.length,
      1,
      'Organization B must list exactly its fixture machine.',
    );
    assertEqual(
      organizationAMachines[0]?.serialNumber,
      fixtureA.serialNumber,
      'Organization A list must return its own machine.',
    );
    assertEqual(
      organizationBMachines[0]?.serialNumber,
      fixtureB.serialNumber,
      'Organization B list must return its own machine.',
    );
    assert(
      organizationAMachines.every((machine) => machine.organizationId === fixtureA.organizationId),
      'Organization A list leaked a machine from another tenant.',
    );
    assert(
      organizationBMachines.every((machine) => machine.organizationId === fixtureB.organizationId),
      'Organization B list leaked a machine from another tenant.',
    );

    const organizationAReadsOwnMachine = await getMachineByOrganization({
      db,
      organizationId: fixtureA.organizationId,
      machineId: fixtureA.machineId,
    });
    const organizationBReadsMachineA = await getMachineByOrganization({
      db,
      organizationId: fixtureB.organizationId,
      machineId: fixtureA.machineId,
    });

    assert(
      organizationAReadsOwnMachine !== null,
      'Organization A must be able to read its own machine.',
    );
    assertEqual(
      organizationBReadsMachineA,
      null,
      'Organization B must not read Organization A machine by ID.',
    );

    await expectThrows('cross-tenant machine update', () =>
      updateMachine({
        db,
        organizationId: fixtureB.organizationId,
        machineId: fixtureA.machineId,
        customerId: fixtureB.customerId,
        machineModelId: fixtureB.machineModelId,
        machineName: 'Cross Tenant Update',
        serialNumber: `CROSS-${runId}`,
        status: MachineStatus.MAINTENANCE,
      }),
    );

    await expectThrows('cross-tenant customer create', () =>
      createMachine({
        db,
        organizationId: fixtureB.organizationId,
        customerId: fixtureA.customerId,
        machineModelId: fixtureB.machineModelId,
        machineName: 'Invalid Cross Tenant Customer Machine',
        serialNumber: `INVALID-CUSTOMER-${runId}`,
        status: MachineStatus.ACTIVE,
      }),
    );

    await expectThrows('cross-tenant model create', () =>
      createMachine({
        db,
        organizationId: fixtureB.organizationId,
        customerId: fixtureB.customerId,
        machineModelId: fixtureA.machineModelId,
        machineName: 'Invalid Cross Tenant Model Machine',
        serialNumber: `INVALID-MODEL-${runId}`,
        status: MachineStatus.ACTIVE,
      }),
    );

    const updatedMachineA = await updateMachine({
      db,
      organizationId: fixtureA.organizationId,
      machineId: fixtureA.machineId,
      customerId: fixtureA.customerId,
      machineModelId: fixtureA.machineModelId,
      machineName: 'Tenant Isolation Machine A Updated',
      serialNumber: `${fixtureA.serialNumber}-UPDATED`,
      deliveryDate: new Date('2026-06-13T00:00:00.000Z'),
      plcType: 'PLC A Updated',
      hmiType: 'HMI A Updated',
      status: MachineStatus.MAINTENANCE,
    });

    assertEqual(
      updatedMachineA.organizationId,
      fixtureA.organizationId,
      'Valid update must keep the machine in its tenant.',
    );
    assertEqual(
      updatedMachineA.status,
      MachineStatus.MAINTENANCE,
      'Valid update must apply status changes.',
    );

    const organizationBAfterFailedWrites = await listMachinesByOrganization({
      db,
      organizationId: fixtureB.organizationId,
    });

    assertEqual(
      organizationBAfterFailedWrites.length,
      1,
      'Failed cross-tenant writes must not create Organization B machines.',
    );
    assertEqual(
      organizationBAfterFailedWrites[0]?.id,
      fixtureB.machineId,
      'Organization B machine list must remain unchanged after failed cross-tenant writes.',
    );

    const activityLogs = await db.activityLog.findMany({
      where: {
        organizationId: {
          in: [fixtureA.organizationId, fixtureB.organizationId],
        },
      },
      select: {
        organizationId: true,
        targetId: true,
      },
    });

    assert(
      activityLogs.every(
        (log) =>
          log.organizationId === fixtureA.organizationId ||
          log.organizationId === fixtureB.organizationId,
      ),
      'Activity logs must remain scoped to the fixture organizations.',
    );

    console.info('Machine record tenant isolation check passed.');
  } finally {
    await cleanupIsolationFixtures(db, organizationSlugs);
    await db.$disconnect();
  }
}

await runMachineRecordIsolationCheck();
