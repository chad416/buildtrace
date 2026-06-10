import type { OrganizationRole } from '@buildtrace/db';

import type { CurrentUserContext, CurrentUserOrganization } from './current-user.js';

type RequireOrganizationAccessInput = {
  readonly currentUser: CurrentUserContext;
  readonly organizationId: string;
  readonly allowedRoles?: readonly OrganizationRole[];
};

export type AuthorizedOrganizationAccess = {
  readonly organizationId: string;
  readonly role: OrganizationRole;
};

function findOrganizationMembership(
  currentUser: CurrentUserContext,
  organizationId: string,
): CurrentUserOrganization | undefined {
  return currentUser.organizations.find((organization) => organization.id === organizationId);
}

export function requireOrganizationAccess({
  currentUser,
  organizationId,
  allowedRoles,
}: RequireOrganizationAccessInput): AuthorizedOrganizationAccess {
  const membership = findOrganizationMembership(currentUser, organizationId);

  if (!membership) {
    throw new Error('Current user does not have access to this organization.');
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error('Current user does not have the required organization role.');
  }

  return {
    organizationId,
    role: membership.role,
  };
}
