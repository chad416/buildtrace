import {
  createServiceTicket,
  listServiceTickets,
  getServiceTicket,
  updateServiceTicketStatus,
  addTicketComment,
  listTicketComments,
} from './service-ticket-records.js';
import type { PrismaClient } from './generated/prisma/client';

type CapturedOperation = {
  readonly model: string;
  readonly operation: string;
  readonly args: unknown;
};

type MockData = {
  readonly serviceTicket?: unknown;
  readonly serviceTickets?: readonly unknown[];
  readonly ticketComment?: unknown;
  readonly ticketComments?: readonly unknown[];
};

function createMockPrismaClient(
  capturedOperations: CapturedOperation[],
  mockData: MockData = {},
): PrismaClient {
  const serviceTicket = {
    create: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'serviceTicket', operation: 'create', args });
      const data = (
        args as {
          readonly data: {
            readonly organizationId: string;
            readonly machineId: string;
            readonly customerId?: string | null;
            readonly title: string;
            readonly description: string;
            readonly status?: string;
            readonly priority?: string;
            readonly createdFromPortal?: boolean;
            readonly customerAccessToken?: string | null;
          };
        }
      ).data;

      return (
        mockData.serviceTicket || {
          id: 'ticket-1',
          organizationId: data.organizationId,
          machineId: data.machineId,
          customerId: data.customerId ?? null,
          title: data.title,
          description: data.description,
          status: data.status ?? 'open',
          priority: data.priority ?? 'normal',
          createdFromPortal: data.createdFromPortal ?? false,
          customerAccessToken: data.customerAccessToken ?? null,
          meetingLink: null,
          meetingNotes: null,
          createdAt: new Date('2026-06-21T00:00:00.000Z'),
          updatedAt: new Date('2026-06-21T00:00:00.000Z'),
        }
      );
    },
    findMany: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'serviceTicket', operation: 'findMany', args });
      return mockData.serviceTickets || [];
    },
    findFirst: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'serviceTicket', operation: 'findFirst', args });
      if (mockData.serviceTicket === null) {
        return null;
      }
      const where =
        (
          args as {
            readonly where?: { readonly id?: string; readonly organizationId?: string };
          }
        ).where ?? {};
      return (
        mockData.serviceTicket || {
          id: where.id || 'ticket-1',
          organizationId: where.organizationId || 'organization-1',
          machineId: 'machine-1',
          customerId: 'customer-1',
          title: 'Mock Ticket',
          description: 'Mock Description',
          status: 'open',
          priority: 'normal',
          createdFromPortal: false,
          customerAccessToken: null,
          meetingLink: null,
          meetingNotes: null,
          createdAt: new Date('2026-06-21T00:00:00.000Z'),
          updatedAt: new Date('2026-06-21T00:00:00.000Z'),
        }
      );
    },
    update: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'serviceTicket', operation: 'update', args });
      const where = (args as { readonly where?: { readonly id?: string } }).where ?? {};
      const data = (args as { readonly data?: { readonly status?: string } }).data ?? {};
      return (
        mockData.serviceTicket || {
          id: where.id || 'ticket-1',
          organizationId: 'organization-1',
          machineId: 'machine-1',
          customerId: 'customer-1',
          title: 'Mock Ticket',
          description: 'Mock Description',
          status: data.status || 'open',
          priority: 'normal',
          createdFromPortal: false,
          customerAccessToken: null,
          meetingLink: null,
          meetingNotes: null,
          createdAt: new Date('2026-06-21T00:00:00.000Z'),
          updatedAt: new Date('2026-06-21T00:00:00.000Z'),
        }
      );
    },
  };

  const ticketComment = {
    create: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'ticketComment', operation: 'create', args });
      const data = (
        args as {
          readonly data: {
            readonly organizationId: string;
            readonly ticketId: string;
            readonly authorType: string;
            readonly message: string;
            readonly internalOnly: boolean;
            readonly attachmentUrl?: string | null;
            readonly attachmentStoragePath?: string | null;
          };
        }
      ).data;

      return (
        mockData.ticketComment || {
          id: 'comment-1',
          organizationId: data.organizationId,
          ticketId: data.ticketId,
          authorType: data.authorType,
          message: data.message,
          internalOnly: data.internalOnly,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentStoragePath: data.attachmentStoragePath ?? null,
          createdAt: new Date('2026-06-21T00:00:00.000Z'),
        }
      );
    },
    findMany: async (args: unknown): Promise<unknown> => {
      capturedOperations.push({ model: 'ticketComment', operation: 'findMany', args });
      return mockData.ticketComments || [];
    },
  };

  return {
    serviceTicket,
    ticketComment,
  } as unknown as PrismaClient;
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
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

async function runServiceTicketRecordsSmokeCheck(): Promise<void> {
  // Test createServiceTicket validations
  await expectThrows('blank organizationId for createServiceTicket', () =>
    createServiceTicket({
      db: createMockPrismaClient([]),
      organizationId: '   ',
      machineId: 'machine-1',
      title: 'Broken fan',
      description: 'The radiator fan has stopped spinning.',
    }),
  );

  await expectThrows('blank machineId for createServiceTicket', () =>
    createServiceTicket({
      db: createMockPrismaClient([]),
      organizationId: 'org-1',
      machineId: '   ',
      title: 'Broken fan',
      description: 'The radiator fan has stopped spinning.',
    }),
  );

  await expectThrows('blank title for createServiceTicket', () =>
    createServiceTicket({
      db: createMockPrismaClient([]),
      organizationId: 'org-1',
      machineId: 'machine-1',
      title: '  ',
      description: 'The radiator fan has stopped spinning.',
    }),
  );

  await expectThrows('blank description for createServiceTicket', () =>
    createServiceTicket({
      db: createMockPrismaClient([]),
      organizationId: 'org-1',
      machineId: 'machine-1',
      title: 'Broken fan',
      description: '   ',
    }),
  );

  // Test createServiceTicket success
  const createOps: CapturedOperation[] = [];
  const createDb = createMockPrismaClient(createOps);
  const ticket = await createServiceTicket({
    db: createDb,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
    title: ' Broken Fan ',
    description: ' Descriptions of the issue ',
    priority: 'high',
    createdFromPortal: true,
    customerAccessToken: ' access-token-xyz ',
  });

  if (ticket.title !== 'Broken Fan' || ticket.description !== 'Descriptions of the issue') {
    throw new Error('createServiceTicket() did not return expected ticket data.');
  }

  const createOp = findOperation(createOps, 'serviceTicket', 'create');
  const createOpData = (
    createOp.args as {
      readonly data: {
        readonly organizationId: string;
        readonly machineId: string;
        readonly title: string;
        readonly description: string;
        readonly priority: string;
        readonly createdFromPortal: boolean;
        readonly customerAccessToken: string;
      };
    }
  ).data;

  if (
    createOpData.organizationId !== 'organization-1' ||
    createOpData.machineId !== 'machine-1' ||
    createOpData.title !== 'Broken Fan' ||
    createOpData.description !== 'Descriptions of the issue' ||
    createOpData.priority !== 'high' ||
    createOpData.createdFromPortal !== true ||
    createOpData.customerAccessToken !== 'access-token-xyz'
  ) {
    throw new Error('createServiceTicket() arguments mapping was wrong.');
  }

  // Test listServiceTickets
  const listOps: CapturedOperation[] = [];
  const listDb = createMockPrismaClient(listOps);
  await listServiceTickets({
    db: listDb,
    organizationId: ' organization-1 ',
    machineId: ' machine-1 ',
  });

  const listOp = findOperation(listOps, 'serviceTicket', 'findMany');
  const listOpWhere = (
    listOp.args as {
      readonly where: { readonly organizationId: string; readonly machineId: string };
      readonly orderBy: { readonly createdAt: string };
      readonly take: number;
    }
  ).where;
  const listOpOrderBy = (
    listOp.args as {
      readonly where: { readonly organizationId: string; readonly machineId: string };
      readonly orderBy: { readonly createdAt: string };
      readonly take: number;
    }
  ).orderBy;
  const listOpTake = (
    listOp.args as {
      readonly where: { readonly organizationId: string; readonly machineId: string };
      readonly orderBy: { readonly createdAt: string };
      readonly take: number;
    }
  ).take;

  if (
    listOpWhere.organizationId !== 'organization-1' ||
    listOpWhere.machineId !== 'machine-1' ||
    listOpOrderBy.createdAt !== 'desc' ||
    listOpTake !== 50
  ) {
    throw new Error('listServiceTickets() findMany arguments were incorrect.');
  }

  // Test getServiceTicket
  const getOps: CapturedOperation[] = [];
  const getDb = createMockPrismaClient(getOps);
  const getTicket = await getServiceTicket({
    db: getDb,
    organizationId: ' organization-1 ',
    ticketId: ' ticket-1 ',
  });

  if (!getTicket || getTicket.id !== 'ticket-1') {
    throw new Error('getServiceTicket() did not return expected ticket.');
  }

  const getOp = findOperation(getOps, 'serviceTicket', 'findFirst');
  const getOpWhere = (
    getOp.args as { readonly where: { readonly id: string; readonly organizationId: string } }
  ).where;

  if (getOpWhere.id !== 'ticket-1' || getOpWhere.organizationId !== 'organization-1') {
    throw new Error('getServiceTicket() findFirst arguments were incorrect.');
  }

  // Test updateServiceTicketStatus
  const updateOps: CapturedOperation[] = [];
  const updateDb = createMockPrismaClient(updateOps);
  const updatedTicket = await updateServiceTicketStatus({
    db: updateDb,
    organizationId: ' organization-1 ',
    ticketId: ' ticket-1 ',
    status: 'under-review',
  });

  if (updatedTicket.status !== 'under-review') {
    throw new Error('updateServiceTicketStatus() did not return status under-review.');
  }

  const updateOp = findOperation(updateOps, 'serviceTicket', 'update');
  const updateOpWhere = (getOp.args as { readonly where: { readonly id: string } }).where;
  const updateOpData = (updateOp.args as { readonly data: { readonly status: string } }).data;

  if (updateOpWhere.id !== 'ticket-1' || updateOpData.status !== 'under-review') {
    throw new Error('updateServiceTicketStatus() update arguments were incorrect.');
  }

  // Test updateServiceTicketStatus not found
  const updateNotFoundDb = createMockPrismaClient([], { serviceTicket: null });
  await expectThrows('not found ticket for updateServiceTicketStatus', () =>
    updateServiceTicketStatus({
      db: updateNotFoundDb,
      organizationId: 'organization-1',
      ticketId: 'ticket-2',
      status: 'resolved',
    }),
  );

  // Test addTicketComment validation & success
  await expectThrows('empty message for addTicketComment', () =>
    addTicketComment({
      db: createMockPrismaClient([]),
      organizationId: 'org-1',
      ticketId: 'ticket-1',
      authorType: 'customer',
      message: '   ',
    }),
  );

  const commentOps: CapturedOperation[] = [];
  const commentDb = createMockPrismaClient(commentOps);
  const comment = await addTicketComment({
    db: commentDb,
    organizationId: ' organization-1 ',
    ticketId: ' ticket-1 ',
    authorType: 'customer',
    message: ' Fixed it! ',
    internalOnly: false,
    attachmentUrl: ' url ',
    attachmentStoragePath: ' path ',
  });

  if (comment.message !== 'Fixed it!') {
    throw new Error('addTicketComment() did not return expected comment message.');
  }

  const commentOp = findOperation(commentOps, 'ticketComment', 'create');
  const commentOpData = (
    commentOp.args as {
      readonly data: {
        readonly organizationId: string;
        readonly ticketId: string;
        readonly authorType: string;
        readonly message: string;
        readonly internalOnly: boolean;
        readonly attachmentUrl: string;
        readonly attachmentStoragePath: string;
      };
    }
  ).data;

  if (
    commentOpData.organizationId !== 'organization-1' ||
    commentOpData.ticketId !== 'ticket-1' ||
    commentOpData.authorType !== 'customer' ||
    commentOpData.message !== 'Fixed it!' ||
    commentOpData.internalOnly !== false ||
    commentOpData.attachmentUrl !== 'url' ||
    commentOpData.attachmentStoragePath !== 'path'
  ) {
    throw new Error('addTicketComment() create arguments were incorrect.');
  }

  // Test listTicketComments
  const listCommentsOps: CapturedOperation[] = [];
  const listCommentsDb = createMockPrismaClient(listCommentsOps);
  await listTicketComments({
    db: listCommentsDb,
    organizationId: ' organization-1 ',
    ticketId: ' ticket-1 ',
    includeInternal: false,
  });

  const listCommentsOp = findOperation(listCommentsOps, 'ticketComment', 'findMany');
  const listCommentsOpWhere = (
    listCommentsOp.args as {
      readonly where: {
        readonly ticketId: string;
        readonly organizationId: string;
        readonly internalOnly: boolean;
      };
      readonly orderBy: { readonly createdAt: string };
    }
  ).where;
  const listCommentsOpOrderBy = (
    listCommentsOp.args as {
      readonly where: {
        readonly ticketId: string;
        readonly organizationId: string;
        readonly internalOnly: boolean;
      };
      readonly orderBy: { readonly createdAt: string };
    }
  ).orderBy;

  if (
    listCommentsOpWhere.ticketId !== 'ticket-1' ||
    listCommentsOpWhere.organizationId !== 'organization-1' ||
    listCommentsOpWhere.internalOnly !== false ||
    listCommentsOpOrderBy.createdAt !== 'asc'
  ) {
    throw new Error('listTicketComments() findMany arguments were incorrect.');
  }

  // listTicketComments with includeInternal
  const listCommentsOps2: CapturedOperation[] = [];
  const listCommentsDb2 = createMockPrismaClient(listCommentsOps2);
  await listTicketComments({
    db: listCommentsDb2,
    organizationId: 'organization-1',
    ticketId: 'ticket-1',
    includeInternal: true,
  });

  const listCommentsOp2 = findOperation(listCommentsOps2, 'ticketComment', 'findMany');
  const listCommentsOp2Where = (
    listCommentsOp2.args as {
      readonly where: { readonly internalOnly?: boolean };
    }
  ).where;

  if (listCommentsOp2Where.internalOnly !== undefined) {
    throw new Error(
      'listTicketComments() should not filter internalOnly when includeInternal is true.',
    );
  }
}

await runServiceTicketRecordsSmokeCheck();

console.info('Service ticket records smoke check passed.');
