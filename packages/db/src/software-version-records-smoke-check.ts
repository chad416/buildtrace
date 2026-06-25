import type { SoftwareType } from '@buildtrace/shared';

import {
  createSoftwareVersion,
  getSoftwareVersion,
  listSoftwareVersions,
  markAsCurrentKnownVersion,
  markAsDeliveredVersion,
} from './software-version-records.js';
import type { SoftwareVersionRecordsDatabase } from './software-version-records.js';

type SoftwareVersionEntity = {
  id: string;
  organizationId: string;
  machineId: string;
  versionName: string;
  softwareType: string;
  notes: string | null;
  isDeliveredVersion: boolean;
  isCurrentKnownVersion: boolean;
  storagePath: string | null;
  checksum: string | null;
  uploadedByUserId: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type WhereInput = {
  readonly id?: string;
  readonly organizationId?: string;
  readonly machineId?: string;
  readonly softwareType?: SoftwareType;
};

type CreateArgs = {
  readonly data: {
    readonly organizationId: string;
    readonly machineId: string;
    readonly versionName: string;
    readonly softwareType: SoftwareType;
    readonly notes?: string | null;
    readonly isDeliveredVersion?: boolean;
    readonly isCurrentKnownVersion?: boolean;
    readonly storagePath?: string | null;
    readonly checksum?: string | null;
    readonly uploadedByUserId?: string | null;
  };
};

type FindManyArgs = {
  readonly where: WhereInput;
  readonly orderBy?: unknown;
  readonly take?: number;
};

type FindFirstArgs = {
  readonly where: WhereInput;
};

type UpdateArgs = {
  readonly where: {
    readonly id: string;
  };
  readonly data: Partial<
    Pick<SoftwareVersionEntity, 'isCurrentKnownVersion' | 'isDeliveredVersion' | 'updatedAt'>
  >;
};

type CapturedOperation =
  | {
      readonly operation: 'create';
      readonly args: CreateArgs;
    }
  | {
      readonly operation: 'findMany';
      readonly args: FindManyArgs;
    }
  | {
      readonly operation: 'findFirst';
      readonly args: FindFirstArgs;
    }
  | {
      readonly operation: 'update';
      readonly args: UpdateArgs;
    };

type SoftwareVersionDelegateMock = {
  readonly create: (args: CreateArgs) => Promise<SoftwareVersionEntity>;
  readonly findMany: (args: FindManyArgs) => Promise<SoftwareVersionEntity[]>;
  readonly findFirst: (args: FindFirstArgs) => Promise<SoftwareVersionEntity | null>;
  readonly update: (args: UpdateArgs) => Promise<SoftwareVersionEntity>;
};

type StrictMockDatabase = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly operations: CapturedOperation[];
  readonly records: SoftwareVersionEntity[];
};

const now = new Date('2026-06-25T00:00:00.000Z');

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

function createVersion(overrides: Partial<SoftwareVersionEntity>): SoftwareVersionEntity {
  return {
    id: 'version-1',
    organizationId: 'org-1',
    machineId: 'machine-1',
    versionName: 'v1.0.0',
    softwareType: 'plc',
    notes: null,
    isDeliveredVersion: false,
    isCurrentKnownVersion: false,
    storagePath: null,
    checksum: null,
    uploadedByUserId: null,
    uploadedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function matchesWhere(record: SoftwareVersionEntity, where: WhereInput): boolean {
  return (
    (where.id === undefined || record.id === where.id) &&
    (where.organizationId === undefined || record.organizationId === where.organizationId) &&
    (where.machineId === undefined || record.machineId === where.machineId) &&
    (where.softwareType === undefined || record.softwareType === where.softwareType)
  );
}

function createStrictMockDb(
  initialRecords: readonly SoftwareVersionEntity[] = [],
): StrictMockDatabase {
  let nextId = 1;
  const operations: CapturedOperation[] = [];
  const records = [...initialRecords];

  const softwareVersion: SoftwareVersionDelegateMock = {
    create: async (args) => {
      operations.push({
        operation: 'create',
        args,
      });

      const record = createVersion({
        id: `created-version-${nextId}`,
        organizationId: args.data.organizationId,
        machineId: args.data.machineId,
        versionName: args.data.versionName,
        softwareType: args.data.softwareType,
        notes: args.data.notes ?? null,
        isDeliveredVersion: args.data.isDeliveredVersion ?? false,
        isCurrentKnownVersion: args.data.isCurrentKnownVersion ?? false,
        storagePath: args.data.storagePath ?? null,
        checksum: args.data.checksum ?? null,
        uploadedByUserId: args.data.uploadedByUserId ?? null,
      });

      nextId += 1;
      records.push(record);

      return record;
    },
    findMany: async (args) => {
      operations.push({
        operation: 'findMany',
        args,
      });

      return records
        .filter((record) => matchesWhere(record, args.where))
        .sort((left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime())
        .slice(0, args.take ?? records.length);
    },
    findFirst: async (args) => {
      operations.push({
        operation: 'findFirst',
        args,
      });

      return records.find((record) => matchesWhere(record, args.where)) ?? null;
    },
    update: async (args) => {
      operations.push({
        operation: 'update',
        args,
      });

      const index = records.findIndex((record) => record.id === args.where.id);

      if (index < 0) {
        throw new Error(`Software version ${args.where.id} was not found for update.`);
      }

      const currentRecord = records[index];
      assert(currentRecord !== undefined, 'Software version update index was invalid.');

      const updatedRecord = {
        ...currentRecord,
        ...args.data,
      };

      records[index] = updatedRecord;

      return updatedRecord;
    },
  };

  return {
    db: {
      softwareVersion,
    } as unknown as SoftwareVersionRecordsDatabase,
    operations,
    records,
  };
}

function requireOperation(
  operations: readonly CapturedOperation[],
  operation: CapturedOperation['operation'],
  index = 0,
): CapturedOperation {
  const matchingOperations = operations.filter(
    (capturedOperation) => capturedOperation.operation === operation,
  );
  const foundOperation = matchingOperations[index];

  if (!foundOperation) {
    throw new Error(`Expected ${operation} operation at index ${index}.`);
  }

  return foundOperation;
}

async function runSoftwareVersionRecordsSmokeCheck(): Promise<void> {
  const mock = createStrictMockDb([
    createVersion({
      id: 'version-org-1-machine-1-plc',
      organizationId: 'org-1',
      machineId: 'machine-1',
      versionName: 'v1.0.0',
      softwareType: 'plc',
      uploadedAt: new Date('2026-06-25T10:00:00.000Z'),
    }),
    createVersion({
      id: 'version-org-1-machine-1-hmi',
      organizationId: 'org-1',
      machineId: 'machine-1',
      versionName: 'hmi-v1',
      softwareType: 'hmi',
      uploadedAt: new Date('2026-06-25T09:00:00.000Z'),
    }),
    createVersion({
      id: 'version-org-1-machine-2-plc',
      organizationId: 'org-1',
      machineId: 'machine-2',
      versionName: 'other-machine',
      softwareType: 'plc',
    }),
    createVersion({
      id: 'version-org-2-machine-1-plc',
      organizationId: 'org-2',
      machineId: 'machine-1',
      versionName: 'other-tenant',
      softwareType: 'plc',
    }),
  ]);

  await expectThrows('blank organization ID', () =>
    listSoftwareVersions({
      db: mock.db,
      organizationId: '   ',
      machineId: 'machine-1',
    }),
  );

  const created = await createSoftwareVersion({
    db: mock.db,
    organizationId: ' org-1 ',
    machineId: ' machine-1 ',
    versionName: ' v1.1.0 ',
    softwareType: 'plc' as SoftwareType,
    notes: '  ',
    storagePath: ' versions/plc/v1.1.0.bin ',
    checksum: ' sha256:abc ',
    uploadedByUserId: ' user-1 ',
  });

  assertEqual(created.organizationId, 'org-1', 'Create must trim organization ID.');
  assertEqual(created.machineId, 'machine-1', 'Create must trim machine ID.');
  assertEqual(created.versionName, 'v1.1.0', 'Create must trim version name.');
  assertEqual(created.notes, null, 'Create must normalize blank notes to null.');
  assertEqual(created.storagePath, 'versions/plc/v1.1.0.bin', 'Create must trim storage path.');
  assertEqual(created.checksum, 'sha256:abc', 'Create must trim checksum.');
  assertEqual(created.uploadedByUserId, 'user-1', 'Create must trim uploader ID.');

  const createOperation = requireOperation(mock.operations, 'create');
  assert(createOperation.operation === 'create', 'Expected create operation.');
  assertEqual(
    createOperation.args.data.organizationId,
    'org-1',
    'Create DB call must use normalized organization ID.',
  );
  assertEqual(
    createOperation.args.data.machineId,
    'machine-1',
    'Create DB call must use normalized machine ID.',
  );

  const plcVersions = await listSoftwareVersions({
    db: mock.db,
    organizationId: 'org-1',
    machineId: 'machine-1',
    softwareType: 'plc' as SoftwareType,
  });

  assertEqual(plcVersions.length, 2, 'List must return only scoped PLC versions.');
  assert(
    plcVersions.every(
      (version) =>
        version.organizationId === 'org-1' &&
        version.machineId === 'machine-1' &&
        version.softwareType === 'plc',
    ),
    'List leaked another tenant, machine, or software type.',
  );

  const findManyOperation = requireOperation(mock.operations, 'findMany');
  assert(findManyOperation.operation === 'findMany', 'Expected findMany operation.');
  assertEqual(
    findManyOperation.args.where.organizationId,
    'org-1',
    'List DB call must be organization-scoped.',
  );
  assertEqual(
    findManyOperation.args.where.machineId,
    'machine-1',
    'List DB call must be machine-scoped.',
  );
  assertEqual(
    findManyOperation.args.where.softwareType,
    'plc',
    'List DB call must include optional software type filter.',
  );
  assertEqual(findManyOperation.args.take, 50, 'List DB call must cap result count.');

  const visibleVersion = await getSoftwareVersion({
    db: mock.db,
    organizationId: 'org-1',
    versionId: 'version-org-1-machine-1-plc',
  });
  assert(visibleVersion !== null, 'Scoped get should return the version.');

  const crossTenantVersion = await getSoftwareVersion({
    db: mock.db,
    organizationId: 'org-2',
    versionId: 'version-org-1-machine-1-plc',
  });
  assertEqual(crossTenantVersion, null, 'Cross-tenant get must return null.');

  const firstFindOperation = requireOperation(mock.operations, 'findFirst');
  assert(firstFindOperation.operation === 'findFirst', 'Expected first findFirst operation.');
  assertEqual(
    firstFindOperation.args.where.organizationId,
    'org-1',
    'Get DB call must be organization-scoped.',
  );

  await expectThrows('cross-machine mark current', () =>
    markAsCurrentKnownVersion({
      db: mock.db,
      organizationId: 'org-1',
      machineId: 'machine-2',
      versionId: 'version-org-1-machine-1-plc',
    }),
  );

  const updatesBeforeCurrentMark = mock.operations.filter(
    (operation) => operation.operation === 'update',
  ).length;

  const markedCurrent = await markAsCurrentKnownVersion({
    db: mock.db,
    organizationId: 'org-1',
    machineId: 'machine-1',
    versionId: 'version-org-1-machine-1-plc',
  });

  assertEqual(
    markedCurrent.isCurrentKnownVersion,
    true,
    'Mark current must set current-known flag.',
  );

  const currentUpdate = requireOperation(mock.operations, 'update', updatesBeforeCurrentMark);
  assert(currentUpdate.operation === 'update', 'Expected current update operation.');
  assertEqual(
    currentUpdate.args.where.id,
    'version-org-1-machine-1-plc',
    'Current update must target the requested version ID.',
  );
  assertEqual(
    currentUpdate.args.data.isCurrentKnownVersion,
    true,
    'Current update must write the current-known flag.',
  );
  assert(
    currentUpdate.args.data.updatedAt instanceof Date,
    'Current update must refresh updatedAt.',
  );

  await expectThrows('cross-tenant mark delivered', () =>
    markAsDeliveredVersion({
      db: mock.db,
      organizationId: 'org-2',
      machineId: 'machine-1',
      versionId: 'version-org-1-machine-1-plc',
    }),
  );

  const updatesBeforeDeliveredMark = mock.operations.filter(
    (operation) => operation.operation === 'update',
  ).length;

  const markedDelivered = await markAsDeliveredVersion({
    db: mock.db,
    organizationId: 'org-1',
    machineId: 'machine-1',
    versionId: 'version-org-1-machine-1-plc',
  });

  assertEqual(markedDelivered.isDeliveredVersion, true, 'Mark delivered must set delivered flag.');

  const deliveredUpdate = requireOperation(mock.operations, 'update', updatesBeforeDeliveredMark);
  assert(deliveredUpdate.operation === 'update', 'Expected delivered update operation.');
  assertEqual(
    deliveredUpdate.args.where.id,
    'version-org-1-machine-1-plc',
    'Delivered update must target the requested version ID.',
  );
  assertEqual(
    deliveredUpdate.args.data.isDeliveredVersion,
    true,
    'Delivered update must write the delivered flag.',
  );
  assert(
    deliveredUpdate.args.data.updatedAt instanceof Date,
    'Delivered update must refresh updatedAt.',
  );
}

await runSoftwareVersionRecordsSmokeCheck();

console.info('Software version records smoke check passed.');
