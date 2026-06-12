import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import type { MachineRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  createMachine as createMachineRecord,
  createPrismaClient,
  MachineStatus,
} from '@buildtrace/db';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

type MachineStatusValue = (typeof MachineStatus)[keyof typeof MachineStatus];

export type CreateMachineRequestBody = {
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

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

type CreateMachineDependency = (
  input: Parameters<typeof createMachineRecord>[0],
) => Promise<MachineRecord>;

export type CreateMachineEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createMachine: CreateMachineDependency;
};

type CreateMachineFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly body: CreateMachineRequestBody | undefined;
  readonly dependencies: CreateMachineEndpointDependencies;
};

export type CreateMachineResponse = {
  readonly machine: MachineRecord;
};

const machineCreateRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

const db = createPrismaClient();

function readRequiredString(name: string, value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${name} is required.`);
  }

  return normalizedValue;
}

function readOptionalString(name: string, value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string.`);
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
    throw new BadRequestException(`${name} must be a valid date.`);
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
    throw new BadRequestException(`${name} must be one of: ${allowedStatuses.join(', ')}.`);
  }

  return normalizedValue as MachineStatusValue;
}

export async function createMachineFromRequest({
  authorizationHeader,
  body,
  dependencies,
}: CreateMachineFromRequestInput): Promise<CreateMachineResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const deliveryDate = readOptionalDate('deliveryDate', requestBody.deliveryDate);
  const plcType = readOptionalString('plcType', requestBody.plcType);
  const hmiType = readOptionalString('hmiType', requestBody.hmiType);
  const status = readOptionalMachineStatus('status', requestBody.status);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: machineCreateRoles,
  });

  const machine = await dependencies.createMachine({
    db: dependencies.db,
    organizationId,
    customerId: readRequiredString('customerId', requestBody.customerId),
    machineModelId: readRequiredString('machineModelId', requestBody.machineModelId),
    machineName: readRequiredString('machineName', requestBody.machineName),
    serialNumber: readRequiredString('serialNumber', requestBody.serialNumber),
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

@Controller('machine-records')
export class MachineRecordsController {
  @Post('machines')
  async createMachine(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: CreateMachineRequestBody | undefined,
  ): Promise<CreateMachineResponse> {
    return createMachineFromRequest({
      authorizationHeader,
      body,
      dependencies: {
        db,
        resolveAuthenticatedTenantContext,
        createMachine: createMachineRecord,
      },
    });
  }
}
