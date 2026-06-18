import { createPendingCustomerHandoverExport } from './data-export-records';
import { createPrismaClient } from './client';
import {
  DataExportAudience,
  DataExportResult,
  DocumentCategory,
  DocumentVisibilityLevel,
  MachineStatus,
} from './generated/prisma/enums';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function mustReject(operation: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await operation();
  } catch {
    return;
  }

  throw new Error(message);
}

function asObject(value: unknown, message: string): Record<string, unknown> {
  assert(typeof value === 'object' && value !== null && !Array.isArray(value), message);

  return value as Record<string, unknown>;
}

async function run(): Promise<void> {
  const db = createPrismaClient();
  const suffix = Date.now() + '-' + Math.random().toString(16).slice(2);
  const organizationIds: string[] = [];
  const userIds: string[] = [];

  try {
    const [organizationA, organizationB] = await Promise.all([
      db.organization.create({
        data: {
          name: 'Export A ' + suffix,
          slug: 'export-a-' + suffix,
        },
      }),
      db.organization.create({
        data: {
          name: 'Export B ' + suffix,
          slug: 'export-b-' + suffix,
        },
      }),
    ]);

    organizationIds.push(organizationA.id, organizationB.id);

    const [userA, userB] = await Promise.all([
      db.appUser.create({
        data: {
          authUserId: crypto.randomUUID(),
          email: 'export-a-' + suffix + '@example.com',
        },
      }),
      db.appUser.create({
        data: {
          authUserId: crypto.randomUUID(),
          email: 'export-b-' + suffix + '@example.com',
        },
      }),
    ]);

    userIds.push(userA.id, userB.id);

    await Promise.all([
      db.organizationMembership.create({
        data: {
          organizationId: organizationA.id,
          appUserId: userA.id,
        },
      }),
      db.organizationMembership.create({
        data: {
          organizationId: organizationB.id,
          appUserId: userB.id,
        },
      }),
    ]);

    const [customerA, customerB, modelA, modelB] = await Promise.all([
      db.customer.create({
        data: {
          organizationId: organizationA.id,
          companyName: 'Customer A',
        },
      }),
      db.customer.create({
        data: {
          organizationId: organizationB.id,
          companyName: 'Customer B',
        },
      }),
      db.machineModel.create({
        data: {
          organizationId: organizationA.id,
          modelName: 'Model A',
        },
      }),
      db.machineModel.create({
        data: {
          organizationId: organizationB.id,
          modelName: 'Model B',
        },
      }),
    ]);

    const [machineA, machineB] = await Promise.all([
      db.machine.create({
        data: {
          organizationId: organizationA.id,
          customerId: customerA.id,
          machineModelId: modelA.id,
          machineName: 'Machine A',
          serialNumber: 'A-' + suffix,
          status: MachineStatus.ACTIVE,
        },
      }),
      db.machine.create({
        data: {
          organizationId: organizationB.id,
          customerId: customerB.id,
          machineModelId: modelB.id,
          machineName: 'Machine B',
          serialNumber: 'B-' + suffix,
          status: MachineStatus.ACTIVE,
        },
      }),
    ]);

    const [eligibleA, privateA, eligibleB] = await Promise.all([
      db.document.create({
        data: {
          organizationId: organizationA.id,
          machineId: machineA.id,
          fileName: 'manual-a.pdf',
          storagePath: 'exports/' + suffix + '/manual-a.pdf',
          fileType: 'application/pdf',
          category: DocumentCategory.MANUALS,
          visibilityLevel: DocumentVisibilityLevel.CUSTOMER_VISIBLE,
          visibleToCustomer: true,
          checksum: 'checksum-a-' + suffix,
        },
      }),
      db.document.create({
        data: {
          organizationId: organizationA.id,
          machineId: machineA.id,
          fileName: 'private-a.pdf',
          storagePath: 'exports/' + suffix + '/private-a.pdf',
          fileType: 'application/pdf',
          category: DocumentCategory.CERTIFICATES,
          visibilityLevel: DocumentVisibilityLevel.INTERNAL,
          visibleToCustomer: false,
          checksum: 'checksum-private-' + suffix,
        },
      }),
      db.document.create({
        data: {
          organizationId: organizationB.id,
          machineId: machineB.id,
          fileName: 'manual-b.pdf',
          storagePath: 'exports/' + suffix + '/manual-b.pdf',
          fileType: 'application/pdf',
          category: DocumentCategory.MANUALS,
          visibilityLevel: DocumentVisibilityLevel.CUSTOMER_VISIBLE,
          visibleToCustomer: true,
          checksum: 'checksum-b-' + suffix,
        },
      }),
    ]);

    const base = {
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      requestedByUserId: userA.id,
    };

    await mustReject(
      () =>
        createPendingCustomerHandoverExport({
          ...base,
          requestedByUserId: userB.id,
          documentIds: [eligibleA.id],
        }),
      'A non-member must not create an export.',
    );

    await mustReject(
      () =>
        createPendingCustomerHandoverExport({
          ...base,
          documentIds: [privateA.id],
        }),
      'An internal document must fail closed.',
    );

    await mustReject(
      () =>
        createPendingCustomerHandoverExport({
          ...base,
          documentIds: [eligibleB.id],
        }),
      'A cross-tenant document must be rejected.',
    );

    await mustReject(
      () =>
        createPendingCustomerHandoverExport({
          ...base,
          documentIds: [eligibleA.id, eligibleA.id],
        }),
      'Duplicate document IDs must be rejected.',
    );

    const created = await createPendingCustomerHandoverExport({
      ...base,
      documentIds: [eligibleA.id],
    });

    assert(created.organizationId === organizationA.id, 'Export organization mismatch.');
    assert(created.machineId === machineA.id, 'Export machine mismatch.');
    assert(created.requestedByUserId === userA.id, 'Export actor mismatch.');
    assert(created.audience === DataExportAudience.CUSTOMER_HANDOVER, 'Export audience mismatch.');
    assert(created.result === DataExportResult.PENDING, 'New export must be pending.');
    assert(created.completedAt === null, 'Pending export must not be completed.');

    const manifest = asObject(created.manifest, 'Manifest must be an object.');

    assert(Array.isArray(manifest.documents), 'Manifest documents must be an array.');
    assert(manifest.documents.length === 1, 'Manifest must contain one document.');

    const entry = asObject(manifest.documents[0], 'Manifest entry must be an object.');

    assert(entry.documentId === eligibleA.id, 'Manifest document mismatch.');
    assert(entry.storagePath === eligibleA.storagePath, 'Manifest storage path mismatch.');
    assert(entry.checksum === eligibleA.checksum, 'Manifest checksum mismatch.');
    assert(entry.visibilityLevel === 'customer-visible', 'Manifest visibility mismatch.');
    assert(entry.visibleToCustomer === true, 'Manifest customer exposure mismatch.');

    const exportCount = await db.dataExport.count({
      where: {
        organizationId: organizationA.id,
      },
    });

    assert(exportCount === 1, 'Rejected attempts must not persist export rows.');
  } finally {
    if (organizationIds.length > 0) {
      await db.dataExport.deleteMany({
        where: {
          organizationId: {
            in: organizationIds,
          },
        },
      });
      await db.document.deleteMany({
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
      await db.machineModel.deleteMany({
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
      await db.organizationMembership.deleteMany({
        where: {
          organizationId: {
            in: organizationIds,
          },
        },
      });
    }

    if (userIds.length > 0) {
      await db.appUser.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    }

    if (organizationIds.length > 0) {
      await db.organization.deleteMany({
        where: {
          id: {
            in: organizationIds,
          },
        },
      });
    }

    await db.$disconnect();
  }
}

await run();

console.info('Data export records isolation check passed.');
