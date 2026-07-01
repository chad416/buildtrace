export type SupabaseConfirmationFragment =
  | { readonly status: 'success'; readonly accessToken: string }
  | { readonly status: 'error'; readonly message: string };

const invalidConfirmationMessage =
  'This confirmation link is invalid or has expired. Please sign up again or sign in if you already confirmed your email.';

export function readSupabaseConfirmationFragment(hash: string): SupabaseConfirmationFragment {
  const parameters = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const providerError = parameters.get('error_description') ?? parameters.get('error');

  if (providerError?.trim()) {
    return {
      status: 'error',
      message: providerError.trim(),
    };
  }

  const accessToken = parameters.get('access_token')?.trim();

  if (!accessToken) {
    return {
      status: 'error',
      message: invalidConfirmationMessage,
    };
  }

  return {
    status: 'success',
    accessToken,
  };
}
