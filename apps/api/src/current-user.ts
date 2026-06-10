import type { OrganizationRole, PrismaClient } from '@buildtrace/db';

type ResolveCurrentUserInput = {
  readonly authUserId: string;
  readonly db: PrismaClient;
};

export type CurrentUserOrganization = {
  readonly id: string;
  readonly role: OrganizationRole;
};

export type CurrentUserContext = {
  readonly appUserId: string;
  readonly authUserId: string;
  readonly email: string;
  readonly organizations: readonly CurrentUserOrganization[];
};

export async function resolveCurrentUserContext({
  authUserId,
  db,
}: ResolveCurrentUserInput): Promise<CurrentUserContext> {
  const appUser = await db.appUser.findUnique({
    where: {
      authUserId,
    },
    include: {
      memberships: {
        select: {
          organizationId: true,
          role: true,
        },
      },
    },
  });

  if (!appUser) {
    throw new Error('Authenticated user is not mapped to an app user.');
  }

  return {
    appUserId: appUser.id,
    authUserId: appUser.authUserId,
    email: appUser.email,
    organizations: appUser.memberships.map((membership) => ({
      id: membership.organizationId,
      role: membership.role,
    })),
  };
}
