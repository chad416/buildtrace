import { createSparePart, listSpareParts, updateSparePart } from './spare-part-records';
import type { SparePartRecordsDatabase } from './spare-part-records';

type CreateArgs = {
  readonly data: Record<string, unknown>;
};

type FindFirstArgs = {
  readonly where: {
    readonly id?: string;
    readonly organizationId?: string;
  };
};

type UpdateArgs = {
  readonly where: {
    readonly id: string;
  };
  readonly data: Record<string, unknown>;
};

function createMockDb(): SparePartRecordsDatabase {
  return {
    sparePart: {
      create: async (args: CreateArgs) => ({ id: 'mock-id-1', ...args.data }),
      findMany: async () => [{ id: 'mock-id-1', partName: 'Filter' }],
      findFirst: async (args: FindFirstArgs) => {
        if (args.where.id === 'mock-id-1') {
          return { id: 'mock-id-1', organizationId: args.where.organizationId };
        }
        return null;
      },
      update: async (args: UpdateArgs) => ({ id: args.where.id, ...args.data }),
    },
  } as unknown as SparePartRecordsDatabase;
}

async function runSparePartRecordsSmokeCheck() {
  console.log('Running spare-part-records smoke check...');

  const db = createMockDb();
  const organizationId = 'org-1';
  const machineId = 'machine-1';

  const created = await createSparePart({
    db,
    organizationId,
    machineId,
    partName: 'Filter',
  });
  if (!created || created.id !== 'mock-id-1') throw new Error('create failed');

  const list = await listSpareParts({ db, organizationId, machineId });
  if (list.length !== 1) throw new Error('list failed');

  const updated = await updateSparePart({
    db,
    organizationId,
    sparePartId: 'mock-id-1',
    quantity: 5,
  });
  if (updated.quantity !== 5) throw new Error('update failed');

  console.log('Spare part records smoke check passed.');
}

runSparePartRecordsSmokeCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
