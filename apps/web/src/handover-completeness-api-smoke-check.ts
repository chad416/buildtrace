import {
  getHandoverCompleteness,
  type HandoverCompletenessFetcher,
} from './handover-completeness-api.js';

type CapturedRequest = {
  readonly input: Parameters<HandoverCompletenessFetcher>[0];
  readonly init: Parameters<HandoverCompletenessFetcher>[1];
};

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectThrows(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

function readUrl(input: Parameters<HandoverCompletenessFetcher>[0]): URL {
  return input instanceof URL ? input : new URL(String(input));
}

function readHeaders(init: Parameters<HandoverCompletenessFetcher>[1]): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

async function runHandoverCompletenessApiSmokeCheck(): Promise<void> {
  const calls: CapturedRequest[] = [];

  const fetcher: HandoverCompletenessFetcher = async (input, init) => {
    calls.push({ input, init });

    return createJsonResponse({
      checklistVersion: 'customer-handover-beta-v1',
      requiredCategories: ['manuals', 'safety-instructions', 'spare-parts-bom', 'certificates'],
      presentCategories: ['manuals'],
      missingCategories: ['safety-instructions', 'spare-parts-bom', 'certificates'],
      completedCount: 1,
      requiredCount: 4,
      percentage: 25,
    });
  };

  const result = await getHandoverCompleteness(
    {
      organizationId: ' organization-1 ',
      machineId: ' machine-1 ',
      accessToken: ' token-1 ',
    },
    fetcher,
  );

  assert(
    result.checklistVersion === 'customer-handover-beta-v1',
    'Checklist version was not returned.',
  );
  assert(result.completedCount === 1, 'Completed count was not returned.');
  assert(result.requiredCount === 4, 'Required count was not returned.');
  assert(result.percentage === 25, 'Percentage was not returned.');
  assert(
    result.missingCategories.join('|') === 'safety-instructions|spare-parts-bom|certificates',
    'Missing categories were not returned.',
  );
  assert(
    !JSON.stringify(result).includes('storagePath'),
    'Completeness response must not contain storage paths.',
  );

  const call = calls[0];

  assert(call !== undefined, 'Handover request was not captured.');

  const url = readUrl(call.input);

  assert(
    url.pathname === '/document-records/machines/machine-1/handover-completeness',
    'Handover request used the wrong path.',
  );
  assert(
    url.searchParams.get('organizationId') === 'organization-1',
    'Organization query was not normalized.',
  );
  assert(call.init?.method === 'GET', 'Handover request must use GET.');
  assert(
    readHeaders(call.init).authorization === 'Bearer token-1',
    'Authorization header was not normalized.',
  );

  await expectThrows('missing organization ID', () =>
    getHandoverCompleteness(
      {
        organizationId: '   ',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing machine ID', () =>
    getHandoverCompleteness(
      {
        organizationId: 'organization-1',
        machineId: '   ',
        accessToken: 'token-1',
      },
      fetcher,
    ),
  );

  await expectThrows('missing access token', () =>
    getHandoverCompleteness(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: '   ',
      },
      fetcher,
    ),
  );

  await expectThrows('failed response', () =>
    getHandoverCompleteness(
      {
        organizationId: 'organization-1',
        machineId: 'machine-1',
        accessToken: 'token-1',
      },
      async () => new Response('nope', { status: 500 }),
    ),
  );
}

await runHandoverCompletenessApiSmokeCheck();

console.info('Handover completeness web API smoke check passed.');
