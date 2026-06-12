import { OrganizationRole } from './generated/prisma/enums';
import { createPrismaClient } from './client.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DevBootstrapConfig = {
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly authUserId: string;
  readonly userEmail: string;
  readonly userDisplayName?: string;
  readonly role: OrganizationRole;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the development bootstrap.`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function readOrganizationRole(): OrganizationRole {
  const value = readOptionalEnv('DEV_ORGANIZATION_ROLE') ?? OrganizationRole.OWNER;

  if (!Object.values(OrganizationRole).includes(value as OrganizationRole)) {
    throw new Error(
      `DEV_ORGANIZATION_ROLE must be one of: ${Object.values(OrganizationRole).join(', ')}.`,
    );
  }

  return value as OrganizationRole;
}

function readDevBootstrapConfig(): DevBootstrapConfig {
  const authUserId = readRequiredEnv('DEV_AUTH_USER_ID');
  const userDisplayName = readOptionalEnv('DEV_USER_DISPLAY_NAME');

  if (!uuidPattern.test(authUserId)) {
    throw new Error('DEV_AUTH_USER_ID must be a valid UUID from the Supabase auth user.');
  }

  return {
    organizationName: readRequiredEnv('DEV_ORGANIZATION_NAME'),
    organizationSlug: readRequiredEnv('DEV_ORGANIZATION_SLUG'),
    authUserId,
    userEmail: readRequiredEnv('DEV_USER_EMAIL'),
    ...(userDisplayName ? { userDisplayName } : {}),
    role: readOrganizationRole(),
  };
}

async function runDevBootstrap(): Promise<void> {
  const config = readDevBootstrapConfig();
  const db = createPrismaClient();
  const displayNamePatch = config.userDisplayName
    ? {
        displayName: config.userDisplayName,
      }
    : {};

  try {
    const organization = await db.organization.upsert({
      where: {
        slug: config.organizationSlug,
      },
      update: {
        name: config.organizationName,
      },
      create: {
        name: config.organizationName,
        slug: config.organizationSlug,
      },
    });

    const appUser = await db.appUser.upsert({
      where: {
        authUserId: config.authUserId,
      },
      update: {
        email: config.userEmail,
        ...displayNamePatch,
      },
      create: {
        authUserId: config.authUserId,
        email: config.userEmail,
        ...displayNamePatch,
      },
    });

    await db.organizationMembership.upsert({
      where: {
        organizationId_appUserId: {
          organizationId: organization.id,
          appUserId: appUser.id,
        },
      },
      update: {
        role: config.role,
      },
      create: {
        organizationId: organization.id,
        appUserId: appUser.id,
        role: config.role,
      },
    });

    console.info('Development bootstrap completed.');
    console.info(`Organization: ${organization.slug}`);
    console.info(`App user: ${appUser.email}`);
    console.info(`Role: ${config.role}`);
  } finally {
    await db.$disconnect();
  }
}

await runDevBootstrap();
