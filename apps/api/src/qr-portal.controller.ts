import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
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
import {
  activityLogActions,
  type DocumentCategory,
  type DocumentLanguageCode,
} from '@buildtrace/shared';

import {
  resolveAuthenticatedTenantContext,
  type AuthenticatedTenantContext,
} from './authenticated-tenant-context.js';

import {
  createSignedDocumentDownloadUrl,
  createSupabaseDocumentStorageAdapter,
  readDocumentStorageConfig,
} from './document-storage.js';

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
  readonly readDocumentStorageConfig: typeof readDocumentStorageConfig;
  readonly createDocumentStorageAdapter: typeof createSupabaseDocumentStorageAdapter;
  readonly createSignedDocumentDownloadUrl: typeof createSignedDocumentDownloadUrl;
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
    readDocumentStorageConfig,
    createDocumentStorageAdapter: createSupabaseDocumentStorageAdapter,
    createSignedDocumentDownloadUrl,
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

export type QrPortalDocumentResponse = {
  readonly id: string;
  readonly fileName: string;
  readonly category: DocumentCategory;
  readonly language: DocumentLanguageCode;
  readonly uploadedAt: Date;
};

export type ListQrPortalDocumentsResponse = {
  readonly documents: readonly QrPortalDocumentResponse[];
};

export type QrPortalDocumentDownloadUrlResponse = {
  readonly downloadUrl: string;
  readonly expiresInSeconds: number;
};

type CreateQrPortalDocumentDownloadUrlFromRequestInput = {
  readonly qrToken: string | undefined;
  readonly documentId: string | undefined;
  readonly dependencies: QrPortalEndpointDependencies;
};

const documentCategoryFromPrisma = (value: string): DocumentCategory => {
  const mapping: Record<string, DocumentCategory> = {
    PLC: 'plc',
    HMI: 'hmi',
    MECHANICAL_DRAWINGS: 'mechanical-drawings',
    ELECTRICAL_DRAWINGS: 'electrical-drawings',
    CAD: 'cad',
    MACHINE_PHOTOS: 'machine-photos',
    FAT: 'fat',
    SAT: 'sat',
    MANUALS: 'manuals',
    SAFETY_INSTRUCTIONS: 'safety-instructions',
    SUPPLIER_DOCUMENTS: 'supplier-documents',
    SPARE_PARTS_BOM: 'spare-parts-bom',
    CERTIFICATES: 'certificates',
    SERVICE_NOTES: 'service-notes',
    OTHER: 'other',
  };
  return mapping[value] || 'other';
};

const documentLanguageFromPrisma = (value: string): DocumentLanguageCode => {
  const mapping: Record<string, DocumentLanguageCode> = {
    EN: 'en',
    CS: 'cs',
    SK: 'sk',
    PL: 'pl',
    DE: 'de',
    FR: 'fr',
    ES: 'es',
    UNKNOWN: 'unknown',
  };
  return mapping[value] || 'unknown';
};

export async function getQrPortalDocumentsFromRequest({
  qrToken,
  dependencies,
}: GetQrPortalFromRequestInput): Promise<ListQrPortalDocumentsResponse> {
  const normalizedQrToken = readRequiredString('qrToken', qrToken);

  const machine = await dependencies.getQrPortalMachine({
    db: dependencies.db,
    qrToken: normalizedQrToken,
  });

  if (!machine) {
    throw new NotFoundException('QR portal was not found.');
  }

  // Rate limit consideration: this public endpoint should be rate-limited in production.
  const documents = await dependencies.db.document.findMany({
    where: {
      machineId: machine.id,
      visibilityLevel: 'CUSTOMER_VISIBLE',
      visibleToCustomer: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    select: {
      id: true,
      fileName: true,
      category: true,
      language: true,
      uploadedAt: true,
    },
  });

  return {
    documents: documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      category: documentCategoryFromPrisma(doc.category),
      language: documentLanguageFromPrisma(doc.language),
      uploadedAt: doc.uploadedAt,
    })),
  };
}

export async function createQrPortalDocumentDownloadUrlFromRequest({
  qrToken,
  documentId,
  dependencies,
}: CreateQrPortalDocumentDownloadUrlFromRequestInput): Promise<QrPortalDocumentDownloadUrlResponse> {
  const normalizedQrToken = readRequiredString('qrToken', qrToken);
  const normalizedDocumentId = readRequiredString('documentId', documentId);

  const machine = await dependencies.getQrPortalMachine({
    db: dependencies.db,
    qrToken: normalizedQrToken,
  });

  if (!machine) {
    throw new NotFoundException('QR portal was not found.');
  }

  const document = await dependencies.db.document.findFirst({
    where: {
      id: normalizedDocumentId,
      machineId: machine.id,
      visibilityLevel: 'CUSTOMER_VISIBLE',
      visibleToCustomer: true,
    },
    select: {
      storagePath: true,
    },
  });

  if (!document) {
    throw new NotFoundException('Document was not found or is not accessible.');
  }

  let signedUrlResult;
  try {
    const config = dependencies.readDocumentStorageConfig();
    const storage = dependencies.createDocumentStorageAdapter(config);

    signedUrlResult = await dependencies.createSignedDocumentDownloadUrl({
      config,
      storage,
      organizationId: machine.organizationId,
      machineId: machine.id,
      storagePath: document.storagePath,
    });
  } catch {
    throw new InternalServerErrorException('Document download URL could not be created.');
  }

  await dependencies.createActivityLog({
    db: dependencies.db,
    organizationId: machine.organizationId,
    action: activityLogActions.portalDocumentDownloaded,
    targetType: 'document',
    targetId: normalizedDocumentId,
  });

  return {
    downloadUrl: signedUrlResult.signedUrl,
    expiresInSeconds: signedUrlResult.expiresInSeconds,
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

  @Get('portal/:qrToken/documents')
  async getQrPortalDocuments(
    @Param('qrToken') qrToken: string | undefined,
  ): Promise<ListQrPortalDocumentsResponse> {
    return getQrPortalDocumentsFromRequest({
      qrToken,
      dependencies: createRealDependencies(),
    });
  }

  @Post('portal/:qrToken/documents/:documentId/download-url')
  async createQrPortalDocumentDownloadUrl(
    @Param('qrToken') qrToken: string | undefined,
    @Param('documentId') documentId: string | undefined,
  ): Promise<QrPortalDocumentDownloadUrlResponse> {
    return createQrPortalDocumentDownloadUrlFromRequest({
      qrToken,
      documentId,
      dependencies: createRealDependencies(),
    });
  }
}
