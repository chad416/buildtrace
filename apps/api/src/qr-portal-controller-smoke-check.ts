import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, QrPortalMachineRecord } from '@buildtrace/db';
import { activityLogActions } from '@buildtrace/shared';

import {
  assignMachineQrTokenFromRequest,
  disableMachineQrPortalFromRequest,
  getMachineQrTokenFromRequest,
  getQrPortalFromRequest,
  rotateMachineQrTokenFromRequest,
  type QrPortalEndpointDependencies,
} from './qr-portal.controller.js';

type ResolveInput = Parameters<
  QrPortalEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type AssignInput = Parameters<QrPortalEndpointDependencies['assignQrToken']>[0];
type GetMachineTokenInput = Parameters<QrPortalEndpointDependencies['getMachineQrToken']>[0];
type GetPortalInput = Parameters<QrPortalEndpointDependencies['getQrPortalMachine']>[0];
type ActivityInput = Parameters<QrPortalEndpointDependencies['createActivityLog']>[0];
type MachineUpdateInput = Parameters<PrismaClient['machine']['updateMany']>[0];
type MachineUpdateResult = Awaited<ReturnType<PrismaClient['machine']['updateMany']>>;

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly assignInputs: AssignInput[];
  readonly getMachineTokenInputs: GetMachineTokenInput[];
  readonly getPortalInputs: GetPortalInput[];
  readonly activityInputs: ActivityInput[];
  readonly machineUpdateInputs: MachineUpdateInput[];
};

const now = new Date('2026-06-21T00:00:00.000Z');

const portalMachine: QrPortalMachineRecord = {
  id: 'machine-1',
  organizationId: 'organization-1',
  customerId: 'customer-1',
  machineModelId: 'machine-model-1',
  machineName: 'Press One',
  serialNumber: 'SN-100',
  deliveryDate: null,
  plcType: 'S7-1500',
  hmiType: 'Comfort Panel',
  status: 'ACTIVE',
  qrToken: 'public-token',
  qrPinEnabled: true,
  qrPinHash: 'must-not-leak',
  portalDefaultLocale: 'de',
  createdAt: now,
  updatedAt: now,
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    assignInputs: [],
    getMachineTokenInputs: [],
    getPortalInputs: [],
    activityInputs: [],
    machineUpdateInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  options: {
    readonly machineUpdateCount?: number;
    readonly portalMachine?: QrPortalMachineRecord | null;
  } = {},
): QrPortalEndpointDependencies {
  const fakeDb = {
    machine: {
      updateMany: async (input: MachineUpdateInput): Promise<MachineUpdateResult> => {
        capturedCalls.machineUpdateInputs.push(input);

        return {
          count: options.machineUpdateCount ?? 1,
        };
      },
    },
  } as unknown as PrismaClient;

  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push(input);

      return {
        currentUser: {
          appUserId: 'app-user-1',
          authUserId: 'auth-user-1',
          email: 'builder@buildtrace.test',
          organizations: [
            {
              id: input.organizationId,
              role: 'OWNER',
            },
          ],
        },
        organizationAccess: {
          organizationId: input.organizationId,
          role: 'OWNER',
        },
      };
    },
    assignQrToken: async (input) => {
      capturedCalls.assignInputs.push(input);

      return {
        qrToken: capturedCalls.assignInputs.length === 1 ? 'assigned-token' : 'rotated-token',
      };
    },
    getMachineQrToken: async (input) => {
      capturedCalls.getMachineTokenInputs.push(input);

      return {
        qrToken: 'assigned-token',
      };
    },
    getQrPortalMachine: async (input) => {
      capturedCalls.getPortalInputs.push(input);

      return options.portalMachine === undefined ? portalMachine : options.portalMachine;
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

async function runAssignCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await assignMachineQrTokenFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.machineId === 'machine-1', 'Assigned machine ID was not normalized.');
  assert(response.qrToken === 'assigned-token', 'Assigned QR token was incorrect.');
  assert(calls.resolveInputs.length === 1, 'Assign authentication was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Assign roles were incorrect.',
  );
  assert(calls.assignInputs.length === 1, 'QR token assignment was not called once.');
  assert(calls.assignInputs[0]?.organizationId === 'organization-1', 'Assign tenant was wrong.');
  assert(calls.assignInputs[0]?.machineId === 'machine-1', 'Assign machine was wrong.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.machineQrTokenAssigned,
    'Assign activity action was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Assign actor was wrong.');
  assert(calls.activityInputs[0]?.targetType === 'machine', 'Assign target type was wrong.');
  assert(calls.activityInputs[0]?.targetId === 'machine-1', 'Assign target ID was wrong.');
}

async function runReadCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await getMachineQrTokenFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: 'machine-1',
    query: {
      organizationId: 'organization-1',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.machineId === 'machine-1', 'Read machine ID was wrong.');
  assert(response.qrToken === 'assigned-token', 'Read QR token was wrong.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Read roles were incorrect.',
  );
  assert(calls.getMachineTokenInputs.length === 1, 'QR token read was not called once.');
  assert(calls.activityInputs.length === 0, 'QR token read must not create activity.');
}

async function runRotateCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const dependencies = createDependencies(calls);

  await assignMachineQrTokenFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: 'machine-1',
    query: {
      organizationId: 'organization-1',
    },
    dependencies,
  });

  const response = await rotateMachineQrTokenFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: 'machine-1',
    query: {
      organizationId: 'organization-1',
    },
    dependencies,
  });

  assert(response.qrToken === 'rotated-token', 'Rotated QR token was incorrect.');
  assert(
    calls.resolveInputs[1]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Rotate roles were incorrect.',
  );
  assert(
    calls.activityInputs[1]?.action === activityLogActions.machineQrTokenRotated,
    'Rotate activity action was wrong.',
  );
}

async function runDisableCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await disableMachineQrPortalFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.machineId === 'machine-1', 'Disabled machine ID was wrong.');
  assert(response.disabled === true, 'Disable response was wrong.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Disable roles were incorrect.',
  );

  const update = calls.machineUpdateInputs[0];

  assert(update !== undefined, 'Disable update was not called.');
  assert(update.where?.id === 'machine-1', 'Disable update machine scope was wrong.');
  assert(
    update.where?.organizationId === 'organization-1',
    'Disable update tenant scope was wrong.',
  );
  assert(update.data.qrToken === null, 'Disable update did not clear the QR token.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.machineQrPortalDisabled,
    'Disable activity action was wrong.',
  );

  const missingCalls = createCapturedCalls();

  await expectException('missing machine disable', NotFoundException, () =>
    disableMachineQrPortalFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(missingCalls, {
        machineUpdateCount: 0,
      }),
    }),
  );

  assert(
    missingCalls.activityInputs.length === 0,
    'Missing machine disable must not create activity.',
  );
}

async function runPublicPortalCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await getQrPortalFromRequest({
    qrToken: ' public-token ',
    dependencies: createDependencies(calls),
  });

  assert(calls.resolveInputs.length === 0, 'Public portal must skip authentication.');
  assert(calls.getPortalInputs[0]?.qrToken === 'public-token', 'Public token was not normalized.');
  assert(response.machineId === 'machine-1', 'Public machine ID was wrong.');
  assert(response.machineName === 'Press One', 'Public machine name was wrong.');
  assert(response.serialNumber === 'SN-100', 'Public serial number was wrong.');
  assert(response.portalDefaultLocale === 'de', 'Public locale was wrong.');

  const serialized = JSON.stringify(response);

  assert(!serialized.includes('qrPinHash'), 'Public response exposed the QR PIN hash.');
  assert(!serialized.includes('plcType'), 'Public response exposed PLC data.');
  assert(!serialized.includes('hmiType'), 'Public response exposed HMI data.');
  assert(!serialized.includes('document'), 'Public response exposed document data.');

  const missingCalls = createCapturedCalls();

  await expectException('unknown QR token', NotFoundException, () =>
    getQrPortalFromRequest({
      qrToken: 'unknown-token',
      dependencies: createDependencies(missingCalls, {
        portalMachine: null,
      }),
    }),
  );

  assert(missingCalls.resolveInputs.length === 0, 'Unknown public token must skip authentication.');
}

async function runValidationCheck(): Promise<void> {
  await expectException('missing organization ID', BadRequestException, () =>
    assignMachineQrTokenFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      query: {},
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectException('missing public QR token', BadRequestException, () =>
    getQrPortalFromRequest({
      qrToken: '   ',
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );
}

await runAssignCheck();
await runReadCheck();
await runRotateCheck();
await runDisableCheck();
await runPublicPortalCheck();
await runValidationCheck();

console.info('QR portal controller smoke check passed.');
