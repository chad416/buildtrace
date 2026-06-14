import 'dotenv/config';
import { OrganizationRole } from './generated/prisma/enums';
import { createPrismaClient } from './client.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DevBootstrapConfig = {
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly authUserId: string;
  readonly userEmail: string;
  readonly userDisplayName: string;
  readonly role: OrganizationRole;
};

function assertNonProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development bootstrap must not run in production.');
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the development bootstrap.`);
  }

  return value;
}

function readOrganizationRole(): OrganizationRole {
  const rawRole = process.env.DEV_ORGANIZATION_ROLE?.trim() || OrganizationRole.OWNER;

  if (!Object.values(OrganizationRole).includes(rawRole as OrganizationRole)) {
    throw new Error(
      `DEV_ORGANIZATION_ROLE must be one of: ${Object.values(OrganizationRole).join(', ')}.`,
    );
  }

  return rawRole as OrganizationRole;
}

function readDevBootstrapConfig(): DevBootstrapConfig {
  const authUserId = readRequiredEnv('DEV_AUTH_USER_ID');

  if (!uuidPattern.test(authUserId)) {
    throw new Error('DEV_AUTH_USER_ID must be a valid UUID from the Supabase auth user.');
  }

  return {
    organizationName: readRequiredEnv('DEV_ORGANIZATION_NAME'),
    organizationSlug: readRequiredEnv('DEV_ORGANIZATION_SLUG'),
    authUserId,
    userEmail: readRequiredEnv('DEV_USER_EMAIL'),
    userDisplayName: readRequiredEnv('DEV_USER_DISPLAY_NAME'),
    role: readOrganizationRole(),
  };
}

export async function runDevBootstrap(): Promise<void> {
  assertNonProductionEnvironment();

  const config = readDevBootstrapConfig();
  const db = createPrismaClient();

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
        displayName: config.userDisplayName,
      },
      create: {
        authUserId: config.authUserId,
        email: config.userEmail,
        displayName: config.userDisplayName,
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
