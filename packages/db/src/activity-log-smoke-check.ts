import { activityLogActions } from '@buildtrace/shared';

import { createActivityLog } from './activity-log.js';
import type { ActivityLogRecord } from './activity-log.js';
import type { PrismaClient } from './generated/prisma/client';

type ActivityLogCreateData = {
  readonly organizationId: string;
  readonly action: string;
  readonly actorUserId?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
};

type ActivityLogCreateArgs = {
  readonly data: ActivityLogCreateData;
};

function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  return action().then(
    () => {
      throw new Error(`${name} should throw.`);
    },
    () => undefined,
  );
}

function expectObjectDoesNotHaveKey(
  name: string,
  value: Record<string, unknown>,
  key: string,
): void {
  if (key in value) {
    throw new Error(`${name} should not include ${key}.`);
  }
}

function createFakePrismaClient(capturedCreateArgs: ActivityLogCreateArgs[]): PrismaClient {
  return {
    activityLog: {
      create: (args: ActivityLogCreateArgs): ActivityLogRecord => {
        capturedCreateArgs.push(args);

        return {
          id: 'activity-log-1',
          organizationId: args.data.organizationId,
          actorUserId: args.data.actorUserId ?? null,
          action: args.data.action,
          targetType: args.data.targetType ?? null,
          targetId: args.data.targetId ?? null,
          ipAddress: args.data.ipAddress ?? null,
          userAgent: args.data.userAgent ?? null,
          createdAt: new Date('2026-06-10T00:00:00.000Z'),
        };
      },
    },
  } as unknown as PrismaClient;
}

async function runActivityLogSmokeCheck(): Promise<void> {
  await expectThrows('blank organization ID', () =>
    createActivityLog({
      db: createFakePrismaClient([]),
      organizationId: '   ',
      action: activityLogActions.userLogin,
    }),
  );

  const capturedCreateArgs: ActivityLogCreateArgs[] = [];

  await createActivityLog({
    db: createFakePrismaClient(capturedCreateArgs),
    organizationId: ' organization-1 ',
    actorUserId: ' app-user-1 ',
    action: activityLogActions.userLogin,
    targetType: ' session ',
    targetId: ' session-1 ',
    ipAddress: ' 127.0.0.1 ',
    userAgent: ' BuildTrace Smoke ',
  });

  const createData = capturedCreateArgs[0]?.data;

  if (!createData) {
    throw new Error('Activity log create data was not captured.');
  }

  if (
    createData.organizationId !== 'organization-1' ||
    createData.actorUserId !== 'app-user-1' ||
    createData.action !== activityLogActions.userLogin ||
    createData.targetType !== 'session' ||
    createData.targetId !== 'session-1' ||
    createData.ipAddress !== '127.0.0.1' ||
    createData.userAgent !== 'BuildTrace Smoke'
  ) {
    throw new Error('Activity log create data was not normalized.');
  }

  const minimalCreateArgs: ActivityLogCreateArgs[] = [];

  await createActivityLog({
    db: createFakePrismaClient(minimalCreateArgs),
    organizationId: 'organization-1',
    action: activityLogActions.userLogin,
    actorUserId: '   ',
    targetType: '   ',
    targetId: '   ',
    ipAddress: '   ',
    userAgent: '   ',
  });

  const minimalCreateData = minimalCreateArgs[0]?.data;

  if (!minimalCreateData) {
    throw new Error('Minimal activity log create data was not captured.');
  }

  expectObjectDoesNotHaveKey('minimal activity log', minimalCreateData, 'actorUserId');
  expectObjectDoesNotHaveKey('minimal activity log', minimalCreateData, 'targetType');
  expectObjectDoesNotHaveKey('minimal activity log', minimalCreateData, 'targetId');
  expectObjectDoesNotHaveKey('minimal activity log', minimalCreateData, 'ipAddress');
  expectObjectDoesNotHaveKey('minimal activity log', minimalCreateData, 'userAgent');
}

await runActivityLogSmokeCheck();

console.info('Activity log smoke check passed.');
