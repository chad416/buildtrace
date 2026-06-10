import { parseBearerAuthorizationHeader } from './authorization-header.js';
import { verifyBearerToken } from './auth-verifier.js';

function expectThrows(name: string, action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }

  throw new Error(`${name} should throw.`);
}

async function expectRejects(name: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${name} should reject.`);
}

async function runAuthSmokeCheck(): Promise<void> {
  expectThrows('missing authorization header', () => parseBearerAuthorizationHeader(undefined));
  expectThrows('empty authorization header', () => parseBearerAuthorizationHeader(''));
  expectThrows('basic authorization header', () => parseBearerAuthorizationHeader('Basic abc'));
  expectThrows('bearer header without token', () => parseBearerAuthorizationHeader('Bearer'));
  expectThrows('bearer header with extra parts', () =>
    parseBearerAuthorizationHeader('Bearer one two'),
  );

  const parsed = parseBearerAuthorizationHeader('Bearer test-token');

  if (parsed.accessToken !== 'test-token') {
    throw new Error('Bearer token parser returned the wrong token.');
  }

  await expectRejects('empty bearer token verification', () => verifyBearerToken(''));
}

await runAuthSmokeCheck();

console.info('Auth smoke check passed.');
