import type { ActivityLogAction } from '@buildtrace/shared';

import type { PrismaClient } from './generated/prisma/client';

type ActivityLogWriteClient = Pick<PrismaClient, 'activityLog'>;

type CreateActivityLogInput = {
  readonly db: ActivityLogWriteClient;
  readonly organizationId: string;
  readonly action: ActivityLogAction;
  readonly actorUserId?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
};

export type ActivityLogRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly actorUserId: string | null;
  readonly action: string;
  readonly targetType: string | null;
  readonly targetId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
};

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

export async function createActivityLog({
  db,
  organizationId,
  action,
  actorUserId,
  targetType,
  targetId,
  ipAddress,
  userAgent,
}: CreateActivityLogInput): Promise<ActivityLogRecord> {
  const normalizedOrganizationId = organizationId.trim();
  const normalizedAction = action.trim() as ActivityLogAction;
  const normalizedActorUserId = normalizeOptionalText(actorUserId);
  const normalizedTargetType = normalizeOptionalText(targetType);
  const normalizedTargetId = normalizeOptionalText(targetId);
  const normalizedIpAddress = normalizeOptionalText(ipAddress);
  const normalizedUserAgent = normalizeOptionalText(userAgent);

  if (!normalizedOrganizationId) {
    throw new Error('Activity log organization ID is required.');
  }

  if (!normalizedAction) {
    throw new Error('Activity log action is required.');
  }

  return db.activityLog.create({
    data: {
      organizationId: normalizedOrganizationId,
      action: normalizedAction,
      ...(normalizedActorUserId ? { actorUserId: normalizedActorUserId } : {}),
      ...(normalizedTargetType ? { targetType: normalizedTargetType } : {}),
      ...(normalizedTargetId ? { targetId: normalizedTargetId } : {}),
      ...(normalizedIpAddress ? { ipAddress: normalizedIpAddress } : {}),
      ...(normalizedUserAgent ? { userAgent: normalizedUserAgent } : {}),
    },
  });
}
