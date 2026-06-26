import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, QrPortalMachineRecord, QuoteRequestRecord } from '@buildtrace/db';
import { Prisma } from '@buildtrace/db/src/generated/prisma/client';
import { activityLogActions } from '@buildtrace/shared';

import {
  createPortalQuoteRequestFromRequest,
  createQuoteRequestFromRequest,
  listQuoteRequestsFromRequest,
  updateQuoteRequestStatusFromRequest,
  type QuoteRequestsEndpointDependencies,
} from './quote-requests.controller.js';

const now = new Date('2026-06-26T00:00:00.000Z');

const fakeQuoteRequest: QuoteRequestRecord = {
  id: 'quote-request-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  sparePartId: 'spare-part-1',
  ticketId: 'ticket-1',
  type: 'spare-part',
  title: 'Servo drive quote',
  description: 'Buyer requested replacement pricing.',
  quotedPrice: new Prisma.Decimal('120.50'),
  currency: 'EUR',
  status: 'requested',
  customerAccessToken: 'secret-customer-token',
  createdAt: now,
  updatedAt: now,
};

const fakeMachine: QrPortalMachineRecord = {
  id: 'machine-1',
  organizationId: 'org-1',
  customerId: 'customer-1',
  machineModelId: 'model-1',
  machineName: 'Packaging line',
  serialNumber: 'BT-100',
  deliveryDate: null,
  plcType: 'S7-1500',
  hmiType: 'Comfort Panel',
  status: 'ACTIVE',
  qrToken: 'qr-token-1',
  qrPinEnabled: false,
  qrPinHash: null,
  portalDefaultLocale: 'en',
  createdAt: now,
  updatedAt: now,
};

type ResolveInput = Parameters<
  QuoteRequestsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type CreateQuoteRequestInput = Parameters<
  QuoteRequestsEndpointDependencies['createQuoteRequest']
>[0];
type ListQuoteRequestsInput = Parameters<QuoteRequestsEndpointDependencies['listQuoteRequests']>[0];
type UpdateQuoteRequestStatusInput = Parameters<
  QuoteRequestsEndpointDependencies['updateQuoteRequestStatus']
>[0];
type GetQrPortalMachineInput = Parameters<
  QuoteRequestsEndpointDependencies['getQrPortalMachine']
>[0];
type ActivityInput = Parameters<QuoteRequestsEndpointDependencies['createActivityLog']>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly createQuoteRequestInputs: CreateQuoteRequestInput[];
  readonly listQuoteRequestsInputs: ListQuoteRequestsInput[];
  readonly updateQuoteRequestStatusInputs: UpdateQuoteRequestStatusInput[];
  readonly getQrPortalMachineInputs: GetQrPortalMachineInput[];
  readonly activityInputs: ActivityInput[];
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createQuoteRequestInputs: [],
    listQuoteRequestsInputs: [],
    updateQuoteRequestStatusInputs: [],
    getQrPortalMachineInputs: [],
    activityInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  options: {
    readonly qrTokenNotFound?: boolean;
  } = {},
): QuoteRequestsEndpointDependencies {
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
    createQuoteRequest: async (input) => {
      capturedCalls.createQuoteRequestInputs.push(input);
      return {
        ...fakeQuoteRequest,
        organizationId: input.organizationId,
        machineId: input.machineId,
        title: input.title,
        type: input.type ?? 'spare-part',
        description: input.description ?? null,
        sparePartId: input.sparePartId ?? null,
        ticketId: input.ticketId ?? null,
        currency: input.currency ?? 'EUR',
        customerAccessToken: input.customerAccessToken ?? null,
      };
    },
    listQuoteRequests: async (input) => {
      capturedCalls.listQuoteRequestsInputs.push(input);
      return [fakeQuoteRequest];
    },
    updateQuoteRequestStatus: async (input) => {
      capturedCalls.updateQuoteRequestStatusInputs.push(input);
      return {
        ...fakeQuoteRequest,
        organizationId: input.organizationId,
        id: input.quoteRequestId,
        status: input.status,
        quotedPrice:
          input.quotedPrice === undefined ? fakeQuoteRequest.quotedPrice : input.quotedPrice,
        currency: input.currency ?? fakeQuoteRequest.currency,
        updatedAt: now,
      };
    },
    getQrPortalMachine: async (input) => {
      capturedCalls.getQrPortalMachineInputs.push(input);
      return options.qrTokenNotFound ? null : fakeMachine;
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

function assertNoCustomerAccessToken(value: object, label: string): void {
  assert(!('customerAccessToken' in value), `${label} exposed customerAccessToken.`);
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

async function runCreateQuoteRequestCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const quoteRequest = await createQuoteRequestFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    body: {
      organizationId: ' org-1 ',
      title: ' Servo drive quote ',
      type: 'service',
      description: ' Buyer requested service pricing. ',
      sparePartId: ' spare-part-1 ',
      ticketId: ' ticket-1 ',
      currency: 'CZK',
    },
    dependencies: createDependencies(calls),
  });

  assert(quoteRequest.id === 'quote-request-1', 'Create quote request ID was wrong.');
  assert(quoteRequest.title === 'Servo drive quote', 'Create quote request title was wrong.');
  assert(quoteRequest.type === 'service', 'Create quote request type was wrong.');
  assert(quoteRequest.quotedPrice === '120.5', 'Create quoted price was not serialized.');
  assertNoCustomerAccessToken(quoteRequest, 'Create quote request response');
  assert(calls.resolveInputs.length === 1, 'Create quote request auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Create quote request roles were incorrect.',
  );
  assert(calls.createQuoteRequestInputs.length === 1, 'createQuoteRequest was not called once.');
  assert(
    calls.createQuoteRequestInputs[0]?.organizationId === 'org-1',
    'Create quote request organization was wrong.',
  );
  assert(
    calls.createQuoteRequestInputs[0]?.machineId === 'machine-1',
    'Create quote request machine was wrong.',
  );
  assert(
    calls.createQuoteRequestInputs[0]?.type === 'service',
    'Create quote request input type was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Create quote request activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.quoteRequestCreated,
    'Create quote request activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'quote_request',
    'Create quote request activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'quote-request-1',
    'Create quote request activity target ID was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Create quote actor was wrong.');
}

async function runListQuoteRequestsByMachineCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listQuoteRequestsFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' org-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.quoteRequests.length === 1, 'List quote requests count was wrong.');
  const quoteRequest = response.quoteRequests[0];
  assert(quoteRequest !== undefined, 'List quote requests response was empty.');
  assert(quoteRequest.id === 'quote-request-1', 'List quote request ID was wrong.');
  assert(quoteRequest.quotedPrice === '120.5', 'List quoted price was not serialized.');
  assertNoCustomerAccessToken(quoteRequest, 'List quote requests by machine response');
  assert(calls.resolveInputs.length === 1, 'List quote requests auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'List quote requests roles were incorrect.',
  );
  assert(calls.listQuoteRequestsInputs.length === 1, 'listQuoteRequests was not called once.');
  assert(
    calls.listQuoteRequestsInputs[0]?.organizationId === 'org-1',
    'List quote requests organization was wrong.',
  );
  assert(
    calls.listQuoteRequestsInputs[0]?.machineId === 'machine-1',
    'List quote requests machine filter was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'List quote requests must not create activity.');
}

async function runListQuoteRequestsForOrganizationCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listQuoteRequestsFromRequest({
    authorizationHeader: 'Bearer token-1',
    query: {
      organizationId: ' org-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.quoteRequests.length === 1, 'List all quote requests count was wrong.');
  const quoteRequest = response.quoteRequests[0];
  assert(quoteRequest !== undefined, 'List all quote requests response was empty.');
  assertNoCustomerAccessToken(quoteRequest, 'List all quote requests response');
  assert(calls.resolveInputs.length === 1, 'List all quote requests auth was not called once.');
  assert(
    calls.listQuoteRequestsInputs[0]?.machineId === undefined,
    'List all quote requests should not set a machine filter.',
  );
  assert(calls.activityInputs.length === 0, 'List all quote requests must not create activity.');
}

async function runUpdateQuoteRequestStatusCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const quoteRequest = await updateQuoteRequestStatusFromRequest({
    authorizationHeader: 'Bearer token-1',
    quoteRequestId: ' quote-request-1 ',
    body: {
      organizationId: ' org-1 ',
      status: 'quote-sent',
      quotedPrice: '250.75',
      currency: 'EUR',
    },
    dependencies: createDependencies(calls),
  });

  assert(quoteRequest.id === 'quote-request-1', 'Update quote request ID was wrong.');
  assert(quoteRequest.status === 'quote-sent', 'Update quote status was wrong.');
  assert(quoteRequest.quotedPrice === '250.75', 'Update quoted price was not serialized.');
  assertNoCustomerAccessToken(quoteRequest, 'Update quote request response');
  assert(calls.resolveInputs.length === 1, 'Update quote request auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Update quote request roles were incorrect.',
  );
  assert(
    calls.updateQuoteRequestStatusInputs.length === 1,
    'updateQuoteRequestStatus was not called once.',
  );
  assert(
    calls.updateQuoteRequestStatusInputs[0]?.quoteRequestId === 'quote-request-1',
    'Update quote request ID input was wrong.',
  );
  assert(
    calls.updateQuoteRequestStatusInputs[0]?.status === 'quote-sent',
    'Update quote status input was wrong.',
  );
  assert(
    calls.updateQuoteRequestStatusInputs[0]?.quotedPrice?.toString() === '250.75',
    'Update quoted price input was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Update quote request activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.quoteRequestStatusUpdated,
    'Update quote request activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'quote_request',
    'Update quote request activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'quote-request-1',
    'Update quote request activity target ID was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Update quote actor was wrong.');

  const invalidCalls = createCapturedCalls();
  await expectException('invalid status', BadRequestException, () =>
    updateQuoteRequestStatusFromRequest({
      authorizationHeader: 'Bearer token-1',
      quoteRequestId: 'quote-request-1',
      body: {
        organizationId: 'org-1',
        status: 'lost',
      },
      dependencies: createDependencies(invalidCalls),
    }),
  );
  assert(invalidCalls.resolveInputs.length === 0, 'Invalid status must not call auth.');
  assert(
    invalidCalls.updateQuoteRequestStatusInputs.length === 0,
    'Invalid status must not update a quote request.',
  );
}

async function runCreatePortalQuoteRequestCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await createPortalQuoteRequestFromRequest({
    qrToken: ' qr-token-1 ',
    machineId: ' machine-1 ',
    body: {
      title: ' Portal spare part quote ',
      type: 'spare-part',
      description: ' Buyer requested a public portal quote. ',
      sparePartId: ' spare-part-1 ',
      currency: 'EUR',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.quoteRequestId === 'quote-request-1', 'Portal quote request ID was wrong.');
  assert(
    response.customerAccessToken.length > 20,
    'Portal quote customer access token was missing.',
  );
  assert(calls.resolveInputs.length === 0, 'Portal quote request must not call auth.');
  assert(calls.getQrPortalMachineInputs.length === 1, 'Portal quote did not read QR portal.');
  assert(
    calls.getQrPortalMachineInputs[0]?.qrToken === 'qr-token-1',
    'Portal quote QR token was wrong.',
  );
  assert(calls.createQuoteRequestInputs.length === 1, 'Portal quote was not created once.');
  assert(
    calls.createQuoteRequestInputs[0]?.organizationId === 'org-1',
    'Portal quote organization was wrong.',
  );
  assert(
    calls.createQuoteRequestInputs[0]?.machineId === 'machine-1',
    'Portal quote machine was wrong.',
  );
  assert(
    calls.createQuoteRequestInputs[0]?.customerAccessToken === response.customerAccessToken,
    'Portal quote customer access token was not stored.',
  );
  assert(calls.activityInputs.length === 1, 'Portal quote activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.quoteRequestCreated,
    'Portal quote activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.actorUserId === undefined,
    'Portal quote activity must not have a builder actor.',
  );

  const missingCalls = createCapturedCalls();
  await expectException('missing QR portal', NotFoundException, () =>
    createPortalQuoteRequestFromRequest({
      qrToken: 'missing-token',
      machineId: 'machine-1',
      body: {
        title: 'Portal spare part quote',
      },
      dependencies: createDependencies(missingCalls, { qrTokenNotFound: true }),
    }),
  );
  assert(missingCalls.createQuoteRequestInputs.length === 0, 'Missing QR must not create quote.');
  assert(missingCalls.activityInputs.length === 0, 'Missing QR must not create activity.');
}

await runCreateQuoteRequestCheck();
await runListQuoteRequestsByMachineCheck();
await runListQuoteRequestsForOrganizationCheck();
await runUpdateQuoteRequestStatusCheck();
await runCreatePortalQuoteRequestCheck();

console.info('Quote requests controller smoke check passed.');
