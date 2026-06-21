import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@buildtrace/db';
import type { ServiceTicketRecord, TicketCommentRecord } from '@buildtrace/db';
import { activityLogActions } from '@buildtrace/shared';

import {
  addTicketCommentFromRequest,
  createServiceTicketFromRequest,
  getServiceTicketFromRequest,
  listServiceTicketsFromRequest,
  listTicketCommentsFromRequest,
  updateTicketStatusFromRequest,
  type ServiceTicketsEndpointDependencies,
} from './service-tickets.controller.js';

const now = new Date('2026-06-21T00:00:00.000Z');

const fakeTicket: ServiceTicketRecord = {
  id: 'ticket-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  customerId: null,
  title: 'Press fault',
  description: 'Machine stopped unexpectedly',
  status: 'open',
  priority: 'normal',
  createdFromPortal: false,
  customerAccessToken: null,
  meetingLink: null,
  meetingNotes: null,
  createdAt: now,
  updatedAt: now,
};

const fakeComment: TicketCommentRecord = {
  id: 'comment-1',
  organizationId: 'org-1',
  ticketId: 'ticket-1',
  authorType: 'builder',
  message: 'Investigating the fault now.',
  internalOnly: false,
  attachmentUrl: null,
  attachmentStoragePath: null,
  createdAt: now,
};

type ResolveInput = Parameters<
  ServiceTicketsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type CreateTicketInput = Parameters<ServiceTicketsEndpointDependencies['createServiceTicket']>[0];
type ListTicketsInput = Parameters<ServiceTicketsEndpointDependencies['listServiceTickets']>[0];
type GetTicketInput = Parameters<ServiceTicketsEndpointDependencies['getServiceTicket']>[0];
type UpdateStatusInput = Parameters<
  ServiceTicketsEndpointDependencies['updateServiceTicketStatus']
>[0];
type AddCommentInput = Parameters<ServiceTicketsEndpointDependencies['addTicketComment']>[0];
type ListCommentsInput = Parameters<ServiceTicketsEndpointDependencies['listTicketComments']>[0];
type ActivityInput = Parameters<ServiceTicketsEndpointDependencies['createActivityLog']>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly createTicketInputs: CreateTicketInput[];
  readonly listTicketsInputs: ListTicketsInput[];
  readonly getTicketInputs: GetTicketInput[];
  readonly updateStatusInputs: UpdateStatusInput[];
  readonly addCommentInputs: AddCommentInput[];
  readonly listCommentsInputs: ListCommentsInput[];
  readonly activityInputs: ActivityInput[];
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createTicketInputs: [],
    listTicketsInputs: [],
    getTicketInputs: [],
    updateStatusInputs: [],
    addCommentInputs: [],
    listCommentsInputs: [],
    activityInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  options: {
    readonly ticketNotFound?: boolean;
  } = {},
): ServiceTicketsEndpointDependencies {
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
    createServiceTicket: async (input) => {
      capturedCalls.createTicketInputs.push(input);
      return fakeTicket;
    },
    listServiceTickets: async (input) => {
      capturedCalls.listTicketsInputs.push(input);
      return [fakeTicket];
    },
    getServiceTicket: async (input) => {
      capturedCalls.getTicketInputs.push(input);
      return options.ticketNotFound ? null : fakeTicket;
    },
    updateServiceTicketStatus: async (input) => {
      capturedCalls.updateStatusInputs.push(input);
      return { ...fakeTicket, status: input.status, updatedAt: now };
    },
    addTicketComment: async (input) => {
      capturedCalls.addCommentInputs.push(input);
      return { ...fakeComment, message: input.message, internalOnly: input.internalOnly ?? false };
    },
    listTicketComments: async (input) => {
      capturedCalls.listCommentsInputs.push(input);
      return [fakeComment];
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

async function runCreateTicketCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const ticket = await createServiceTicketFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    body: {
      organizationId: ' org-1 ',
      title: 'Press fault',
      description: 'Machine stopped',
    },
    dependencies: createDependencies(calls),
  });

  assert(ticket.id === 'ticket-1', 'Create ticket ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Create ticket roles were incorrect.',
  );
  assert(calls.createTicketInputs.length === 1, 'createServiceTicket was not called once.');
  assert(calls.createTicketInputs[0]?.organizationId === 'org-1', 'Create ticket org was wrong.');
  assert(
    calls.createTicketInputs[0]?.machineId === 'machine-1',
    'Create ticket machine was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.ticketCreated,
    'Create ticket activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'ticket',
    'Create ticket activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'ticket-1',
    'Create ticket activity target ID was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Create ticket actor was wrong.');
}

async function runListTicketsCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listServiceTicketsFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: 'machine-1',
    query: { organizationId: 'org-1' },
    dependencies: createDependencies(calls),
  });

  assert(response.tickets.length === 1, 'List tickets count was wrong.');
  assert(response.tickets[0]?.id === 'ticket-1', 'List tickets ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'List tickets roles were incorrect.',
  );
  assert(calls.listTicketsInputs.length === 1, 'listServiceTickets was not called.');
  assert(
    calls.listTicketsInputs[0]?.machineId === 'machine-1',
    'List tickets machine filter was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'List tickets must not create activity.');
}

async function runGetTicketCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const ticket = await getServiceTicketFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: 'ticket-1',
    query: { organizationId: 'org-1' },
    dependencies: createDependencies(calls),
  });

  assert(ticket.id === 'ticket-1', 'Get ticket ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Get ticket roles were incorrect.',
  );
  assert(calls.getTicketInputs[0]?.ticketId === 'ticket-1', 'Get ticket ID input was wrong.');
  assert(calls.activityInputs.length === 0, 'Get ticket must not create activity.');

  await expectException('unknown ticket', NotFoundException, () =>
    getServiceTicketFromRequest({
      authorizationHeader: 'Bearer token-1',
      ticketId: 'ticket-404',
      query: { organizationId: 'org-1' },
      dependencies: createDependencies(createCapturedCalls(), { ticketNotFound: true }),
    }),
  );
}

async function runUpdateStatusCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const ticket = await updateTicketStatusFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: 'ticket-1',
    body: { organizationId: 'org-1', status: 'resolved' },
    dependencies: createDependencies(calls),
  });

  assert(ticket.id === 'ticket-1', 'Update status ticket ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Update status roles were incorrect.',
  );
  assert(calls.updateStatusInputs.length === 1, 'updateServiceTicketStatus was not called.');
  assert(calls.updateStatusInputs[0]?.status === 'resolved', 'Update status value was wrong.');
  assert(calls.activityInputs.length === 1, 'Update status activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.ticketStatusUpdated,
    'Update status activity action was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Update status actor was wrong.');
  assert(
    calls.activityInputs[0]?.targetId === 'ticket-1',
    'Update status activity target ID was wrong.',
  );

  await expectException('invalid status', BadRequestException, () =>
    updateTicketStatusFromRequest({
      authorizationHeader: 'Bearer token-1',
      ticketId: 'ticket-1',
      body: { organizationId: 'org-1', status: 'invalid-status' },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );
}

async function runAddCommentCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const comment = await addTicketCommentFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: 'ticket-1',
    body: {
      organizationId: 'org-1',
      message: 'Investigating the fault.',
      internalOnly: true,
    },
    dependencies: createDependencies(calls),
  });

  assert(comment.id === 'comment-1', 'Add comment ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Add comment roles were incorrect.',
  );
  assert(calls.addCommentInputs.length === 1, 'addTicketComment was not called.');
  assert(
    calls.addCommentInputs[0]?.authorType === 'builder',
    'Add comment authorType was not builder.',
  );
  assert(calls.addCommentInputs[0]?.internalOnly === true, 'Add comment internalOnly was wrong.');
  assert(calls.activityInputs.length === 1, 'Add comment activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.ticketCommentAdded,
    'Add comment activity action was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Add comment actor was wrong.');
  assert(
    calls.activityInputs[0]?.targetId === 'ticket-1',
    'Add comment activity target ID was wrong.',
  );

  const callsNoInternal = createCapturedCalls();

  await addTicketCommentFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: 'ticket-1',
    body: { organizationId: 'org-1', message: 'Hello' },
    dependencies: createDependencies(callsNoInternal),
  });

  assert(
    callsNoInternal.addCommentInputs[0]?.internalOnly === false,
    'Add comment internalOnly should default to false.',
  );
}

async function runListCommentsCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listTicketCommentsFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: 'ticket-1',
    query: { organizationId: 'org-1' },
    dependencies: createDependencies(calls),
  });

  assert(response.comments.length === 1, 'List comments count was wrong.');
  assert(response.comments[0]?.id === 'comment-1', 'List comments ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'List comments roles were incorrect.',
  );
  assert(calls.listCommentsInputs.length === 1, 'listTicketComments was not called.');
  assert(
    calls.listCommentsInputs[0]?.includeInternal === true,
    'List comments must include internal for builder.',
  );
  assert(calls.activityInputs.length === 0, 'List comments must not create activity.');
}

await runCreateTicketCheck();
await runListTicketsCheck();
await runGetTicketCheck();
await runUpdateStatusCheck();
await runAddCommentCheck();
await runListCommentsCheck();

console.info('Service tickets controller smoke check passed.');
