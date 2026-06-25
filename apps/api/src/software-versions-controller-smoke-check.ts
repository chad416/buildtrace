import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, SoftwareVersionRecord } from '@buildtrace/db';
import { activityLogActions } from '@buildtrace/shared';

import {
  createSoftwareVersionFromRequest,
  getSoftwareVersionFromRequest,
  listSoftwareVersionsFromRequest,
  markSoftwareVersionAsCurrentFromRequest,
  markSoftwareVersionAsDeliveredFromRequest,
  type SoftwareVersionsEndpointDependencies,
} from './software-versions.controller.js';

const now = new Date('2026-06-25T00:00:00.000Z');

const fakeVersion: SoftwareVersionRecord = {
  id: 'version-1',
  organizationId: 'org-1',
  machineId: 'machine-1',
  versionName: 'PLC v1.2.3',
  softwareType: 'plc',
  notes: 'Stable release',
  isDeliveredVersion: false,
  isCurrentKnownVersion: false,
  storagePath: null,
  checksum: null,
  uploadedByUserId: 'app-user-1',
  uploadedAt: now,
  createdAt: now,
  updatedAt: now,
};

type ResolveInput = Parameters<
  SoftwareVersionsEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];
type CreateVersionInput = Parameters<
  SoftwareVersionsEndpointDependencies['createSoftwareVersion']
>[0];
type ListVersionsInput = Parameters<
  SoftwareVersionsEndpointDependencies['listSoftwareVersions']
>[0];
type GetVersionInput = Parameters<SoftwareVersionsEndpointDependencies['getSoftwareVersion']>[0];
type MarkCurrentInput = Parameters<
  SoftwareVersionsEndpointDependencies['markAsCurrentKnownVersion']
>[0];
type MarkDeliveredInput = Parameters<
  SoftwareVersionsEndpointDependencies['markAsDeliveredVersion']
>[0];
type ActivityInput = Parameters<SoftwareVersionsEndpointDependencies['createActivityLog']>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly createVersionInputs: CreateVersionInput[];
  readonly listVersionsInputs: ListVersionsInput[];
  readonly getVersionInputs: GetVersionInput[];
  readonly markCurrentInputs: MarkCurrentInput[];
  readonly markDeliveredInputs: MarkDeliveredInput[];
  readonly activityInputs: ActivityInput[];
};

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    createVersionInputs: [],
    listVersionsInputs: [],
    getVersionInputs: [],
    markCurrentInputs: [],
    markDeliveredInputs: [],
    activityInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
  options: {
    readonly versionNotFound?: boolean;
  } = {},
): SoftwareVersionsEndpointDependencies {
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
    createSoftwareVersion: async (input) => {
      capturedCalls.createVersionInputs.push(input);
      return {
        ...fakeVersion,
        organizationId: input.organizationId,
        machineId: input.machineId,
        versionName: input.versionName,
        softwareType: input.softwareType,
        notes: input.notes ?? null,
        isDeliveredVersion: input.isDeliveredVersion ?? false,
        isCurrentKnownVersion: input.isCurrentKnownVersion ?? false,
        uploadedByUserId: input.uploadedByUserId ?? null,
      };
    },
    listSoftwareVersions: async (input) => {
      capturedCalls.listVersionsInputs.push(input);
      return [fakeVersion];
    },
    getSoftwareVersion: async (input) => {
      capturedCalls.getVersionInputs.push(input);
      return options.versionNotFound ? null : fakeVersion;
    },
    markAsCurrentKnownVersion: async (input) => {
      capturedCalls.markCurrentInputs.push(input);
      return {
        ...fakeVersion,
        id: input.versionId,
        organizationId: input.organizationId,
        machineId: input.machineId,
        isCurrentKnownVersion: true,
        updatedAt: now,
      };
    },
    markAsDeliveredVersion: async (input) => {
      capturedCalls.markDeliveredInputs.push(input);
      return {
        ...fakeVersion,
        id: input.versionId,
        organizationId: input.organizationId,
        machineId: input.machineId,
        isDeliveredVersion: true,
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

async function runCreateVersionCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const version = await createSoftwareVersionFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    body: {
      organizationId: ' org-1 ',
      versionName: ' PLC v1.2.3 ',
      softwareType: 'plc',
      notes: ' Stable release ',
      isDeliveredVersion: true,
      isCurrentKnownVersion: true,
    },
    dependencies: createDependencies(calls),
  });

  assert(version.id === 'version-1', 'Create version ID was wrong.');
  assert(version.versionName === 'PLC v1.2.3', 'Create version name was wrong.');
  assert(calls.resolveInputs.length === 1, 'Create version auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Create version roles were incorrect.',
  );
  assert(calls.createVersionInputs.length === 1, 'createSoftwareVersion was not called once.');
  assert(
    calls.createVersionInputs[0]?.organizationId === 'org-1',
    'Create version organization was wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.machineId === 'machine-1',
    'Create version machine was wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.softwareType === 'plc',
    'Create version software type was wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.notes === 'Stable release',
    'Create version notes were wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.isDeliveredVersion === true,
    'Create version delivered marker was wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.isCurrentKnownVersion === true,
    'Create version current marker was wrong.',
  );
  assert(
    calls.createVersionInputs[0]?.uploadedByUserId === 'app-user-1',
    'Create version uploader was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Create version activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.softwareVersionUploaded,
    'Create version activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'software_version',
    'Create version activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'version-1',
    'Create version activity target ID was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Create version actor was wrong.');

  const invalidCalls = createCapturedCalls();
  await expectException('invalid softwareType', BadRequestException, () =>
    createSoftwareVersionFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      body: {
        organizationId: 'org-1',
        versionName: 'PLC v1.2.3',
        softwareType: 'firmware',
      },
      dependencies: createDependencies(invalidCalls),
    }),
  );
  assert(invalidCalls.resolveInputs.length === 0, 'Invalid softwareType must not call auth.');
  assert(
    invalidCalls.createVersionInputs.length === 0,
    'Invalid softwareType must not create a version.',
  );
}

async function runListVersionsCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const response = await listSoftwareVersionsFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' org-1 ',
      softwareType: 'plc',
    },
    dependencies: createDependencies(calls),
  });

  assert(response.versions.length === 1, 'List versions count was wrong.');
  assert(response.versions[0]?.id === 'version-1', 'List versions ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'List versions auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'List versions roles were incorrect.',
  );
  assert(calls.listVersionsInputs.length === 1, 'listSoftwareVersions was not called once.');
  assert(
    calls.listVersionsInputs[0]?.organizationId === 'org-1',
    'List versions organization was wrong.',
  );
  assert(
    calls.listVersionsInputs[0]?.machineId === 'machine-1',
    'List versions machine was wrong.',
  );
  assert(
    calls.listVersionsInputs[0]?.softwareType === 'plc',
    'List versions software type filter was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'List versions must not create activity.');
}

async function runGetVersionCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const version = await getSoftwareVersionFromRequest({
    authorizationHeader: 'Bearer token-1',
    versionId: ' version-1 ',
    query: { organizationId: ' org-1 ' },
    dependencies: createDependencies(calls),
  });

  assert(version.id === 'version-1', 'Get version ID was wrong.');
  assert(calls.resolveInputs.length === 1, 'Get version auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER',
    'Get version roles were incorrect.',
  );
  assert(calls.getVersionInputs.length === 1, 'getSoftwareVersion was not called once.');
  assert(
    calls.getVersionInputs[0]?.organizationId === 'org-1',
    'Get version organization was wrong.',
  );
  assert(calls.getVersionInputs[0]?.versionId === 'version-1', 'Get version ID input was wrong.');
  assert(calls.activityInputs.length === 0, 'Get version must not create activity.');

  await expectException('unknown version', NotFoundException, () =>
    getSoftwareVersionFromRequest({
      authorizationHeader: 'Bearer token-1',
      versionId: 'version-404',
      query: { organizationId: 'org-1' },
      dependencies: createDependencies(createCapturedCalls(), { versionNotFound: true }),
    }),
  );
}

async function runMarkCurrentCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const version = await markSoftwareVersionAsCurrentFromRequest({
    authorizationHeader: 'Bearer token-1',
    versionId: ' version-1 ',
    body: {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(version.isCurrentKnownVersion === true, 'Current marker response was wrong.');
  assert(calls.resolveInputs.length === 1, 'Mark current auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Mark current roles were incorrect.',
  );
  assert(calls.markCurrentInputs.length === 1, 'markAsCurrentKnownVersion was not called once.');
  assert(
    calls.markCurrentInputs[0]?.organizationId === 'org-1',
    'Mark current organization was wrong.',
  );
  assert(calls.markCurrentInputs[0]?.machineId === 'machine-1', 'Mark current machine was wrong.');
  assert(
    calls.markCurrentInputs[0]?.versionId === 'version-1',
    'Mark current version ID was wrong.',
  );
  assert(calls.activityInputs.length === 1, 'Mark current activity was not created.');
  assert(
    calls.activityInputs[0]?.action === activityLogActions.softwareVersionCurrentChanged,
    'Mark current activity action was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetType === 'software_version',
    'Mark current activity target type was wrong.',
  );
  assert(
    calls.activityInputs[0]?.targetId === 'version-1',
    'Mark current activity target ID was wrong.',
  );
  assert(calls.activityInputs[0]?.actorUserId === 'app-user-1', 'Mark current actor was wrong.');
}

async function runMarkDeliveredCheck(): Promise<void> {
  const calls = createCapturedCalls();
  const version = await markSoftwareVersionAsDeliveredFromRequest({
    authorizationHeader: 'Bearer token-1',
    versionId: ' version-1 ',
    body: {
      organizationId: ' org-1 ',
      machineId: ' machine-1 ',
    },
    dependencies: createDependencies(calls),
  });

  assert(version.isDeliveredVersion === true, 'Delivered marker response was wrong.');
  assert(calls.resolveInputs.length === 1, 'Mark delivered auth was not called once.');
  assert(
    calls.resolveInputs[0]?.allowedRoles?.join('|') === 'OWNER|ADMIN',
    'Mark delivered roles were incorrect.',
  );
  assert(calls.markDeliveredInputs.length === 1, 'markAsDeliveredVersion was not called once.');
  assert(
    calls.markDeliveredInputs[0]?.organizationId === 'org-1',
    'Mark delivered organization was wrong.',
  );
  assert(
    calls.markDeliveredInputs[0]?.machineId === 'machine-1',
    'Mark delivered machine was wrong.',
  );
  assert(
    calls.markDeliveredInputs[0]?.versionId === 'version-1',
    'Mark delivered version ID was wrong.',
  );
  assert(calls.activityInputs.length === 0, 'Mark delivered must not create activity.');
}

await runCreateVersionCheck();
await runListVersionsCheck();
await runGetVersionCheck();
await runMarkCurrentCheck();
await runMarkDeliveredCheck();

console.info('Software versions controller smoke check passed.');
