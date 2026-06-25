import type { SoftwareType } from '@buildtrace/shared';
import type { PrismaClient } from './generated/prisma/client';

export type SoftwareVersionRecordsDatabase = Pick<PrismaClient, 'softwareVersion'>;

export type SoftwareVersionRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionName: string;
  readonly softwareType: string;
  readonly notes: string | null;
  readonly isDeliveredVersion: boolean;
  readonly isCurrentKnownVersion: boolean;
  readonly storagePath: string | null;
  readonly checksum: string | null;
  readonly uploadedByUserId: string | null;
  readonly uploadedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateSoftwareVersionInput = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionName: string;
  readonly softwareType: SoftwareType;
  readonly notes?: string | null;
  readonly isDeliveredVersion?: boolean;
  readonly isCurrentKnownVersion?: boolean;
  readonly storagePath?: string | null;
  readonly checksum?: string | null;
  readonly uploadedByUserId?: string | null;
};

export type ListSoftwareVersionsInput = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly softwareType?: SoftwareType;
};

export type GetSoftwareVersionInput = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly organizationId: string;
  readonly versionId: string;
};

export type MarkAsCurrentKnownVersionInput = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionId: string;
};

export type MarkAsDeliveredVersionInput = {
  readonly db: SoftwareVersionRecordsDatabase;
  readonly organizationId: string;
  readonly machineId: string;
  readonly versionId: string;
};

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function toSoftwareVersionRecord(version: {
  id: string;
  organizationId: string;
  machineId: string;
  versionName: string;
  softwareType: string;
  notes: string | null;
  isDeliveredVersion: boolean;
  isCurrentKnownVersion: boolean;
  storagePath: string | null;
  checksum: string | null;
  uploadedByUserId: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): SoftwareVersionRecord {
  return {
    id: version.id,
    organizationId: version.organizationId,
    machineId: version.machineId,
    versionName: version.versionName,
    softwareType: version.softwareType,
    notes: version.notes,
    isDeliveredVersion: version.isDeliveredVersion,
    isCurrentKnownVersion: version.isCurrentKnownVersion,
    storagePath: version.storagePath,
    checksum: version.checksum,
    uploadedByUserId: version.uploadedByUserId,
    uploadedAt: version.uploadedAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

export async function createSoftwareVersion({
  db,
  organizationId,
  machineId,
  versionName,
  softwareType,
  notes,
  isDeliveredVersion = false,
  isCurrentKnownVersion = false,
  storagePath,
  checksum,
  uploadedByUserId,
}: CreateSoftwareVersionInput): Promise<SoftwareVersionRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedVersionName = requireNonEmptyText(versionName, 'Version Name');

  const version = await db.softwareVersion.create({
    data: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
      versionName: normalizedVersionName,
      softwareType,
      notes: notes?.trim() || null,
      isDeliveredVersion,
      isCurrentKnownVersion,
      storagePath: storagePath?.trim() || null,
      checksum: checksum?.trim() || null,
      uploadedByUserId: uploadedByUserId?.trim() || null,
    },
  });

  return toSoftwareVersionRecord(version);
}

export async function listSoftwareVersions({
  db,
  organizationId,
  machineId,
  softwareType,
}: ListSoftwareVersionsInput): Promise<readonly SoftwareVersionRecord[]> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');

  const versions = await db.softwareVersion.findMany({
    where: {
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
      ...(softwareType ? { softwareType } : {}),
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    take: 50,
  });

  return versions.map(toSoftwareVersionRecord);
}

export async function getSoftwareVersion({
  db,
  organizationId,
  versionId,
}: GetSoftwareVersionInput): Promise<SoftwareVersionRecord | null> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedVersionId = requireNonEmptyText(versionId, 'Version ID');

  const version = await db.softwareVersion.findFirst({
    where: {
      id: normalizedVersionId,
      organizationId: normalizedOrgId,
    },
  });

  return version ? toSoftwareVersionRecord(version) : null;
}

export async function markAsCurrentKnownVersion({
  db,
  organizationId,
  machineId,
  versionId,
}: MarkAsCurrentKnownVersionInput): Promise<SoftwareVersionRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedVersionId = requireNonEmptyText(versionId, 'Version ID');

  const version = await db.softwareVersion.findFirst({
    where: {
      id: normalizedVersionId,
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
    },
  });

  if (!version) {
    throw new Error(
      `Software version with ID ${normalizedVersionId} not found in this organization.`,
    );
  }

  const updated = await db.softwareVersion.update({
    where: {
      id: normalizedVersionId,
    },
    data: {
      isCurrentKnownVersion: true,
      updatedAt: new Date(),
    },
  });

  return toSoftwareVersionRecord(updated);
}

export async function markAsDeliveredVersion({
  db,
  organizationId,
  machineId,
  versionId,
}: MarkAsDeliveredVersionInput): Promise<SoftwareVersionRecord> {
  const normalizedOrgId = requireNonEmptyText(organizationId, 'Organization ID');
  const normalizedMachineId = requireNonEmptyText(machineId, 'Machine ID');
  const normalizedVersionId = requireNonEmptyText(versionId, 'Version ID');

  const version = await db.softwareVersion.findFirst({
    where: {
      id: normalizedVersionId,
      organizationId: normalizedOrgId,
      machineId: normalizedMachineId,
    },
  });

  if (!version) {
    throw new Error(
      `Software version with ID ${normalizedVersionId} not found in this organization.`,
    );
  }

  const updated = await db.softwareVersion.update({
    where: {
      id: normalizedVersionId,
    },
    data: {
      isDeliveredVersion: true,
      updatedAt: new Date(),
    },
  });

  return toSoftwareVersionRecord(updated);
}
