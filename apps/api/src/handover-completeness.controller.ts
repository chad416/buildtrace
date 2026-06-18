import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import type { OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  createPrismaClient,
  getMachineByOrganization,
  listDocumentsByMachine,
} from '@buildtrace/db';
import {
  evaluateCustomerHandoverCompleteness,
  type CustomerHandoverCompleteness,
  type CustomerHandoverDocument,
} from '@buildtrace/shared';

import { resolveAuthenticatedTenantContext } from './authenticated-tenant-context.js';

export type HandoverCompletenessQuery = {
  readonly organizationId?: unknown;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<unknown>;

type GetMachineByOrganizationDependency = (
  input: Parameters<typeof getMachineByOrganization>[0],
) => Promise<unknown | null>;

type ListDocumentsByMachineDependency = (
  input: Parameters<typeof listDocumentsByMachine>[0],
) => Promise<readonly CustomerHandoverDocument[]>;

export type HandoverCompletenessEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly getMachineByOrganization: GetMachineByOrganizationDependency;
  readonly listDocumentsByMachine: ListDocumentsByMachineDependency;
};

type GetHandoverCompletenessFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: HandoverCompletenessQuery | undefined;
  readonly dependencies: HandoverCompletenessEndpointDependencies;
};

const handoverReadRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
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

function createRealDependencies(): HandoverCompletenessEndpointDependencies {
  return {
    db,
    resolveAuthenticatedTenantContext,
    getMachineByOrganization,
    listDocumentsByMachine,
  };
}

export async function getHandoverCompletenessFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: GetHandoverCompletenessFromRequestInput): Promise<CustomerHandoverCompleteness> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: handoverReadRoles,
  });

  const machine = await dependencies.getMachineByOrganization({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  if (!machine) {
    throw new NotFoundException('Machine was not found for this organization.');
  }

  const documents = await dependencies.listDocumentsByMachine({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return evaluateCustomerHandoverCompleteness(documents);
}

@Controller('document-records')
export class HandoverCompletenessController {
  @Get('machines/:machineId/handover-completeness')
  async getHandoverCompleteness(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: HandoverCompletenessQuery | undefined,
  ): Promise<CustomerHandoverCompleteness> {
    return getHandoverCompletenessFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }
}
