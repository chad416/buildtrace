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
import type {
  CustomerRecord,
  MachineModelRecord,
  MachineRecord,
  OrganizationRole,
  PrismaClient,
} from '@buildtrace/db';
import {
  createCustomer as createCustomerRecord,
  createMachine as createMachineRecord,
  createMachineModel as createMachineModelRecord,
  createPrismaClient,
  getCustomerByOrganization,
  getMachineByOrganization,
  getMachineModelByOrganization,
  listCustomersByOrganization,
  listMachineModelsByOrganization,
  listMachinesByOrganization,
  MachineStatus,
} from '@buildtrace/db';
import { supportedLocales, type SupportedLocale } from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

type MachineStatusValue = (typeof MachineStatus)[keyof typeof MachineStatus];

export type CreateCustomerRequestBody = {
  readonly organizationId?: unknown;
  readonly companyName?: unknown;
  readonly contactName?: unknown;
  readonly email?: unknown;
  readonly phone?: unknown;
  readonly country?: unknown;
  readonly preferredLocale?: unknown;
};

export type CreateMachineModelRequestBody = {
  readonly organizationId?: unknown;
  readonly modelName?: unknown;
  readonly description?: unknown;
};

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

type CreateCustomerDependency = (
  input: Parameters<typeof createCustomerRecord>[0],
) => Promise<CustomerRecord>;

type ListCustomersDependency = (
  input: Parameters<typeof listCustomersByOrganization>[0],
) => Promise<readonly CustomerRecord[]>;

type GetCustomerDependency = (
  input: Parameters<typeof getCustomerByOrganization>[0],
) => Promise<CustomerRecord | null>;

type CreateMachineModelDependency = (
  input: Parameters<typeof createMachineModelRecord>[0],
) => Promise<MachineModelRecord>;

type ListMachineModelsDependency = (
  input: Parameters<typeof listMachineModelsByOrganization>[0],
) => Promise<readonly MachineModelRecord[]>;

type GetMachineModelDependency = (
  input: Parameters<typeof getMachineModelByOrganization>[0],
) => Promise<MachineModelRecord | null>;

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
  readonly createCustomer: CreateCustomerDependency;
  readonly listCustomersByOrganization: ListCustomersDependency;
  readonly getCustomerByOrganization: GetCustomerDependency;
  readonly createMachineModel: CreateMachineModelDependency;
  readonly listMachineModelsByOrganization: ListMachineModelsDependency;
  readonly getMachineModelByOrganization: GetMachineModelDependency;
  readonly createMachine: CreateMachineDependency;
  readonly listMachinesByOrganization: ListMachinesDependency;
  readonly getMachineByOrganization: GetMachineDependency;
};

type CreateCustomerFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly body: CreateCustomerRequestBody | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type ListCustomersFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type GetCustomerFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly customerId: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type CreateMachineModelFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly body: CreateMachineModelRequestBody | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type ListMachineModelsFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
};

type GetMachineModelFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineModelId: string | undefined;
  readonly query: MachineRecordsQuery | undefined;
  readonly dependencies: MachineRecordsEndpointDependencies;
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

export type CreateCustomerResponse = {
  readonly customer: CustomerRecord;
};

export type ListCustomersResponse = {
  readonly customers: readonly CustomerRecord[];
};

export type GetCustomerResponse = {
  readonly customer: CustomerRecord;
};

export type CreateMachineModelResponse = {
  readonly machineModel: MachineModelRecord;
};

export type ListMachineModelsResponse = {
  readonly machineModels: readonly MachineModelRecord[];
};

export type GetMachineModelResponse = {
  readonly machineModel: MachineModelRecord;
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

const recordCreateRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];
const recordReadRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

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

function readOptionalSupportedLocale(name: string, value: unknown): SupportedLocale | undefined {
  const normalizedValue = readOptionalString(name, value);

  if (!normalizedValue) {
    return undefined;
  }

  if (!supportedLocales.includes(normalizedValue as SupportedLocale)) {
    throw new BadRequestException(`${name} must be one of: ${supportedLocales.join(', ')}.`);
  }

  return normalizedValue as SupportedLocale;
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
    createCustomer: createCustomerRecord,
    listCustomersByOrganization,
    getCustomerByOrganization,
    createMachineModel: createMachineModelRecord,
    listMachineModelsByOrganization,
    getMachineModelByOrganization,
    createMachine: createMachineRecord,
    listMachinesByOrganization,
    getMachineByOrganization,
  };
}

export async function createCustomerFromRequest({
  authorizationHeader,
  body,
  dependencies,
}: CreateCustomerFromRequestInput): Promise<CreateCustomerResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const contactName = readOptionalString('contactName', requestBody.contactName);
  const email = readOptionalString('email', requestBody.email);
  const phone = readOptionalString('phone', requestBody.phone);
  const country = readOptionalString('country', requestBody.country);
  const preferredLocale = readOptionalSupportedLocale(
    'preferredLocale',
    requestBody.preferredLocale,
  );

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordCreateRoles,
  });

  const customer = await dependencies.createCustomer({
    db: dependencies.db,
    organizationId,
    companyName: readRequiredString('companyName', requestBody.companyName),
    actorUserId: currentUser.appUserId,
    ...(contactName ? { contactName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(country ? { country } : {}),
    ...(preferredLocale ? { preferredLocale } : {}),
  });

  return {
    customer,
  };
}

export async function listCustomersFromRequest({
  authorizationHeader,
  query,
  dependencies,
}: ListCustomersFromRequestInput): Promise<ListCustomersResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordReadRoles,
  });

  const customers = await dependencies.listCustomersByOrganization({
    db: dependencies.db,
    organizationId,
  });

  return {
    customers,
  };
}

export async function getCustomerFromRequest({
  authorizationHeader,
  customerId,
  query,
  dependencies,
}: GetCustomerFromRequestInput): Promise<GetCustomerResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedCustomerId = readRequiredString('customerId', customerId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordReadRoles,
  });

  const customer = await dependencies.getCustomerByOrganization({
    db: dependencies.db,
    organizationId,
    customerId: normalizedCustomerId,
  });

  if (!customer) {
    throw new NotFoundException('Customer was not found in this organization.');
  }

  return {
    customer,
  };
}

export async function createMachineModelFromRequest({
  authorizationHeader,
  body,
  dependencies,
}: CreateMachineModelFromRequestInput): Promise<CreateMachineModelResponse> {
  const requestBody = body ?? {};
  const organizationId = readRequiredString('organizationId', requestBody.organizationId);
  const description = readOptionalString('description', requestBody.description);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordCreateRoles,
  });

  const machineModel = await dependencies.createMachineModel({
    db: dependencies.db,
    organizationId,
    modelName: readRequiredString('modelName', requestBody.modelName),
    actorUserId: currentUser.appUserId,
    ...(description ? { description } : {}),
  });

  return {
    machineModel,
  };
}

export async function listMachineModelsFromRequest({
  authorizationHeader,
  query,
  dependencies,
}: ListMachineModelsFromRequestInput): Promise<ListMachineModelsResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordReadRoles,
  });

  const machineModels = await dependencies.listMachineModelsByOrganization({
    db: dependencies.db,
    organizationId,
  });

  return {
    machineModels,
  };
}

export async function getMachineModelFromRequest({
  authorizationHeader,
  machineModelId,
  query,
  dependencies,
}: GetMachineModelFromRequestInput): Promise<GetMachineModelResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineModelId = readRequiredString('machineModelId', machineModelId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: recordReadRoles,
  });

  const machineModel = await dependencies.getMachineModelByOrganization({
    db: dependencies.db,
    organizationId,
    machineModelId: normalizedMachineModelId,
  });

  if (!machineModel) {
    throw new NotFoundException('Machine model was not found in this organization.');
  }

  return {
    machineModel,
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
    allowedRoles: recordCreateRoles,
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
    allowedRoles: recordReadRoles,
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
    allowedRoles: recordReadRoles,
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
  @Post('customers')
  async createCustomer(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: CreateCustomerRequestBody | undefined,
  ): Promise<CreateCustomerResponse> {
    return createCustomerFromRequest({
      authorizationHeader,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('customers')
  async listCustomers(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<ListCustomersResponse> {
    return listCustomersFromRequest({
      authorizationHeader,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('customers/:customerId')
  async getCustomer(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('customerId') customerId: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<GetCustomerResponse> {
    return getCustomerFromRequest({
      authorizationHeader,
      customerId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machine-models')
  async createMachineModel(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: CreateMachineModelRequestBody | undefined,
  ): Promise<CreateMachineModelResponse> {
    return createMachineModelFromRequest({
      authorizationHeader,
      body,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machine-models')
  async listMachineModels(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<ListMachineModelsResponse> {
    return listMachineModelsFromRequest({
      authorizationHeader,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machine-models/:machineModelId')
  async getMachineModel(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineModelId') machineModelId: string | undefined,
    @Query() query: MachineRecordsQuery | undefined,
  ): Promise<GetMachineModelResponse> {
    return getMachineModelFromRequest({
      authorizationHeader,
      machineModelId,
      query,
      dependencies: createRealDependencies(),
    });
  }

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
