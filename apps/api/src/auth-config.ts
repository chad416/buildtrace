export type SupabaseAuthConfig = {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the API auth boundary.`);
  }

  return value;
}

export function getSupabaseAuthConfig(): SupabaseAuthConfig {
  return {
    supabaseUrl: readRequiredEnv('SUPABASE_URL'),
    supabaseServiceRoleKey: readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
