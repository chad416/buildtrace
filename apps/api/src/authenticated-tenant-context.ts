import type { OrganizationRole, PrismaClient } from '@buildtrace/db';

import { parseBearerAuthorizationHeader } from './authorization-header.js';
import { resolveCurrentUserContext, type CurrentUserContext } from './current-user.js';
import { requireOrganizationAccess, type AuthorizedOrganizationAccess } from './tenant-access.js';
import { verifyBearerToken } from './auth-verifier.js';

type ResolveAuthenticatedTenantContextInput = {
  readonly authorizationHeader: string | undefined;
  readonly organizationId: string;
  readonly db: PrismaClient;
  readonly allowedRoles?: readonly OrganizationRole[];
};

export type AuthenticatedTenantContext = {
  readonly currentUser: CurrentUserContext;
  readonly organizationAccess: AuthorizedOrganizationAccess;
};

export async function resolveAuthenticatedTenantContext({
  authorizationHeader,
  organizationId,
  db,
  allowedRoles,
}: ResolveAuthenticatedTenantContextInput): Promise<AuthenticatedTenantContext> {
  const { accessToken } = parseBearerAuthorizationHeader(authorizationHeader);
  const { user } = await verifyBearerToken(accessToken);

  const currentUser = await resolveCurrentUserContext({
    authUserId: user.id,
    db,
  });

  const organizationAccess = requireOrganizationAccess({
    currentUser,
    organizationId,
    ...(allowedRoles ? { allowedRoles } : {}),
  });

  return {
    currentUser,
    organizationAccess,
  };
}
