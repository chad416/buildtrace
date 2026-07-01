import { readSupabaseConfirmationFragment } from './signup-confirmation.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const confirmed = readSupabaseConfirmationFragment(
  '#access_token=access-token-1&expires_in=3600&refresh_token=refresh-token-1&type=signup',
);
assert(confirmed.status === 'success', 'A valid confirmation fragment was rejected.');
assert(confirmed.accessToken === 'access-token-1', 'The confirmation access token was not read.');

const providerError = readSupabaseConfirmationFragment(
  '#error=access_denied&error_description=Email+link+has+expired',
);
assert(providerError.status === 'error', 'A provider error was not detected.');
assert(providerError.message === 'Email link has expired', 'The provider error was not decoded.');

const missingToken = readSupabaseConfirmationFragment('');
assert(missingToken.status === 'error', 'A missing confirmation token was accepted.');
assert(
  missingToken.message.includes('invalid or has expired'),
  'A missing confirmation token did not return useful guidance.',
);

console.log('Signup confirmation smoke check passed.');
