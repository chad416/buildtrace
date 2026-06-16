import {
  applyDocumentClassificationSuggestion,
  confirmDocumentClassificationSuggestion,
  createDocumentRecord,
  listDocumentsByMachine,
  markDocumentDownloadUrlIssued,
  updateDocumentVisibility,
} from './document-records';
import { createPrismaClient } from './client';
import {
  DocumentCategory,
  DocumentClassificationSource,
  DocumentClassificationStatus,
  MachineStatus,
} from './generated/prisma/enums';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${String(expected)} but received ${String(actual)}.`);
  }
}

async function runDocumentRecordsIsolationCheck(): Promise<void> {
  const db = createPrismaClient();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const organizationIds: string[] = [];

  try {
    const organizationA = await db.organization.create({
      data: {
        name: `Document Isolation A ${suffix}`,
        slug: `document-isolation-a-${suffix}`,
      },
    });

    const organizationB = await db.organization.create({
      data: {
        name: `Document Isolation B ${suffix}`,
        slug: `document-isolation-b-${suffix}`,
      },
    });

    organizationIds.push(organizationA.id, organizationB.id);

    const customerA = await db.customer.create({
      data: {
        organizationId: organizationA.id,
        companyName: 'Organization A Customer',
        contactName: 'Ada Lovelace',
        email: `a-${suffix}@example.com`,
        phone: '+420 123 456 789',
        country: 'CZ',
        preferredLocale: 'en',
      },
    });

    const customerB = await db.customer.create({
      data: {
        organizationId: organizationB.id,
        companyName: 'Organization B Customer',
        contactName: 'Grace Hopper',
        email: `b-${suffix}@example.com`,
        phone: '+420 987 654 321',
        country: 'CZ',
        preferredLocale: 'en',
      },
    });

    const machineModelA = await db.machineModel.create({
      data: {
        organizationId: organizationA.id,
        modelName: 'Model A',
        description: 'Document isolation model A',
      },
    });

    const machineModelB = await db.machineModel.create({
      data: {
        organizationId: organizationB.id,
        modelName: 'Model B',
        description: 'Document isolation model B',
      },
    });

    const machineA = await db.machine.create({
      data: {
        organizationId: organizationA.id,
        customerId: customerA.id,
        machineModelId: machineModelA.id,
        machineName: 'Machine A',
        serialNumber: `SN-A-${suffix}`,
        status: MachineStatus.ACTIVE,
        deliveryDate: new Date('2026-06-14T00:00:00.000Z'),
        plcType: 'Siemens S7',
        hmiType: 'KTP700',
      },
    });

    const machineB = await db.machine.create({
      data: {
        organizationId: organizationB.id,
        customerId: customerB.id,
        machineModelId: machineModelB.id,
        machineName: 'Machine B',
        serialNumber: `SN-B-${suffix}`,
        status: MachineStatus.ACTIVE,
        deliveryDate: new Date('2026-06-14T00:00:00.000Z'),
        plcType: 'Siemens S7',
        hmiType: 'KTP700',
      },
    });

    const documentA = await createDocumentRecord({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      fileName: 'Manual.pdf',
      storagePath: `organizations/${organizationA.id}/machines/${machineA.id}/documents/document-a/manual.pdf`,
      fileType: 'application/pdf',
      category: 'manuals',
      checksum: `checksum-a-${suffix}`,
      language: 'en',
    });

    assertEqual(documentA.visibilityLevel, 'internal', 'Manual documents must default internal.');
    assertEqual(documentA.visibleToCustomer, false, 'Documents must default private.');
    assertEqual(documentA.suggestedCategory, 'manuals', 'Manual file name should suggest manuals.');
    assertEqual(
      documentA.classificationStatus,
      'classified',
      'Manual file name should classify confidently.',
    );
    assertEqual(
      documentA.classificationSource,
      'filename-type',
      'Manual classification should use filename-type source.',
    );

    const suggestedManualDocument = await createDocumentRecord({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      fileName: 'Operator Manual.pdf',
      storagePath: `organizations/${organizationA.id}/machines/${machineA.id}/documents/document-suggested-manual/manual.pdf`,
      fileType: 'application/pdf',
      category: 'other',
      checksum: `checksum-suggested-manual-${suffix}`,
    });

    const confirmedSuggestedManualDocument = await confirmDocumentClassificationSuggestion({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      documentId: suggestedManualDocument.id,
    });

    assert(confirmedSuggestedManualDocument !== null, 'Suggested manual document should confirm.');
    assertEqual(
      confirmedSuggestedManualDocument.category,
      'manuals',
      'Confirmation must apply the suggested category.',
    );
    assertEqual(
      confirmedSuggestedManualDocument.classificationStatus,
      'manually-confirmed',
      'Confirmation must mark classification manually confirmed.',
    );
    assertEqual(
      confirmedSuggestedManualDocument.classificationSource,
      'manual',
      'Confirmation must record manual source.',
    );
    assertEqual(
      confirmedSuggestedManualDocument.visibilityLevel,
      suggestedManualDocument.visibilityLevel,
      'Confirmation must preserve visibility.',
    );
    assertEqual(
      confirmedSuggestedManualDocument.visibleToCustomer,
      false,
      'Confirmation must not expose the document to customers.',
    );
    const plcDocument = await createDocumentRecord({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      fileName: 'PLC.zip',
      storagePath: `organizations/${organizationA.id}/machines/${machineA.id}/documents/document-plc/plc.zip`,
      fileType: 'application/zip',
      category: 'plc',
      checksum: `checksum-plc-${suffix}`,
    });

    assertEqual(
      plcDocument.visibilityLevel,
      'sensitive-engineering',
      'PLC documents must default sensitive-engineering.',
    );
    assertEqual(plcDocument.suggestedCategory, 'plc', 'PLC file name should suggest plc.');
    assertEqual(
      plcDocument.classificationStatus,
      'classified',
      'PLC file name should classify confidently.',
    );

    await db.document.update({
      where: {
        id: plcDocument.id,
      },
      data: {
        suggestedCategory: DocumentCategory.HMI,
        classificationConfidence: 99,
        classificationStatus: DocumentClassificationStatus.MANUALLY_CONFIRMED,
        classificationSource: DocumentClassificationSource.MANUAL,
      },
    });

    const manuallyConfirmedDocument = await applyDocumentClassificationSuggestion({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
      documentId: plcDocument.id,
    });

    assert(manuallyConfirmedDocument !== null, 'Manually confirmed document should reload.');
    assertEqual(
      manuallyConfirmedDocument.suggestedCategory,
      'hmi',
      'Classifier rerun must not overwrite manually confirmed category.',
    );
    assertEqual(
      manuallyConfirmedDocument.classificationStatus,
      'manually-confirmed',
      'Classifier rerun must not downgrade manual confirmation.',
    );
    assertEqual(
      manuallyConfirmedDocument.classificationSource,
      'manual',
      'Classifier rerun must preserve manual source.',
    );

    await createDocumentRecord({
      db,
      organizationId: organizationB.id,
      machineId: machineB.id,
      fileName: 'Organization B Manual.pdf',
      storagePath: `organizations/${organizationB.id}/machines/${machineB.id}/documents/document-b/manual.pdf`,
      fileType: 'application/pdf',
      category: 'manuals',
      checksum: `checksum-b-${suffix}`,
    });

    let crossOrganizationCreateFailed = false;

    try {
      await createDocumentRecord({
        db,
        organizationId: organizationB.id,
        machineId: machineA.id,
        fileName: 'Invalid Cross Tenant.pdf',
        storagePath: `organizations/${organizationB.id}/machines/${machineA.id}/documents/invalid/manual.pdf`,
        fileType: 'application/pdf',
        category: 'manuals',
        checksum: `checksum-invalid-${suffix}`,
      });
    } catch {
      crossOrganizationCreateFailed = true;
    }

    assert(
      crossOrganizationCreateFailed,
      'Composite FK must reject a document whose organization does not own the machine.',
    );

    const organizationADocuments = await listDocumentsByMachine({
      db,
      organizationId: organizationA.id,
      machineId: machineA.id,
    });

    assertEqual(
      organizationADocuments.length,
      3,
      'Organization A must list only documents for its machine.',
    );

    const organizationBReadingMachineA = await listDocumentsByMachine({
      db,
      organizationId: organizationB.id,
      machineId: machineA.id,
    });

    assertEqual(
      organizationBReadingMachineA.length,
      0,
      'Organization B must not list Organization A machine documents.',
    );

    const crossTenantVisibilityUpdate = await updateDocumentVisibility({
      db,
      organizationId: organizationB.id,
      machineId: machineA.id,
      documentId: documentA.id,
      visibilityLevel: 'customer-visible',
    });

    assertEqual(
      crossTenantVisibilityUpdate,
      null,
      'Organization B must not update Organization A document visibility.',
    );

    const crossTenantClassificationUpdate = await applyDocumentClassificationSuggestion({
      db,
      organizationId: organizationB.id,
      machineId: machineA.id,
      documentId: documentA.id,
    });

    assertEqual(
      crossTenantClassificationUpdate,
      null,
      'Organization B must not classify Organization A documents.',
    );

    const crossTenantClassificationConfirmation = await confirmDocumentClassificationSuggestion({
      db,
      organizationId: organizationB.id,
      machineId: machineA.id,
      documentId: documentA.id,
    });

    assertEqual(
      crossTenantClassificationConfirmation,
      null,
      'Organization B must not confirm classification for Organization A documents.',
    );
    const crossTenantDownloadUrlIssued = await markDocumentDownloadUrlIssued({
      db,
      organizationId: organizationB.id,
      machineId: machineA.id,
      documentId: documentA.id,
      issuedAt: new Date('2026-06-14T02:00:00.000Z'),
    });

    assertEqual(
      crossTenantDownloadUrlIssued,
      null,
      'Organization B must not record signed URL issuance for Organization A documents.',
    );
  } finally {
    if (organizationIds.length > 0) {
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

await runDocumentRecordsIsolationCheck();

console.info('Document records isolation check passed.');
