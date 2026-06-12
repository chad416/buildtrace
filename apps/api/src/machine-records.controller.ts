import { Body, Controller, Headers, Post } from '@nestjs/common';
import type { OrganizationRole } from '@buildtrace/db';
import { createMachine, createPrismaClient, MachineStatus } from '@buildtrace/db';

import { resolveAuthenticatedTenantContext } from './authenticated-tenant-context.js';

type MachineStatusValue = (typeof MachineStatus)[keyof typeof MachineStatus];

type CreateMachineRequestBody = {
  readonly organizationId?: unknown;
  readonly customerId?: unknown;
  readonly machineModelId?: unknown;
  readonly machineName?: unknown;
  readonly serialNumber?: unknown;
  readonly deliveryDate?: unknown;
  readonly plcType?: unknown;
  readonly hmiType?: unknown;
  readonly status?: unknown;
};

const machineCreateRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

const db = createPrismaClient();

function readRequiredString(name: string, value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`${name} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function readOptionalString(name: string, value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function readOptionalDate(name: string, value: unknown): Date | undefined {
  const normalizedValue = readOptionalString(name, value);

  if (!normalizedValue) {
    return undefined;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${name} must be a valid date.`);
  }

  return parsedDate;
}

function readOptionalMachineStatus(name: string, value: unknown): MachineStatusValue | undefined {
  const normalizedValue = readOptionalString(name, value);

  if (!normalizedValue) {
    return undefined;
  }

  const allowedStatuses = Object.values(MachineStatus);

  if (!allowedStatuses.includes(normalizedValue as MachineStatusValue)) {
    throw new Error(`${name} must be one of: ${allowedStatuses.join(', ')}.`);
  }

  return normalizedValue as MachineStatusValue;
}

@Controller('machine-records')
export class MachineRecordsController {
  @Post('machines')
  async createMachine(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: CreateMachineRequestBody,
  ) {
    const organizationId = readRequiredString('organizationId', body.organizationId);
    const deliveryDate = readOptionalDate('deliveryDate', body.deliveryDate);
    const plcType = readOptionalString('plcType', body.plcType);
    const hmiType = readOptionalString('hmiType', body.hmiType);
    const status = readOptionalMachineStatus('status', body.status);

    const { currentUser } = await resolveAuthenticatedTenantContext({
      authorizationHeader,
      organizationId,
      db,
      allowedRoles: machineCreateRoles,
    });

    const machine = await createMachine({
      db,
      organizationId,
      customerId: readRequiredString('customerId', body.customerId),
      machineModelId: readRequiredString('machineModelId', body.machineModelId),
      machineName: readRequiredString('machineName', body.machineName),
      serialNumber: readRequiredString('serialNumber', body.serialNumber),
      actorUserId: currentUser.appUserId,
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(plcType ? { plcType } : {}),
      ...(hmiType ? { hmiType } : {}),
      ...(status ? { status } : {}),
    });

    return {
      machine,
    };
  }
}
