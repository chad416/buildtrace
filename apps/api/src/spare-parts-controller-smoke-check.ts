import { BadRequestException } from '@nestjs/common';
import type { PrismaClient, SparePartRecord } from '@buildtrace/db';
import { Prisma } from '@buildtrace/db/src/generated/prisma/client';
import { activityLogActions } from '@buildtrace/shared';

import {
  createSparePartFromRequest,
  listSparePartsFromRequest,
  updateSparePartFromRequest,
  type SparePartsEndpointDependencies,
} from './spare-parts.controller.js';

const now = new Date('2026-06-26T00:00:00.000Z');

const fakeSparePart: SparePartRecord = {
  id: 'spare-part-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  partName: 'Servo drive',
  manufacturer: 'BuildTrace Components',
  partNumber: 'BT-SD-100',
  quantity: 2,
  category: 'drive',
  criticality: 'recommended',
  estimatedPrice: new Prisma.Decimal('42.50'),
  currency: 'EUR',
  internalCost: new Prisma.Decimal('21.25'),
  customerVisiblePrice: new Prisma.Decimal('55.00'),
  sourceDocumentId: 'document-1',
  notes: 'Keep one on the shelf.',
  createdAt: now,
  updatedAt: now,
};

type ResolveInput = Parameters<
  SparePartsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type CreateSparePartInput = Parameters<SparePartsEndpointDependencies['createSparePart']>[0];
type ListSparePartsInput = Parameters<SparePartsEndpointDependencies['listSpareParts']>[0];
type UpdateSparePartInput = Parameters<SparePartsEndpointDependencies['updateSparePart']>[0];
type ActivityInput = Parameters<SparePartsEndpointDependencies['createActivityLog']>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly createSparePartInputs: CreateSparePartInput[];
  readonly listSparePartsInputs: ListSparePartsInput[];
  readonly updateSparePartInputs: UpdateSparePartInput[];
  readonly activityInputs: ActivityInput[];
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createSparePartInputs: [],
    listSparePartsInputs: [],
    updateSparePartInputs: [],
    activityInputs: [],
  };
}

function createDependencies(capturedCalls: CapturedCalls): SparePartsEndpointDependencies {
  return {
    db: {} as unknown as PrismaClient,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push(input);
      return {
        currentUser: {
          appUserId: 'app-user-1',
          authUserId: 'auth-user-1',
          email: 'builder@buildtrace.test',
          organizations: [{ id: input.organizationId, role: 'OWNER' }],
        },
        organizationAccess: {
          organizationId: input.organizationId,
          role: 'OWNER',
        },
      };
    },
    createSparePart: async (input) => {
      capturedCalls.createSparePartInputs.push(input);
      return {
        ...fakeSparePart,
        organizationId: input.organizationId,
        machineId: input.machineId,
        partName: input.partName,
        manufacturer: input.manufacturer ?? null,
        partNumber: input.partNumber ?? null,
        quantity: input.quantity ?? 1,
        category: input.category ?? 'other',
        criticality: input.criticality ?? 'recommended',
        estimatedPrice: input.estimatedPrice ?? null,
        currency: input.currency ?? 'EUR',
        internalCost: input.internalCost ?? null,
        customerVisiblePrice: input.customerVisiblePrice ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        notes: input.notes ?? null,
      };
    },
    listSpareParts: async (input) => {
      capturedCalls.listSparePartsInputs.push(input);
      return [fakeSparePart];
    },
    updateSparePart: async (input) => {
      capturedCalls.updateSparePartInputs.push(input);
      return {
        ...fakeSparePart,
        organizationId: input.organizationId,
        id: input.sparePartId,
        partName: input.partName ?? fakeSparePart.partName,
        manufacturer:
          input.manufacturer === undefined ? fakeSparePart.manufacturer : input.manufacturer,
        partNumber: input.partNumber === undefined ? fakeSparePart.partNumber : input.partNumber,
        quantity: input.quantity ?? fakeSparePart.quantity,
        category: input.category ?? fakeSparePart.category,
        criticality: input.criticality ?? fakeSparePart.criticality,
        estimatedPrice:
          input.estimatedPrice === undefined ? fakeSparePart.estimatedPrice : input.estimatedPrice,
        currency: input.currency ?? fakeSparePart.currency,
        internalCost:
          input.internalCost === undefined ? fakeSparePart.internalCost : input.internalCost,
        customerVisiblePrice:
          input.customerVisiblePrice === undefined
            ? fakeSparePart.customerVisiblePrice
            : input.customerVisiblePrice,
        notes: input.notes === undefined ? fakeSparePart.notes : input.notes,
        updatedAt: now,
      };
    },
    createActivityLog: async (input) => {
      capturedCalls.activityInputs.push(input);
      return {
        id: 'activity-' + capturedCalls.activityInputs.length,
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: now,
      };
    },
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoInternalCost(value: object, label: string): void {
  assert(!('internalCost' in value), `${label} exposed internalCost.`);
}

async function expectException<TError extends Error>(
  name: string,
  errorType: new (...args: never[]) => TError,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof errorType) {
      return;
    }
    throw error;
  }
  throw new Error(`${name} should throw ${errorType.name}.`);
}

async function runCreateSparePartCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const sparePart = await createSparePartFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    body: {
      organizationId: ' org-1 ',
      partName: ' Servo drive ',
      manufacturer: ' BuildTrace Components ',
      partNumber: ' BT-SD-100 ',
      quantity: 2,
      category: 'drive',
      criticality: 'critical',
      estimatedPrice: '42.50',
      currency: 'EUR',
      internalCost: '21.25',
      customerVisiblePrice: '55.00',
      sourceDocumentId: ' document-1 ',
      notes: ' Keep one on the shelf. ',
    },
    dependencies: createDependencies(calls),
  });

  assert(sparePart.id === 'spare-part-1', 'Create spare part ID was wrong.');
  assert(sparePart.partName === 'Servo drive', 'Create spare part name was wrong.');
  assert(sparePart.estimatedPrice === '42.5', 'Create estimated price was not serialized.');
  assert(
    sparePart.customerVisiblePrice === '55',
    'Create customer-visible price was not serialized.',
  );
  assertNoInternalCost(sparePart, 'Create spare part response');
  assert(calls.resolveInputs.length === 1, 'Create spare part auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Create spare part roles were incorrect.',
  );
  assert(calls.createSparePartInputs.length === 1, 'createSparePart was not called once.');
  assert(
    calls.createSparePartInputs[0]?.organizationId === 'org-1',
    'Create spare part organization was wrong.',
  );
  assert(
    calls.createSparePartInputs[0]?.machineId === 'machine-1',
    'Create spare part machine was wrong.',
  );
  assert(
    calls.createSparePartInputs[0]?.criticality === 'critical',
    'Create spare part criticality was wrong.',
  );
  assert(
    calls.createSparePartInputs[0]?.internalCost?.toString() === '21.25',
    'Create spare part internal cost input was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Create spare part activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.sparePartCreated,
    'Create spare part activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'spare_part',
    'Create spare part activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'spare-part-1',
    'Create spare part activity target ID was wrong.',
  );
  assert(
    calls.activityInputs[0]?.actorUserId === 'app-user-1',
    'Create spare part actor was wrong.',
  );

  const invalidCalls = createCapturedCalls();
  await expectException('invalid criticality', BadRequestException, () =>
    createSparePartFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'org-1',
        partName: 'Servo drive',
        criticality: 'must-have',
      },
      dependencies: createDependencies(invalidCalls),
    }),
  );
  assert(invalidCalls.resolveInputs.length === 0, 'Invalid criticality must not call auth.');
  assert(
    invalidCalls.createSparePartInputs.length === 0,
    'Invalid criticality must not create a spare part.',
  );
}

async function runListSparePartsCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listSparePartsFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' org-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.spareParts.length === 1, 'List spare parts count was wrong.');
  const sparePart = response.spareParts[0];
  assert(sparePart !== undefined, 'List spare parts response was empty.');
  assert(sparePart.id === 'spare-part-1', 'List spare parts ID was wrong.');
  assert(sparePart.estimatedPrice === '42.5', 'List estimated price was not serialized.');
  assert(
    sparePart.customerVisiblePrice === '55',
    'List customer-visible price was not serialized.',
  );
  assertNoInternalCost(sparePart, 'List spare parts response');
  assert(calls.resolveInputs.length === 1, 'List spare parts auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'List spare parts roles were incorrect.',
  );
  assert(calls.listSparePartsInputs.length === 1, 'listSpareParts was not called once.');
  assert(
    calls.listSparePartsInputs[0]?.organizationId === 'org-1',
    'List spare parts organization was wrong.',
  );
  assert(
    calls.listSparePartsInputs[0]?.machineId === 'machine-1',
    'List spare parts machine was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'List spare parts must not create activity.');
}

async function runUpdateSparePartCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const sparePart = await updateSparePartFromRequest({
    authorizationHeader: 'Bearer token-1',
    sparePartId: ' spare-part-1 ',
    body: {
      organizationId: ' org-1 ',
      partName: ' Updated servo drive ',
      manufacturer: null,
      partNumber: ' BT-SD-200 ',
      quantity: '3',
      category: 'drive',
      criticality: 'optional',
      estimatedPrice: 64.5,
      currency: 'EUR',
      internalCost: '30.00',
      customerVisiblePrice: '75.25',
      notes: null,
    },
    dependencies: createDependencies(calls),
  });

  assert(sparePart.id === 'spare-part-1', 'Update spare part ID was wrong.');
  assert(sparePart.partName === 'Updated servo drive', 'Update spare part name was wrong.');
  assert(sparePart.manufacturer === null, 'Update spare part manufacturer was wrong.');
  assert(sparePart.estimatedPrice === '64.5', 'Update estimated price was not serialized.');
  assert(
    sparePart.customerVisiblePrice === '75.25',
    'Update customer-visible price was not serialized.',
  );
  assertNoInternalCost(sparePart, 'Update spare part response');
  assert(calls.resolveInputs.length === 1, 'Update spare part auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Update spare part roles were incorrect.',
  );
  assert(calls.updateSparePartInputs.length === 1, 'updateSparePart was not called once.');
  assert(
    calls.updateSparePartInputs[0]?.organizationId === 'org-1',
    'Update spare part organization was wrong.',
  );
  assert(
    calls.updateSparePartInputs[0]?.sparePartId === 'spare-part-1',
    'Update spare part ID input was wrong.',
  );
  assert(calls.updateSparePartInputs[0]?.quantity === 3, 'Update spare part quantity was wrong.');
  assert(
    calls.updateSparePartInputs[0]?.criticality === 'optional',
    'Update spare part criticality was wrong.',
  );
  assert(
    calls.updateSparePartInputs[0]?.internalCost?.toString() === '30',
    'Update spare part internal cost input was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Update spare part activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.sparePartUpdated,
    'Update spare part activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'spare_part',
    'Update spare part activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'spare-part-1',
    'Update spare part activity target ID was wrong.',
  );
  assert(
    calls.activityInputs[0]?.actorUserId === 'app-user-1',
    'Update spare part actor was wrong.',
  );
}

await runCreateSparePartCheck();
await runListSparePartsCheck();
await runUpdateSparePartCheck();

console.info('Spare parts controller smoke check passed.');
