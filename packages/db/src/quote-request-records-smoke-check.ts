import {
  createQuoteRequest,
  listQuoteRequests,
  updateQuoteRequestStatus,
} from './quote-request-records';
import type { QuoteRequestRecordsDatabase } from './quote-request-records';

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

function createMockDb(): QuoteRequestRecordsDatabase {
  return {
    quoteRequest: {
      create: async (args: CreateArgs) => ({ id: 'mock-id-1', ...args.data }),
      findMany: async () => [{ id: 'mock-id-1', title: 'Need parts' }],
      findFirst: async (args: FindFirstArgs) => {
        if (args.where.id === 'mock-id-1') {
          return { id: 'mock-id-1', organizationId: args.where.organizationId };
        }
        return null;
      },
      update: async (args: UpdateArgs) => ({ id: args.where.id, ...args.data }),
    },
  } as unknown as QuoteRequestRecordsDatabase;
}

async function runQuoteRequestRecordsSmokeCheck() {
  console.log('Running quote-request-records smoke check...');

  const db = createMockDb();
  const organizationId = 'org-1';
  const machineId = 'machine-1';

  const created = await createQuoteRequest({
    db,
    organizationId,
    machineId,
    title: 'Need parts',
  });
  if (!created || created.id !== 'mock-id-1') throw new Error('create failed');

  const list = await listQuoteRequests({ db, organizationId });
  if (list.length !== 1) throw new Error('list failed');

  const updated = await updateQuoteRequestStatus({
    db,
    organizationId,
    quoteRequestId: 'mock-id-1',
    status: 'approved',
  });
  if (updated.status !== 'approved') throw new Error('update status failed');

  console.log('Quote request records smoke check passed.');
}

runQuoteRequestRecordsSmokeCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
