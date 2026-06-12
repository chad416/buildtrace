import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { MachineRecord, OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  createMachine as createMachineRecord,
  createPrismaClient,
  getMachineByOrganization,
  listMachinesByOrganization,
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

export type MachineRecordsQuery = {
  readonly organizationId?: unknown;
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

type ListMachinesDependency = (
  input: Parameters<typeof listMachinesByOrganization>[0],
) => Promise<readonly MachineRecord[]>;

type GetMachineDependency = (
  input: Parameters<typeof getMachineByOrganization>[0],
) => Promise<MachineRecord | null>;

export type MachineRecordsEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly createMachine: CreateMachineDependency;
  readonly listMachinesByOrganization: ListMachinesDependency;
  readonly getMachineByOrganization: GetMachineDependency;
};

type CreateMachineFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly body: CreateMachineRequestBody | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type ListMachinesFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type GetMachineFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

export type CreateMachineResponse = {
  readonly machine: MachineRecord;
};

export type ListMachinesResponse = {
  readonly machines: readonly MachineRecord[];
};

export type GetMachineResponse = {
  readonly machine: MachineRecord;
};

const machineCreateRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];
const machineReadRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

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

function createRealDependencies(): MachineRecordsEndpointDependencies {
  return {
    db,
    resolveAuthenticatedTenantContext,
    createMachine: createMachineRecord,
    listMachinesByOrganization,
    getMachineByOrganization,
  };
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

export async function listMachinesFromRequest({
  authorizationHeader,
  query,
  dependencies,
}: ListMachinesFromRequestInput): Promise<ListMachinesResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: machineReadRoles,
  });

  const machines = await dependencies.listMachinesByOrganization({
    db: dependencies.db,
    organizationId,
  });

  return {
    machines,
  };
}

export async function getMachineFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: GetMachineFromRequestInput): Promise<GetMachineResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: machineReadRoles,
  });

  const machine = await dependencies.getMachineByOrganization({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  if (!machine) {
    throw new NotFoundException('Machine was not found in this organization.');
  }

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
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines')
  async listMachines(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<ListMachinesResponse> {
    return listMachinesFromRequest({
      authorizationHeader,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId')
  async getMachine(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<GetMachineResponse> {
    return getMachineFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }
}
