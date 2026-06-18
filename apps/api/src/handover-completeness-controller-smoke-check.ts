import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@buildtrace/db';
import type { CustomerHandoverDocument } from '@buildtrace/shared';

import {
  getHandoverCompletenessFromRequest,
  type HandoverCompletenessEndpointDependencies,
} from './handover-completeness.controller.js';

type ResolveInput = Parameters<
  HandoverCompletenessEndpointDependencies['resolveAuthenticatedTenantContext']
>[0];

type MachineInput = Parameters<
  HandoverCompletenessEndpointDependencies['getMachineByOrganization']
>[0];

type DocumentsInput = Parameters<
  HandoverCompletenessEndpointDependencies['listDocumentsByMachine']
>[0];

type CapturedCalls = {
  readonly resolveInputs: ResolveInput[];
  readonly machineInputs: MachineInput[];
  readonly documentInputs: DocumentsInput[];
};

const fakeDb = {} as PrismaClient;

const documents = [
  {
    category: 'manuals',
    suggestedCategory: null,
    visibilityLevel: 'customer-visible',
    visibleToCustomer: true,
  },
  {
    category: 'safety-instructions',
    suggestedCategory: null,
    visibilityLevel: 'internal',
    visibleToCustomer: false,
  },
  {
    category: 'other',
    suggestedCategory: 'spare-parts-bom',
    visibilityLevel: 'customer-visible',
    visibleToCustomer: true,
  },
] as const satisfies readonly CustomerHandoverDocument[];

function createCapturedCalls(): CapturedCalls {
  return {
    resolveInputs: [],
    machineInputs: [],
    documentInputs: [],
  };
}

function createDependencies(
  capturedCalls: CapturedCalls,
): HandoverCompletenessEndpointDependencies {
  return {
    db: fakeDb,
    resolveAuthenticatedTenantContext: async (input) => {
      capturedCalls.resolveInputs.push(input);
      return {};
    },
    getMachineByOrganization: async (input) => {
      capturedCalls.machineInputs.push(input);
      return { id: 'machine-1' };
    },
    listDocumentsByMachine: async (input) => {
      capturedCalls.documentInputs.push(input);
      return documents;
    },
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectBadRequest(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw BadRequestException.`);
}

async function expectNotFound(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof NotFoundException) {
      return;
    }

    throw error;
  }

  throw new Error(`${name} should throw NotFoundException.`);
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

async function runSuccessfulRequestCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();

  const response = await getHandoverCompletenessFromRequest({
    authorizationHeader: 'Bearer token-1',
    machineId: ' machine-1 ',
    query: {
      organizationId: ' organization-1 ',
    },
    dependencies: createDependencies(capturedCalls),
  });

  assert(response.checklistVersion === 'customer-handover-beta-v1', 'Checklist version was wrong.');
  assert(response.completedCount === 1, 'Only the eligible manual should count.');
  assert(response.requiredCount === 4, 'Required count was wrong.');
  assert(response.percentage === 25, 'Percentage was wrong.');
  assert(response.presentCategories.join('|') === 'manuals', 'Present categories were wrong.');
  assert(
    response.missingCategories.join('|') === 'safety-instructions|spare-parts-bom|certificates',
    'Missing categories were wrong.',
  );
  assert(
    !JSON.stringify(response).includes('storagePath'),
    'Response must not expose storage paths.',
  );

  const resolveInput = capturedCalls.resolveInputs[0];
  const machineInput = capturedCalls.machineInputs[0];
  const documentInput = capturedCalls.documentInputs[0];

  assert(resolveInput !== undefined, 'Authentication was not called.');
  assert(machineInput !== undefined, 'Machine lookup was not called.');
  assert(documentInput !== undefined, 'Document query was not called.');

  assert(
    resolveInput.authorizationHeader === 'Bearer token-1',
    'Authorization header was not forwarded.',
  );
  assert(
    resolveInput.organizationId === 'organization-1',
    'Authentication organization was not normalized.',
  );
  assert(resolveInput.allowedRoles?.join('|') === 'OWNER|ADMIN|MEMBER', 'Read roles were wrong.');
  assert(resolveInput.db === fakeDb, 'DB was not forwarded to authentication.');

  assert(machineInput.organizationId === 'organization-1', 'Machine organization was wrong.');
  assert(machineInput.machineId === 'machine-1', 'Machine ID was not normalized.');
  assert(machineInput.db === fakeDb, 'DB was not forwarded to machine lookup.');

  assert(documentInput.organizationId === 'organization-1', 'Document organization was wrong.');
  assert(documentInput.machineId === 'machine-1', 'Document machine ID was wrong.');
  assert(documentInput.db === fakeDb, 'DB was not forwarded to document query.');
}

async function runIsolationCheck(): Promise<void> {
  const capturedCalls = createCapturedCalls();
  const dependencies = createDependencies(capturedCalls);

  await expectNotFound('cross-tenant or missing machine', () =>
    getHandoverCompletenessFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-404',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: {
        ...dependencies,
        getMachineByOrganization: async (input) => {
          capturedCalls.machineInputs.push(input);
          return null;
        },
      },
    }),
  );

  assert(
    capturedCalls.documentInputs.length === 0,
    'Documents must not be queried for an unavailable scoped machine.',
  );
}

async function runValidationAndAuthChecks(): Promise<void> {
  await expectBadRequest('missing organization ID', () =>
    getHandoverCompletenessFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: 'machine-1',
      query: {},
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  await expectBadRequest('missing machine ID', () =>
    getHandoverCompletenessFromRequest({
      authorizationHeader: 'Bearer token-1',
      machineId: '   ',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: createDependencies(createCapturedCalls()),
    }),
  );

  const capturedCalls = createCapturedCalls();

  await expectThrows('authentication failure', () =>
    getHandoverCompletenessFromRequest({
      authorizationHeader: 'Bearer invalid',
      machineId: 'machine-1',
      query: {
        organizationId: 'organization-1',
      },
      dependencies: {
        ...createDependencies(capturedCalls),
        resolveAuthenticatedTenantContext: async () => {
          throw new Error('Authentication failed.');
        },
      },
    }),
  );

  assert(
    capturedCalls.machineInputs.length === 0,
    'Machine lookup must not run after authentication failure.',
  );
  assert(
    capturedCalls.documentInputs.length === 0,
    'Document query must not run after authentication failure.',
  );
}

await runSuccessfulRequestCheck();
await runIsolationCheck();
await runValidationAndAuthChecks();

console.info('Handover completeness controller smoke check passed.');
