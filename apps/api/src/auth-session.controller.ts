import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import type { OrganizationRole, PrismaClient } from '@buildtrace/db';
import { createPrismaClient } from '@buildtrace/db';
import type { User } from '@supabase/supabase-js';

import { parseBearerAuthorizationHeader } from './authorization-header.js';
import { verifyBearerToken } from './auth-verifier.js';

export type AuthOnboardRequestBody = {
  readonly organizationName?: unknown;
  readonly displayName?: unknown;
};

export type AuthSessionOrganization = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly role: OrganizationRole;
};

export type AuthSessionResponse = {
  readonly session: {
    readonly appUserId: string;
    readonly authUserId: string;
    readonly email: string;
    readonly organizationId: string;
    readonly role: OrganizationRole;
    readonly organizations: readonly AuthSessionOrganization[];
  };
};

type AuthSessionEndpointDependencies = {
  readonly db: PrismaClient;
  readonly verifyBearerToken: typeof verifyBearerToken;
};

type ResolveAuthSessionFromRequestInput = {
  readonly authorizationHeader: string | undefined;
  readonly body: AuthOnboardRequestBody | undefined;
  readonly dependencies: AuthSessionEndpointDependencies;
};

const ownerRole = 'OWNER' satisfies OrganizationRole;

let db: PrismaClient | undefined;

function getDatabase(): PrismaClient {
  db ??= createPrismaClient();

  return db;
}

function createRealDependencies(): AuthSessionEndpointDependencies {
  return {
    db: getDatabase(),
    verifyBearerToken,
  };
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

function readUserEmail(user: User): string {
  const email = user.email?.trim();

  if (!email) {
    throw new BadRequestException('Authenticated Supabase user does not have an email address.');
  }

  return email.toLowerCase();
}

function readDisplayNameFromUserMetadata(user: User): string | undefined {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = metadata.display_name ?? metadata.full_name ?? metadata.name;

  return typeof displayName === 'string' && displayName.trim() ? displayName.trim() : undefined;
}

function readOrganizationNameFromUserMetadata(user: User): string | undefined {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const organizationName = metadata.organization_name;

  return typeof organizationName === 'string' && organizationName.trim()
    ? organizationName.trim()
    : undefined;
}

function slugifyOrganizationName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return slug || 'workspace';
}

async function createUniqueOrganizationSlug(db: PrismaClient, organizationName: string) {
  const baseSlug = slugifyOrganizationName(organizationName);
  let candidateSlug = baseSlug;
  let suffix = 2;

  while (await db.organization.findUnique({ where: { slug: candidateSlug } })) {
    candidateSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidateSlug;
}

function mapMemberships(
  memberships: readonly {
    readonly role: OrganizationRole;
    readonly organization: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    };
  }[],
): readonly AuthSessionOrganization[] {
  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));
}

async function readUserMemberships(db: PrismaClient, appUserId: string) {
  return db.organizationMembership.findMany({
    where: {
      appUserId,
    },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

async function createOrganizationForUser({
  db,
  organizationName,
  appUserId,
}: {
  readonly db: PrismaClient;
  readonly organizationName: string;
  readonly appUserId: string;
}) {
  const slug = await createUniqueOrganizationSlug(db, organizationName);

  const organization = await db.organization.create({
    data: {
      name: organizationName,
      slug,
    },
  });

  await db.organizationMembership.create({
    data: {
      organizationId: organization.id,
      appUserId,
      role: ownerRole,
    },
  });

  return organization;
}

export async function resolveAuthSessionFromRequest({
  authorizationHeader,
  body,
  dependencies,
}: ResolveAuthSessionFromRequestInput): Promise<AuthSessionResponse> {
  const { accessToken } = parseBearerAuthorizationHeader(authorizationHeader);
  const { user } = await dependencies.verifyBearerToken(accessToken);
  const email = readUserEmail(user);
  const displayName =
    readOptionalString('displayName', body?.displayName) ?? readDisplayNameFromUserMetadata(user);
  const requestedOrganizationName = readOptionalString('organizationName', body?.organizationName);

  const appUser = await dependencies.db.appUser.upsert({
    where: {
      authUserId: user.id,
    },
    update: {
      email,
      ...(displayName ? { displayName } : {}),
    },
    create: {
      authUserId: user.id,
      email,
      ...(displayName ? { displayName } : {}),
    },
  });

  let memberships = await readUserMemberships(dependencies.db, appUser.id);
  const organizationName =
    requestedOrganizationName ??
    (memberships.length === 0 ? readOrganizationNameFromUserMetadata(user) : undefined);
  const requestedOrganization = organizationName
    ? memberships.find(
        (membership) =>
          membership.organization.name.toLowerCase() === organizationName.toLowerCase(),
      )
    : undefined;

  if (organizationName && !requestedOrganization) {
    await createOrganizationForUser({
      db: dependencies.db,
      organizationName,
      appUserId: appUser.id,
    });
    memberships = await readUserMemberships(dependencies.db, appUser.id);
  }

  if (memberships.length === 0) {
    throw new BadRequestException('Create an organization before opening the workspace.');
  }

  const organizations = mapMemberships(memberships);
  const selectedOrganization =
    (organizationName
      ? organizations.find(
          (organization) => organization.name.toLowerCase() === organizationName.toLowerCase(),
        )
      : undefined) ?? organizations[0];

  if (!selectedOrganization) {
    throw new BadRequestException('Organization could not be resolved for this session.');
  }

  return {
    session: {
      appUserId: appUser.id,
      authUserId: appUser.authUserId,
      email: appUser.email,
      organizationId: selectedOrganization.id,
      role: selectedOrganization.role,
      organizations,
    },
  };
}

@Controller('auth')
export class AuthSessionController {
  @Post('onboard')
  async onboard(
    @Headers('authorization') authorizationHeader: string | undefined,
    @Body() body: AuthOnboardRequestBody | undefined,
  ): Promise<AuthSessionResponse> {
    return resolveAuthSessionFromRequest({
      authorizationHeader,
      body,
      dependencies: createRealDependencies(),
    });
  }
}
