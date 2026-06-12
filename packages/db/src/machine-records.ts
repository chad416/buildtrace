import { activityLogActions } from '@buildtrace/shared';

import { createActivityLog } from './activity-log.js';
import type { PrismaClient } from './generated/prisma/client';
import { MachineStatus } from './generated/prisma/enums';

type MachineStatusValue = (typeof MachineStatus)[keyof typeof MachineStatus];

type CustomerReadClient = Pick<PrismaClient, 'customer'>;
type MachineModelReadClient = Pick<PrismaClient, 'machineModel'>;
type MachineReadClient = Pick<PrismaClient, 'machine'>;

type DbInput = {
  readonly db: PrismaClient;
};

type OrganizationScopedInput = DbInput & {
  readonly organizationId: string;
};

type CreateCustomerInput = OrganizationScopedInput & {
  readonly companyName: string;
  readonly actorUserId?: string;
  readonly contactName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly country?: string;
  readonly preferredLocale?: string;
};

type GetCustomerByOrganizationInput = OrganizationScopedInput & {
  readonly customerId: string;
};

type CreateMachineModelInput = OrganizationScopedInput & {
  readonly modelName: string;
  readonly actorUserId?: string;
  readonly description?: string;
};

type GetMachineModelByOrganizationInput = OrganizationScopedInput & {
  readonly machineModelId: string;
};

type CreateMachineInput = OrganizationScopedInput & {
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly actorUserId?: string;
  readonly deliveryDate?: Date;
  readonly plcType?: string;
  readonly hmiType?: string;
  readonly status?: MachineStatusValue;
};

type UpdateMachineInput = OrganizationScopedInput & {
  readonly machineId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly actorUserId?: string;
  readonly deliveryDate?: Date;
  readonly plcType?: string;
  readonly hmiType?: string;
  readonly status?: MachineStatusValue;
};

type GetMachineByOrganizationInput = OrganizationScopedInput & {
  readonly machineId: string;
};

export type CustomerRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly companyName: string;
  readonly contactName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly country: string | null;
  readonly preferredLocale: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type MachineModelRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly modelName: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type MachineRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly machineModelId: string;
  readonly machineName: string;
  readonly serialNumber: string;
  readonly status: MachineStatusValue;
  readonly deliveryDate: Date | null;
  readonly plcType: string | null;
  readonly hmiType: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly customer: {
    readonly id: string;
    readonly companyName: string;
  };
  readonly machineModel: {
    readonly id: string;
    readonly modelName: string;
  };
};

function normalizeRequiredText(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function normalizeOrganizationId(organizationId: string): string {
  return normalizeRequiredText('Organization ID', organizationId);
}

async function assertCustomerBelongsToOrganization(
  db: CustomerReadClient,
  organizationId: string,
  customerId: string,
): Promise<void> {
  const customer = await db.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw new Error('Customer does not belong to this organization.');
  }
}

async function assertMachineModelBelongsToOrganization(
  db: MachineModelReadClient,
  organizationId: string,
  machineModelId: string,
): Promise<void> {
  const machineModel = await db.machineModel.findFirst({
    where: {
      id: machineModelId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!machineModel) {
    throw new Error('Machine model does not belong to this organization.');
  }
}

async function assertMachineBelongsToOrganization(
  db: MachineReadClient,
  organizationId: string,
  machineId: string,
): Promise<void> {
  const machine = await db.machine.findFirst({
    where: {
      id: machineId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!machine) {
    throw new Error('Machine does not belong to this organization.');
  }
}

export async function createCustomer({
  db,
  organizationId,
  companyName,
  actorUserId,
  contactName,
  email,
  phone,
  country,
  preferredLocale,
}: CreateCustomerInput): Promise<CustomerRecord> {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  const normalizedCompanyName = normalizeRequiredText('Customer company name', companyName);
  const normalizedActorUserId = normalizeOptionalText(actorUserId);
  const normalizedContactName = normalizeOptionalText(contactName);
  const normalizedEmail = normalizeOptionalText(email);
  const normalizedPhone = normalizeOptionalText(phone);
  const normalizedCountry = normalizeOptionalText(country);
  const normalizedPreferredLocale = normalizeOptionalText(preferredLocale);

  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        organizationId: normalizedOrganizationId,
        companyName: normalizedCompanyName,
        contactName: normalizedContactName ?? null,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        country: normalizedCountry ?? null,
        preferredLocale: normalizedPreferredLocale ?? 'en',
      },
    });

    await createActivityLog({
      db: tx,
      organizationId: normalizedOrganizationId,
      action: activityLogActions.customerCreated,
      ...(normalizedActorUserId ? { actorUserId: normalizedActorUserId } : {}),
      targetType: 'customer',
      targetId: customer.id,
    });

    return customer;
  });
}

export async function listCustomersByOrganization({
  db,
  organizationId,
}: OrganizationScopedInput): Promise<readonly CustomerRecord[]> {
  return db.customer.findMany({
    where: {
      organizationId: normalizeOrganizationId(organizationId),
    },
    orderBy: {
      companyName: 'asc',
    },
  });
}

export async function getCustomerByOrganization({
  db,
  organizationId,
  customerId,
}: GetCustomerByOrganizationInput): Promise<CustomerRecord | null> {
  return db.customer.findFirst({
    where: {
      id: normalizeRequiredText('Customer ID', customerId),
      organizationId: normalizeOrganizationId(organizationId),
    },
  });
}

export async function createMachineModel({
  db,
  organizationId,
  modelName,
  actorUserId,
  description,
}: CreateMachineModelInput): Promise<MachineModelRecord> {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  const normalizedModelName = normalizeRequiredText('Machine model name', modelName);
  const normalizedActorUserId = normalizeOptionalText(actorUserId);
  const normalizedDescription = normalizeOptionalText(description);

  return db.$transaction(async (tx) => {
    const machineModel = await tx.machineModel.create({
      data: {
        organizationId: normalizedOrganizationId,
        modelName: normalizedModelName,
        description: normalizedDescription ?? null,
      },
    });

    await createActivityLog({
      db: tx,
      organizationId: normalizedOrganizationId,
      action: activityLogActions.machineModelCreated,
      ...(normalizedActorUserId ? { actorUserId: normalizedActorUserId } : {}),
      targetType: 'machine_model',
      targetId: machineModel.id,
    });

    return machineModel;
  });
}

export async function listMachineModelsByOrganization({
  db,
  organizationId,
}: OrganizationScopedInput): Promise<readonly MachineModelRecord[]> {
  return db.machineModel.findMany({
    where: {
      organizationId: normalizeOrganizationId(organizationId),
    },
    orderBy: {
      modelName: 'asc',
    },
  });
}

export async function getMachineModelByOrganization({
  db,
  organizationId,
  machineModelId,
}: GetMachineModelByOrganizationInput): Promise<MachineModelRecord | null> {
  return db.machineModel.findFirst({
    where: {
      id: normalizeRequiredText('Machine model ID', machineModelId),
      organizationId: normalizeOrganizationId(organizationId),
    },
  });
}

export async function createMachine({
  db,
  organizationId,
  customerId,
  machineModelId,
  machineName,
  serialNumber,
  actorUserId,
  deliveryDate,
  plcType,
  hmiType,
  status,
}: CreateMachineInput): Promise<MachineRecord> {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  const normalizedCustomerId = normalizeRequiredText('Customer ID', customerId);
  const normalizedMachineModelId = normalizeRequiredText('Machine model ID', machineModelId);
  const normalizedMachineName = normalizeRequiredText('Machine name', machineName);
  const normalizedSerialNumber = normalizeRequiredText('Machine serial number', serialNumber);
  const normalizedActorUserId = normalizeOptionalText(actorUserId);
  const normalizedPlcType = normalizeOptionalText(plcType);
  const normalizedHmiType = normalizeOptionalText(hmiType);

  return db.$transaction(async (tx) => {
    await assertCustomerBelongsToOrganization(tx, normalizedOrganizationId, normalizedCustomerId);
    await assertMachineModelBelongsToOrganization(
      tx,
      normalizedOrganizationId,
      normalizedMachineModelId,
    );

    const machine = await tx.machine.create({
      data: {
        organizationId: normalizedOrganizationId,
        customerId: normalizedCustomerId,
        machineModelId: normalizedMachineModelId,
        machineName: normalizedMachineName,
        serialNumber: normalizedSerialNumber,
        status: status ?? MachineStatus.ACTIVE,
        deliveryDate: deliveryDate ?? null,
        plcType: normalizedPlcType ?? null,
        hmiType: normalizedHmiType ?? null,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        machineModel: {
          select: {
            id: true,
            modelName: true,
          },
        },
      },
    });

    await createActivityLog({
      db: tx,
      organizationId: normalizedOrganizationId,
      action: activityLogActions.machineCreated,
      ...(normalizedActorUserId ? { actorUserId: normalizedActorUserId } : {}),
      targetType: 'machine',
      targetId: machine.id,
    });

    return machine;
  });
}

export async function updateMachine({
  db,
  organizationId,
  machineId,
  customerId,
  machineModelId,
  machineName,
  serialNumber,
  actorUserId,
  deliveryDate,
  plcType,
  hmiType,
  status,
}: UpdateMachineInput): Promise<MachineRecord> {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  const normalizedMachineId = normalizeRequiredText('Machine ID', machineId);
  const normalizedCustomerId = normalizeRequiredText('Customer ID', customerId);
  const normalizedMachineModelId = normalizeRequiredText('Machine model ID', machineModelId);
  const normalizedMachineName = normalizeRequiredText('Machine name', machineName);
  const normalizedSerialNumber = normalizeRequiredText('Machine serial number', serialNumber);
  const normalizedActorUserId = normalizeOptionalText(actorUserId);
  const normalizedPlcType = normalizeOptionalText(plcType);
  const normalizedHmiType = normalizeOptionalText(hmiType);

  return db.$transaction(async (tx) => {
    await assertMachineBelongsToOrganization(tx, normalizedOrganizationId, normalizedMachineId);
    await assertCustomerBelongsToOrganization(tx, normalizedOrganizationId, normalizedCustomerId);
    await assertMachineModelBelongsToOrganization(
      tx,
      normalizedOrganizationId,
      normalizedMachineModelId,
    );

    const machine = await tx.machine.update({
      where: {
        id: normalizedMachineId,
        organizationId: normalizedOrganizationId,
      },
      data: {
        customerId: normalizedCustomerId,
        machineModelId: normalizedMachineModelId,
        machineName: normalizedMachineName,
        serialNumber: normalizedSerialNumber,
        status: status ?? MachineStatus.ACTIVE,
        deliveryDate: deliveryDate ?? null,
        plcType: normalizedPlcType ?? null,
        hmiType: normalizedHmiType ?? null,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        machineModel: {
          select: {
            id: true,
            modelName: true,
          },
        },
      },
    });

    await createActivityLog({
      db: tx,
      organizationId: normalizedOrganizationId,
      action: activityLogActions.machineUpdated,
      ...(normalizedActorUserId ? { actorUserId: normalizedActorUserId } : {}),
      targetType: 'machine',
      targetId: machine.id,
    });

    return machine;
  });
}

export async function listMachinesByOrganization({
  db,
  organizationId,
}: OrganizationScopedInput): Promise<readonly MachineRecord[]> {
  return db.machine.findMany({
    where: {
      organizationId: normalizeOrganizationId(organizationId),
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      machineModel: {
        select: {
          id: true,
          modelName: true,
        },
      },
    },
    orderBy: {
      machineName: 'asc',
    },
  });
}

export async function getMachineByOrganization({
  db,
  organizationId,
  machineId,
}: GetMachineByOrganizationInput): Promise<MachineRecord | null> {
  return db.machine.findFirst({
    where: {
      id: normalizeRequiredText('Machine ID', machineId),
      organizationId: normalizeOrganizationId(organizationId),
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      machineModel: {
        select: {
          id: true,
          modelName: true,
        },
      },
    },
  });
}
