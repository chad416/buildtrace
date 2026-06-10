import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import { getSupabaseAuthConfig } from './auth-config.js';

export type VerifyBearerTokenResult = { readonly user: User };

let cachedSupabaseAuthClient: SupabaseClient | undefined;

function getSupabaseAuthClient(): SupabaseClient {
  if (!cachedSupabaseAuthClient) {
    const config = getSupabaseAuthConfig();

    cachedSupabaseAuthClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedSupabaseAuthClient;
}

export async function verifyBearerToken(accessToken: string): Promise<VerifyBearerTokenResult> {
  if (!accessToken.trim()) {
    throw new Error('Bearer token is required for API authentication.');
  }

  const { data, error } = await getSupabaseAuthClient().auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error('Bearer token could not be verified.');
  }

  return {
    user: data.user,
  };
}
