import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, QrPortalMachineRecord } from '@buildtrace/db';
import type { ServiceTicketRecord, TicketCommentRecord } from '@buildtrace/db';
import { activityLogActions } from '@buildtrace/shared';

import {
  addTicketCommentFromRequest,
  addTicketCommentAttachmentFromRequest,
  createPortalServiceTicketFromRequest,
  createServiceTicketFromRequest,
  createTicketCommentAttachmentDownloadUrlFromRequest,
  getServiceTicketFromRequest,
  listServiceTicketsFromRequest,
  listTicketCommentsFromRequest,
  updateTicketMeetingLinkFromRequest,
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

const fakePortalMachine: QrPortalMachineRecord = {
  id: 'machine-1',
  organizationId: 'org-1',
  customerId: 'customer-1',
  machineModelId: 'machine-model-1',
  machineName: 'Press One',
  serialNumber: 'SN-100',
  deliveryDate: null,
  plcType: null,
  hmiType: null,
  status: 'ACTIVE',
  qrToken: 'qr-token-1',
  qrPinEnabled: false,
  qrPinHash: null,
  portalDefaultLocale: 'en',
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

const fakeAttachmentComment: TicketCommentRecord = {
  ...fakeComment,
  attachmentStoragePath: 'organizations/org-1/tickets/ticket-1/attachments/report.pdf',
};

type ResolveInput = Parameters<
  ServiceTicketsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type CreateTicketInput = Parameters<ServiceTicketsEndpointDependencies['createServiceTicket']>[0];
type GetQrPortalMachineInput = Parameters<
  ServiceTicketsEndpointDependencies['getQrPortalMachine']
>[0];
type ListTicketsInput = Parameters<ServiceTicketsEndpointDependencies['listServiceTickets']>[0];
type GetTicketInput = Parameters<ServiceTicketsEndpointDependencies['getServiceTicket']>[0];
type GetCommentInput = Parameters<ServiceTicketsEndpointDependencies['getTicketComment']>[0];
type UpdateStatusInput = Parameters<
  ServiceTicketsEndpointDependencies['updateServiceTicketStatus']
>[0];
type UpdateMeetingInput = Parameters<
  ServiceTicketsEndpointDependencies['updateTicketMeetingLink']
>[0];
type AddCommentInput = Parameters<ServiceTicketsEndpointDependencies['addTicketComment']>[0];
type ListCommentsInput = Parameters<ServiceTicketsEndpointDependencies['listTicketComments']>[0];
type ActivityInput = Parameters<ServiceTicketsEndpointDependencies['createActivityLog']>[0];
type UploadAttachmentInput = Parameters<
  ServiceTicketsEndpointDependencies['uploadTicketAttachment']
>[0];
type CreateAttachmentSignedUrlInput = Parameters<
  ServiceTicketsEndpointDependencies['createTicketAttachmentSignedUrl']
>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly createTicketInputs: CreateTicketInput[];
  readonly getQrPortalMachineInputs: GetQrPortalMachineInput[];
  readonly listTicketsInputs: ListTicketsInput[];
  readonly getTicketInputs: GetTicketInput[];
  readonly getCommentInputs: GetCommentInput[];
  readonly updateStatusInputs: UpdateStatusInput[];
  readonly updateMeetingInputs: UpdateMeetingInput[];
  readonly addCommentInputs: AddCommentInput[];
  readonly listCommentsInputs: ListCommentsInput[];
  readonly activityInputs: ActivityInput[];
  readonly uploadAttachmentInputs: UploadAttachmentInput[];
  readonly createAttachmentSignedUrlInputs: CreateAttachmentSignedUrlInput[];
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createTicketInputs: [],
    getQrPortalMachineInputs: [],
    listTicketsInputs: [],
    getTicketInputs: [],
    getCommentInputs: [],
    updateStatusInputs: [],
    updateMeetingInputs: [],
    addCommentInputs: [],
    listCommentsInputs: [],
    activityInputs: [],
    uploadAttachmentInputs: [],
    createAttachmentSignedUrlInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  options: {
    readonly ticketNotFound?: boolean;
    readonly portalMachineNotFound?: boolean;
    readonly commentNotFound?: boolean;
    readonly commentWithoutAttachment?: boolean;
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
    getQrPortalMachine: async (input) => {
      capturedCalls.getQrPortalMachineInputs.push(input);
      return options.portalMachineNotFound ? null : fakePortalMachine;
    },
    listServiceTickets: async (input) => {
      capturedCalls.listTicketsInputs.push(input);
      return [fakeTicket];
    },
    getServiceTicket: async (input) => {
      capturedCalls.getTicketInputs.push(input);
      return options.ticketNotFound ? null : fakeTicket;
    },
    getTicketComment: async (input) => {
      capturedCalls.getCommentInputs.push(input);

      if (options.commentNotFound) {
        return null;
      }

      return options.commentWithoutAttachment ? fakeComment : fakeAttachmentComment;
    },
    updateServiceTicketStatus: async (input) => {
      capturedCalls.updateStatusInputs.push(input);
      return { ...fakeTicket, status: input.status, updatedAt: now };
    },
    updateTicketMeetingLink: async (input) => {
      capturedCalls.updateMeetingInputs.push(input);
      return {
        ...fakeTicket,
        meetingLink: input.meetingLink,
        meetingNotes: input.meetingNotes,
        updatedAt: now,
      };
    },
    addTicketComment: async (input) => {
      capturedCalls.addCommentInputs.push(input);
      return {
        ...fakeComment,
        message: input.message,
        internalOnly: input.internalOnly ?? false,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentStoragePath: input.attachmentStoragePath ?? null,
      };
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
    uploadTicketAttachment: async (input) => {
      capturedCalls.uploadAttachmentInputs.push(input);
      return {
        storagePath: `organizations/${input.organizationId}/tickets/${input.ticketId}/attachments/${input.fileName}`,
      };
    },
    createTicketAttachmentSignedUrl: async (input) => {
      capturedCalls.createAttachmentSignedUrlInputs.push(input);
      return {
        signedUrl: 'https://storage.test/ticket-attachment',
        expiresInSeconds: input.config.signedUrlTtlSeconds,
      };
    },
    readDocumentStorageConfig: () => ({
      supabaseUrl: 'https://supabase.test',
      serviceRoleKey: 'service-role-key',
      bucketName: 'documents-private',
      signedUrlTtlSeconds: 300,
    }),
    createDocumentStorageAdapter: () =>
      ({}) as ReturnType<ServiceTicketsEndpointDependencies['createDocumentStorageAdapter']>,
  };
}

async function runCreatePortalTicketCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await createPortalServiceTicketFromRequest({
    qrToken: ' qr-token-1 ',
    machineId: ' machine-1 ',
    body: {
      title: 'Press fault',
      description: 'Machine stopped',
      priority: 'high',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.ticketId === 'ticket-1', 'Portal ticket ID was wrong.');
  assert(response.customerAccessToken.length > 0, 'Customer access token was not returned.');
  assert(calls.resolveInputs.length === 0, 'Portal ticket creation must not call auth.');
  assert(calls.getQrPortalMachineInputs.length === 1, 'Portal machine lookup was not called once.');
  assert(
    calls.getQrPortalMachineInputs[0]?.qrToken === 'qr-token-1',
    'Portal machine lookup token was wrong.',
  );
  assert(calls.createTicketInputs.length === 1, 'Portal ticket was not created once.');
  assert(
    calls.createTicketInputs[0]?.organizationId === 'org-1',
    'Portal ticket organization was wrong.',
  );
  assert(
    calls.createTicketInputs[0]?.machineId === 'machine-1',
    'Portal ticket machine was wrong.',
  );
  assert(
    calls.createTicketInputs[0]?.createdFromPortal === true,
    'Portal ticket was not marked as created from portal.',
  );
  assert(calls.createTicketInputs[0]?.priority === 'high', 'Portal ticket priority was wrong.');
  assert(
    calls.createTicketInputs[0]?.customerAccessToken === response.customerAccessToken,
    'Created ticket did not receive the returned customer access token.',
  );
  assert(calls.activityInputs.length === 1, 'Portal ticket activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.ticketCreated,
    'Portal ticket activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.actorUserId === undefined,
    'Portal ticket activity must not have an actor user.',
  );

  await expectException('unknown QR portal', NotFoundException, () =>
    createPortalServiceTicketFromRequest({
      qrToken: 'unknown-token',
      machineId: 'machine-1',
      body: {
        title: 'Press fault',
        description: 'Machine stopped',
      },
      dependencies: createDependencies(createCapturedCalls(), { portalMachineNotFound: true }),
    }),
  );

  const mismatchCalls = createCapturedCalls();
  await expectException('portal machine mismatch', BadRequestException, () =>
    createPortalServiceTicketFromRequest({
      qrToken: 'qr-token-1',
      machineId: 'machine-2',
      body: {
        title: 'Press fault',
        description: 'Machine stopped',
      },
      dependencies: createDependencies(mismatchCalls),
    }),
  );
  assert(mismatchCalls.resolveInputs.length === 0, 'Machine mismatch must not call auth.');
  assert(
    mismatchCalls.createTicketInputs.length === 0,
    'Machine mismatch must not create a ticket.',
  );
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

async function runUpdateMeetingCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const ticket = await updateTicketMeetingLinkFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: ' ticket-1 ',
    body: {
      organizationId: ' org-1 ',
      meetingLink: ' https://meet.example.com/support ',
      meetingNotes: ' Buyer and technician invited. ',
    },
    dependencies: createDependencies(calls),
  });

  assert(ticket.id === 'ticket-1', 'Update meeting ticket ID was wrong.');
  assert(
    ticket.meetingLink === 'https://meet.example.com/support',
    'Update meeting link response was wrong.',
  );
  assert(calls.resolveInputs.length === 1, 'Update meeting auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Update meeting roles were incorrect.',
  );
  assert(calls.updateMeetingInputs.length === 1, 'updateTicketMeetingLink was not called.');
  assert(
    calls.updateMeetingInputs[0]?.meetingLink === 'https://meet.example.com/support',
    'Update meeting link input was wrong.',
  );
  assert(
    calls.updateMeetingInputs[0]?.meetingNotes === 'Buyer and technician invited.',
    'Update meeting notes input was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'Update meeting must not create activity.');
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

async function runAddCommentAttachmentCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await addTicketCommentAttachmentFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: ' ticket-1 ',
    request: {
      file: async () => ({
        filename: ' report.pdf ',
        fields: {
          organizationId: { value: ' org-1 ' },
          message: { value: ' Attached diagnostic report. ' },
          internalOnly: { value: 'true' },
        },
        file: (async function* () {
          yield new Uint8Array([1, 2, 3]);
        })(),
      }),
    },
    dependencies: createDependencies(calls),
  });

  assert(response.id === 'comment-1', 'Attachment comment ID was wrong.');
  assert(
    response.attachmentStoragePath ===
      'organizations/org-1/tickets/ticket-1/attachments/report.pdf',
    'Attachment comment storage path was wrong.',
  );
  assert(calls.resolveInputs.length === 1, 'Attachment comment auth was not called.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Attachment comment roles were incorrect.',
  );
  assert(calls.getTicketInputs.length === 1, 'Attachment comment ticket lookup was not called.');
  assert(calls.uploadAttachmentInputs.length === 1, 'Attachment upload was not called.');
  assert(
    calls.uploadAttachmentInputs[0]?.fileName === 'report.pdf',
    'Attachment file name was not normalized.',
  );
  assert(calls.addCommentInputs.length === 1, 'Attachment comment was not created.');
  assert(
    calls.addCommentInputs[0]?.attachmentUrl === null,
    'Attachment comment must not store a signed URL.',
  );
  assert(
    calls.addCommentInputs[0]?.attachmentStoragePath ===
      'organizations/org-1/tickets/ticket-1/attachments/report.pdf',
    'Attachment storage path was wrong.',
  );
  assert(
    calls.addCommentInputs[0]?.internalOnly === true,
    'Attachment comment internalOnly was wrong.',
  );
  assert(
    calls.activityInputs[0]?.action === activityLogActions.ticketCommentAdded,
    'Attachment comment activity action was wrong.',
  );
}

async function runCreateCommentAttachmentDownloadUrlCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await createTicketCommentAttachmentDownloadUrlFromRequest({
    authorizationHeader: 'Bearer token-1',
    ticketId: ' ticket-1 ',
    commentId: ' comment-1 ',
    body: { organizationId: ' org-1 ' },
    dependencies: createDependencies(calls),
  });

  assert(response.commentId === 'comment-1', 'Attachment download comment ID was wrong.');
  assert(
    response.downloadUrl === 'https://storage.test/ticket-attachment',
    'Attachment download URL was wrong.',
  );
  assert(response.expiresInSeconds === 300, 'Attachment download expiry was wrong.');
  assert(calls.resolveInputs.length === 1, 'Attachment download auth was not called.');
  assert(calls.getTicketInputs.length === 1, 'Attachment download ticket lookup was not called.');
  assert(calls.getCommentInputs.length === 1, 'Attachment download comment lookup was not called.');
  assert(
    calls.createAttachmentSignedUrlInputs[0]?.storagePath ===
      fakeAttachmentComment.attachmentStoragePath,
    'Attachment signed URL storage path was wrong.',
  );
  assert(
    calls.activityInputs[0]?.action === activityLogActions.documentDownloadUrlIssued,
    'Attachment download activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'ticket_comment',
    'Attachment download activity target type was wrong.',
  );

  await expectException('comment not found', NotFoundException, () =>
    createTicketCommentAttachmentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      ticketId: 'ticket-1',
      commentId: 'comment-404',
      body: { organizationId: 'org-1' },
      dependencies: createDependencies(createCapturedCalls(), {
        commentNotFound: true,
      }),
    }),
  );

  await expectException('comment without attachment', NotFoundException, () =>
    createTicketCommentAttachmentDownloadUrlFromRequest({
      authorizationHeader: 'Bearer token-1',
      ticketId: 'ticket-1',
      commentId: 'comment-1',
      body: { organizationId: 'org-1' },
      dependencies: createDependencies(createCapturedCalls(), {
        commentWithoutAttachment: true,
      }),
    }),
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
await runCreatePortalTicketCheck();
await runListTicketsCheck();
await runGetTicketCheck();
await runUpdateStatusCheck();
await runUpdateMeetingCheck();
await runAddCommentCheck();
await runAddCommentAttachmentCheck();
await runCreateCommentAttachmentDownloadUrlCheck();
await runListCommentsCheck();

console.info('Service tickets controller smoke check passed.');
