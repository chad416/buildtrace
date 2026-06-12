import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { createPrismaClient } from './client.js';
import type { PrismaClient } from './generated/prisma/client';
import { MachineStatus, OrganizationRole } from './generated/prisma/enums';

type IsolationFixtureInput = {
  readonly label: 'A' | 'B';
  readonly organizationSlug: string;
  readonly authUserId: string;
  readonly userEmail: string;
};

type IsolationFixture = {
  readonly organizationId: string;
  readonly machineId: string;
  readonly serialNumber: string;
};

type MachineRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly serialNumber: string;
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNonProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Machine record isolation check must never run in production.');
  }
}

async function cleanupIsolationFixtures(
  db: PrismaClient,
  organizationSlugs: readonly string[],
  authUserIds: readonly string[],
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

  if (organizationIds.length > 0) {
    await db.machine.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    });

    await db.activityLog.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    });

    await db.organizationMembership.deleteMany({
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

  await db.appUser.deleteMany({
    where: {
      authUserId: {
        in: [...authUserIds],
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

  const appUser = await db.appUser.create({
    data: {
      authUserId: fixtureInput.authUserId,
      email: fixtureInput.userEmail,
      displayName: `Tenant Isolation User ${fixtureInput.label}`,
    },
  });

  await db.organizationMembership.create({
    data: {
      organizationId: organization.id,
      appUserId: appUser.id,
      role: OrganizationRole.OWNER,
    },
  });

  const customer = await db.customer.create({
    data: {
      organizationId: organization.id,
      companyName: `Tenant Isolation Customer ${fixtureInput.label}`,
      contactName: `Tenant Contact ${fixtureInput.label}`,
      email: `customer-${fixtureInput.label.toLowerCase()}-${fixtureInput.authUserId}@buildtrace.test`,
      phone: `+42000000000${fixtureInput.label === 'A' ? '1' : '2'}`,
      country: 'CZ',
      preferredLocale: 'en',
    },
  });

  const machineModel = await db.machineModel.create({
    data: {
      organizationId: organization.id,
      modelName: `Tenant Isolation Model ${fixtureInput.label}`,
      description: `Tenant isolation model fixture ${fixtureInput.label}`,
    },
  });

  const machine = await db.machine.create({
    data: {
      organizationId: organization.id,
      customerId: customer.id,
      machineModelId: machineModel.id,
      machineName: `Tenant Isolation Machine ${fixtureInput.label}`,
      serialNumber: `TENANT-${fixtureInput.label}-${fixtureInput.authUserId}`,
      deliveryDate: new Date('2026-06-12T00:00:00.000Z'),
      plcType: `PLC ${fixtureInput.label}`,
      hmiType: `HMI ${fixtureInput.label}`,
      status: MachineStatus.ACTIVE,
    },
  });

  return {
    organizationId: organization.id,
    machineId: machine.id,
    serialNumber: machine.serialNumber,
  };
}

async function listMachineRecordsForOrganization(
  db: PrismaClient,
  organizationId: string,
): Promise<readonly MachineRecord[]> {
  return db.machine.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      serialNumber: true,
    },
    orderBy: {
      serialNumber: 'asc',
    },
  });
}

async function runMachineRecordIsolationCheck(): Promise<void> {
  assertNonProductionEnvironment();

  const db = createPrismaClient();
  const runId = randomUUID();

  const fixtureInputs = [
    {
      label: 'A',
      organizationSlug: `tenant-isolation-a-${runId}`,
      authUserId: randomUUID(),
      userEmail: `tenant-isolation-a-${runId}@buildtrace.test`,
    },
    {
      label: 'B',
      organizationSlug: `tenant-isolation-b-${runId}`,
      authUserId: randomUUID(),
      userEmail: `tenant-isolation-b-${runId}@buildtrace.test`,
    },
  ] as const;

  const organizationSlugs = fixtureInputs.map((fixtureInput) => fixtureInput.organizationSlug);
  const authUserIds = fixtureInputs.map((fixtureInput) => fixtureInput.authUserId);

  try {
    const fixtureA = await createIsolationFixture(db, fixtureInputs[0]);
    const fixtureB = await createIsolationFixture(db, fixtureInputs[1]);

    const allFixtureMachines = await db.machine.findMany({
      where: {
        id: {
          in: [fixtureA.machineId, fixtureB.machineId],
        },
      },
      select: {
        id: true,
      },
    });

    assert(allFixtureMachines.length === 2, 'Isolation fixture setup did not create two machines.');

    const organizationAMachines = await listMachineRecordsForOrganization(
      db,
      fixtureA.organizationId,
    );
    const organizationBMachines = await listMachineRecordsForOrganization(
      db,
      fixtureB.organizationId,
    );

    assert(
      organizationAMachines.length === 1,
      'Organization A query returned the wrong machine count.',
    );

    assert(
      organizationBMachines.length === 1,
      'Organization B query returned the wrong machine count.',
    );

    assert(
      organizationAMachines[0]?.serialNumber === fixtureA.serialNumber,
      'Organization A query did not return its own machine.',
    );

    assert(
      organizationBMachines[0]?.serialNumber === fixtureB.serialNumber,
      'Organization B query did not return its own machine.',
    );

    assert(
      organizationAMachines.every((machine) => machine.organizationId === fixtureA.organizationId),
      'Organization A query leaked a machine from another organization.',
    );

    assert(
      organizationBMachines.every((machine) => machine.organizationId === fixtureB.organizationId),
      'Organization B query leaked a machine from another organization.',
    );

    console.info('Machine record tenant isolation check passed.');
  } finally {
    await cleanupIsolationFixtures(db, organizationSlugs, authUserIds);
    await db.$disconnect();
  }
}

void runMachineRecordIsolationCheck();
