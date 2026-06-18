import {
  completeCustomerHandoverExport,
  createPendingCustomerHandoverExport,
} from './data-export-records';
import { revalidatePendingCustomerHandoverExport } from './data-export-revalidation';
import { createPrismaClient } from './client';
import type { Prisma } from './generated/prisma/client';
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
          storagePath:
            'organizations/' +
            organizationA.id +
            '/machines/' +
            machineA.id +
            '/documents/manual-a/manual-a.pdf',
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
          storagePath:
            'organizations/' +
            organizationA.id +
            '/machines/' +
            machineA.id +
            '/documents/private-a/private-a.pdf',
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
          storagePath:
            'organizations/' +
            organizationB.id +
            '/machines/' +
            machineB.id +
            '/documents/manual-b/manual-b.pdf',
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
    const revalidated = await revalidatePendingCustomerHandoverExport({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      exportId: created.id,
    });

    assert(revalidated.documents.length === 1, 'Revalidation must return one document.');
    assert(
      revalidated.documents[0]?.documentId === eligibleA.id,
      'Revalidation returned the wrong document.',
    );

    await mustReject(
      () =>
        revalidatePendingCustomerHandoverExport({
          db,
          organizationId: organizationB.id,
          machineId: machineB.id,
          exportId: created.id,
        }),
      'Cross-tenant revalidation must be rejected.',
    );

    const revalidationInput = {
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      exportId: created.id,
    };

    const restoreEligibleDocument = {
      fileName: eligibleA.fileName,
      storagePath: eligibleA.storagePath,
      checksum: eligibleA.checksum,
      category: eligibleA.category,
      visibilityLevel: eligibleA.visibilityLevel,
      visibleToCustomer: eligibleA.visibleToCustomer,
    };

    const expectDocumentDrift = async (
      data: Prisma.DocumentUpdateInput,
      message: string,
    ): Promise<void> => {
      await db.document.update({
        where: { id: eligibleA.id },
        data,
      });

      try {
        await mustReject(() => revalidatePendingCustomerHandoverExport(revalidationInput), message);
      } finally {
        await db.document.update({
          where: { id: eligibleA.id },
          data: restoreEligibleDocument,
        });
      }
    };

    await expectDocumentDrift(
      { fileName: 'changed-manual.pdf' },
      'File-name drift must fail revalidation.',
    );

    await expectDocumentDrift(
      { storagePath: eligibleA.storagePath + '.moved' },
      'Storage-path drift must fail revalidation.',
    );

    await expectDocumentDrift(
      { checksum: eligibleA.checksum + '-changed' },
      'Checksum drift must fail revalidation.',
    );

    await expectDocumentDrift(
      { category: DocumentCategory.OTHER },
      'Category drift must fail revalidation.',
    );

    await expectDocumentDrift(
      {
        visibilityLevel: DocumentVisibilityLevel.INTERNAL,
      },
      'Visibility drift must fail revalidation.',
    );

    await expectDocumentDrift(
      { visibleToCustomer: false },
      'Customer-exposure drift must fail revalidation.',
    );
    assert(typeof manifest.manifestVersion === 'string', 'Manifest version must be a string.');
    assert(typeof manifest.checklistVersion === 'string', 'Checklist version must be a string.');

    const originalManifestDocument = {
      documentId: eligibleA.id,
      fileName: eligibleA.fileName,
      storagePath: eligibleA.storagePath,
      checksum: eligibleA.checksum,
      category: 'manuals',
      visibilityLevel: 'customer-visible',
      visibleToCustomer: true,
    } as const;

    const originalManifest = {
      manifestVersion: manifest.manifestVersion,
      checklistVersion: manifest.checklistVersion,
      documents: [originalManifestDocument],
    } satisfies Prisma.InputJsonObject;

    const expectManifestRejection = async (
      changedManifest: Prisma.InputJsonObject,
      message: string,
    ): Promise<void> => {
      await db.dataExport.update({
        where: {
          id: created.id,
        },
        data: {
          manifest: changedManifest,
        },
      });

      try {
        await mustReject(() => revalidatePendingCustomerHandoverExport(revalidationInput), message);
      } finally {
        await db.dataExport.update({
          where: {
            id: created.id,
          },
          data: {
            manifest: originalManifest,
          },
        });
      }
    };

    await expectManifestRejection(
      {
        ...originalManifest,
        manifestVersion: 'unsupported-manifest',
      },
      'Unsupported manifest version must fail revalidation.',
    );

    await expectManifestRejection(
      {
        ...originalManifest,
        documents: [originalManifestDocument, originalManifestDocument],
      },
      'Duplicate manifest document IDs must fail revalidation.',
    );

    await expectManifestRejection(
      {
        ...originalManifest,
        documents: [
          {
            ...originalManifestDocument,
            documentId: crypto.randomUUID(),
          },
        ],
      },
      'Missing manifest document must fail revalidation.',
    );

    const forgedStoragePath =
      'organizations/' +
      organizationB.id +
      '/machines/' +
      machineB.id +
      '/documents/forged/manual-a.pdf';

    await db.document.update({
      where: { id: eligibleA.id },
      data: { storagePath: forgedStoragePath },
    });

    await db.dataExport.update({
      where: { id: created.id },
      data: {
        manifest: {
          ...originalManifest,
          documents: [
            {
              ...originalManifestDocument,
              storagePath: forgedStoragePath,
            },
          ],
        },
      },
    });

    try {
      await mustReject(
        () => revalidatePendingCustomerHandoverExport(revalidationInput),
        'Forged cross-tenant storage scope must fail revalidation.',
      );
    } finally {
      await db.document.update({
        where: { id: eligibleA.id },
        data: restoreEligibleDocument,
      });

      await db.dataExport.update({
        where: { id: created.id },
        data: { manifest: originalManifest },
      });
    }
    const succeededAt = new Date('2026-06-18T12:00:00.000Z');

    await mustReject(
      () =>
        completeCustomerHandoverExport({
          db,
          organizationId: organizationB.id,
          machineId: machineB.id,
          exportId: created.id,
          result: 'succeeded',
          completedAt: succeededAt,
        }),
      'A cross-tenant export transition must be rejected.',
    );

    const stillPending = await db.dataExport.findUnique({
      where: {
        id: created.id,
      },
    });

    assert(
      stillPending?.result === DataExportResult.PENDING,
      'Rejected transition must remain pending.',
    );
    assert(stillPending.completedAt === null, 'Rejected transition must not set completedAt.');

    const succeeded = await completeCustomerHandoverExport({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      exportId: created.id,
      result: 'succeeded',
      completedAt: succeededAt,
    });

    assert(succeeded.result === DataExportResult.SUCCEEDED, 'Export must transition to succeeded.');
    assert(
      succeeded.completedAt?.getTime() === succeededAt.getTime(),
      'Succeeded timestamp mismatch.',
    );

    await mustReject(
      () =>
        revalidatePendingCustomerHandoverExport({
          db,
          organizationId: organizationA.id,
          machineId: machineA.id,
          exportId: created.id,
        }),
      'Completed export revalidation must be rejected.',
    );

    await mustReject(
      () =>
        completeCustomerHandoverExport({
          db,
          organizationId: organizationA.id,
          machineId: machineA.id,
          exportId: created.id,
          result: 'failed',
        }),
      'A completed export must not transition again.',
    );

    const afterRepeatAttempt = await db.dataExport.findUnique({
      where: {
        id: created.id,
      },
    });

    assert(
      afterRepeatAttempt?.result === DataExportResult.SUCCEEDED,
      'Repeat transition must preserve result.',
    );
    assert(
      afterRepeatAttempt.completedAt?.getTime() === succeededAt.getTime(),
      'Repeat transition must preserve completedAt.',
    );

    const pendingFailure = await createPendingCustomerHandoverExport({
      ...base,
      documentIds: [eligibleA.id],
    });

    const failedAt = new Date('2026-06-18T12:05:00.000Z');

    const failed = await completeCustomerHandoverExport({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      exportId: pendingFailure.id,
      result: 'failed',
      completedAt: failedAt,
    });

    assert(failed.result === DataExportResult.FAILED, 'Export must transition to failed.');
    assert(failed.completedAt?.getTime() === failedAt.getTime(), 'Failed timestamp mismatch.');

    const finalExportCount = await db.dataExport.count({
      where: {
        organizationId: organizationA.id,
      },
    });

    assert(finalExportCount === 2, 'Lifecycle checks must persist exactly two export rows.');
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
