import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { OrganizationRole, PrismaClient } from '@buildtrace/db';
import {
  assignQrToken,
  createActivityLog,
  createPrismaClient,
  getMachineQrToken,
  getQrPortalMachine,
} from '@buildtrace/db';
import { activityLogActions } from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

export type QrPortalQuery = {
  readonly organizationId?: unknown;
};

type ResolveAuthenticatedTenantContextDependency = (input: {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
}) => Promise<AuthenticatedTenantContext>;

export type QrPortalEndpointDependencies = {
  readonly db: PrismaClient;
  readonly resolveAuthenticatedTenantContext: ResolveAuthenticatedTenantContextDependency;
  readonly assignQrToken: typeof assignQrToken;
  readonly getMachineQrToken: typeof getMachineQrToken;
  readonly getQrPortalMachine: typeof getQrPortalMachine;
  readonly createActivityLog: typeof createActivityLog;
};

type AuthenticatedMachineQrRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly machineId: string | undefined;
  readonly query: QrPortalQuery | undefined;
  readonly dependencies: QrPortalEndpointDependencies;
};

type GetQrPortalFromRequestInput = {
  readonly qrToken: string | undefined;
  readonly dependencies: QrPortalEndpointDependencies;
};

export type MachineQrTokenResponse = {
  readonly machineId: string;
  readonly qrToken: string;
};

export type GetMachineQrTokenResponse = {
  readonly machineId: string;
  readonly qrToken: string | null;
};

export type DisableMachineQrPortalResponse = {
  readonly machineId: string;
  readonly disabled: true;
};

export type QrPortalMachineResponse = {
  readonly machineId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly portalDefaultLocale: string;
};

const qrTokenReadWriteRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
const qrTokenAdminRoles: readonly OrganizationRole[] = ['OWNER', 'ADMIN'];

let db: PrismaClient | undefined;

function getDatabase(): PrismaClient {
  db ??= createPrismaClient();

  return db;
}

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

function createRealDependencies(): QrPortalEndpointDependencies {
  return {
    db: getDatabase(),
    resolveAuthenticatedTenantContext,
    assignQrToken,
    getMachineQrToken,
    getQrPortalMachine,
    createActivityLog,
  };
}

async function assignMachineQrToken(
  input: AuthenticatedMachineQrRequestInput,
  action:
    | typeof activityLogActions.machineQrTokenAssigned
    | typeof activityLogActions.machineQrTokenRotated,
  allowedRoles: readonly OrganizationRole[],
): Promise<MachineQrTokenResponse> {
  const organizationId = readRequiredString('organizationId', input.query?.organizationId);
  const machineId = readRequiredString('machineId', input.machineId);

  const { currentUser } = await input.dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader: input.authorizationHeader,
    organizationId,
    db: input.dependencies.db,
    allowedRoles,
  });

  const { qrToken } = await input.dependencies.assignQrToken({
    db: input.dependencies.db,
    organizationId,
    machineId,
  });

  await input.dependencies.createActivityLog({
    db: input.dependencies.db,
    organizationId,
    action,
    actorUserId: currentUser.appUserId,
    targetType: 'machine',
    targetId: machineId,
  });

  return {
    machineId,
    qrToken,
  };
}

export async function assignMachineQrTokenFromRequest(
  input: AuthenticatedMachineQrRequestInput,
): Promise<MachineQrTokenResponse> {
  return assignMachineQrToken(
    input,
    activityLogActions.machineQrTokenAssigned,
    qrTokenReadWriteRoles,
  );
}

export async function getMachineQrTokenFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: AuthenticatedMachineQrRequestInput): Promise<GetMachineQrTokenResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: qrTokenReadWriteRoles,
  });

  const { qrToken } = await dependencies.getMachineQrToken({
    db: dependencies.db,
    organizationId,
    machineId: normalizedMachineId,
  });

  return {
    machineId: normalizedMachineId,
    qrToken,
  };
}

export async function rotateMachineQrTokenFromRequest(
  input: AuthenticatedMachineQrRequestInput,
): Promise<MachineQrTokenResponse> {
  return assignMachineQrToken(input, activityLogActions.machineQrTokenRotated, qrTokenAdminRoles);
}

export async function disableMachineQrPortalFromRequest({
  authorizationHeader,
  machineId,
  query,
  dependencies,
}: AuthenticatedMachineQrRequestInput): Promise<DisableMachineQrPortalResponse> {
  const organizationId = readRequiredString('organizationId', query?.organizationId);
  const normalizedMachineId = readRequiredString('machineId', machineId);

  const { currentUser } = await dependencies.resolveAuthenticatedTenantContext({
    authorizationHeader,
    organizationId,
    db: dependencies.db,
    allowedRoles: qrTokenAdminRoles,
  });

  const result = await dependencies.db.machine.updateMany({
    where: {
      id: normalizedMachineId,
      organizationId,
    },
    data: {
      qrToken: null,
    },
  });

  if (result.count === 0) {
    throw new NotFoundException('Machine was not found in this organization.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId,
    action: activityLogActions.machineQrPortalDisabled,
    actorUserId: currentUser.appUserId,
    targetType: 'machine',
    targetId: normalizedMachineId,
  });

  return {
    machineId: normalizedMachineId,
    disabled: true,
  };
}

export async function getQrPortalFromRequest({
  qrToken,
  dependencies,
}: GetQrPortalFromRequestInput): Promise<QrPortalMachineResponse> {
  const normalizedQrToken = readRequiredString('qrToken', qrToken);

  const machine = await dependencies.getQrPortalMachine({
    db: dependencies.db,
    qrToken: normalizedQrToken,
  });

  if (!machine) {
    throw new NotFoundException('QR portal was not found.');
  }

  return {
    machineId: machine.id,
    machineName: machine.machineName,
    serialNumber: machine.serialNumber,
    portalDefaultLocale: machine.portalDefaultLocale,
  };
}

@Controller('qr-portal')
export class QrPortalController {
  @Post('machines/:machineId/qr-token')
  async assignQrToken(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: QrPortalQuery | undefined,
  ): Promise<MachineQrTokenResponse> {
    return assignMachineQrTokenFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('machines/:machineId/qr-token')
  async getMachineQrToken(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: QrPortalQuery | undefined,
  ): Promise<GetMachineQrTokenResponse> {
    return getMachineQrTokenFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/qr-token/rotate')
  async rotateQrToken(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: QrPortalQuery | undefined,
  ): Promise<MachineQrTokenResponse> {
    return rotateMachineQrTokenFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Post('machines/:machineId/qr-token/disable')
  async disableQrPortal(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Param('machineId') machineId: string | undefined,
    @Query() query: QrPortalQuery | undefined,
  ): Promise<DisableMachineQrPortalResponse> {
    return disableMachineQrPortalFromRequest({
      authorizationHeader,
      machineId,
      query,
      dependencies: createRealDependencies(),
    });
  }

  @Get('portal/:qrToken')
  async getQrPortal(
    @Param('qrToken') qrToken: string | undefined,
  ): Promise<QrPortalMachineResponse> {
    return getQrPortalFromRequest({
      qrToken,
      dependencies: createRealDependencies(),
    });
  }
}
