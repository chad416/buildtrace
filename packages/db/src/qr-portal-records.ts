import { randomBytes } from 'node:crypto';

import { qrTokenByteLength } from '@buildtrace/shared';

import { Prisma, type PrismaClient } from './generated/prisma/client';
import type { MachineStatus } from './generated/prisma/enums';

type MachineStatusValue = (typeof MachineStatus)[keyof typeof MachineStatus];

type QrPortalRecordsDatabase = Pick<PrismaClient, 'machine'>;

type DbInput = {
  readonly db: QrPortalRecordsDatabase;
};

type AssignQrTokenInput = DbInput & {
  readonly organizationId: string;
  readonly machineId: string;
};

type GetQrPortalMachineInput = DbInput & {
  readonly qrToken: string;
};

type GetMachineQrTokenInput = DbInput & {
  readonly organizationId: string;
  readonly machineId: string;
};

export type QrPortalMachineRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly deliveryDate: Date | null;
  readonly plcType: string | null;
  readonly hmiType: string | null;
  readonly status: MachineStatusValue;
  readonly qrToken: string | null;
  readonly qrPinEnabled: boolean;
  readonly qrPinHash: string | null;
  readonly portalDefaultLocale: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

const maxQrTokenAssignmentAttempts = 3;

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function isQrTokenUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as readonly string[]).includes('qr_token')
  );
}

export function generateQrToken(): string {
  return randomBytes(qrTokenByteLength).toString('base64url');
}

export async function assignQrToken({
  db,
  organizationId,
  machineId,
}: AssignQrTokenInput): Promise<{ qrToken: string }> {
  const normalizedOrganizationId = normalizeRequiredText('Organization ID', organizationId);
  const normalizedMachineId = normalizeRequiredText('Machine ID', machineId);

  for (let attempt = 0; attempt < maxQrTokenAssignmentAttempts; attempt += 1) {
    const qrToken = generateQrToken();

    try {
      const result = await db.machine.updateMany({
        where: {
          id: normalizedMachineId,
          organizationId: normalizedOrganizationId,
        },
        data: {
          qrToken,
        },
      });

      if (result.count === 0) {
        throw new Error('Machine not found');
      }

      return { qrToken };
    } catch (error) {
      if (isQrTokenUniqueViolation(error) && attempt < maxQrTokenAssignmentAttempts - 1) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to assign a unique QR token.');
}

export async function getQrPortalMachine({
  db,
  qrToken,
}: GetQrPortalMachineInput): Promise<QrPortalMachineRecord | null> {
  const normalizedQrToken = normalizeRequiredText('QR token', qrToken);

  return db.machine.findFirst({
    where: {
      qrToken: normalizedQrToken,
    },
  });
}

export async function getMachineQrToken({
  db,
  organizationId,
  machineId,
}: GetMachineQrTokenInput): Promise<{ qrToken: string | null }> {
  const normalizedOrganizationId = normalizeRequiredText('Organization ID', organizationId);
  const normalizedMachineId = normalizeRequiredText('Machine ID', machineId);

  const machine = await db.machine.findFirst({
    where: {
      id: normalizedMachineId,
      organizationId: normalizedOrganizationId,
    },
    select: {
      qrToken: true,
    },
  });

  return {
    qrToken: machine?.qrToken ?? null,
  };
}
