import type { CurrentUserContext } from './current-user.js';
import { requireOrganizationAccess } from './tenant-access.js';

function createCurrentUserContext(): CurrentUserContext {
  return {
    appUserId: 'app-user-1',
    authUserId: 'auth-user-1',
    email: 'operator@buildtrace.test',
    organizations: [
      {
        id: 'organization-1',
        role: 'ADMIN',
      },
      {
        id: 'organization-2',
        role: 'MEMBER',
      },
    ],
  };
}

function expectThrows(name: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

function runTenantAccessSmokeCheck(): void {
  const currentUser = createCurrentUserContext();

  const adminAccess = requireOrganizationAccess({
    currentUser,
    organizationId: 'organization-1',
  });

  if (adminAccess.organizationId !== 'organization-1' || adminAccess.role !== 'ADMIN') {
    throw new Error('Tenant guard returned the wrong organization access.');
  }

  requireOrganizationAccess({
    currentUser,
    organizationId: 'organization-1',
    allowedRoles: ['OWNER', 'ADMIN'],
  });

  expectThrows('missing organization membership', () =>
    requireOrganizationAccess({
      currentUser,
      organizationId: 'organization-3',
    }),
  );

  expectThrows('insufficient organization role', () =>
    requireOrganizationAccess({
      currentUser,
      organizationId: 'organization-2',
      allowedRoles: ['OWNER', 'ADMIN'],
    }),
  );
}

runTenantAccessSmokeCheck();

console.info('Tenant access smoke check passed.');
