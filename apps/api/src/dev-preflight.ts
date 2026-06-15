import { createPrismaClient } from '@buildtrace/db';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

type JwtPayload = {
  readonly role?: string;
};

type DevMembershipRow = {
  readonly organization_id: string;
  readonly slug: string;
  readonly auth_user_id: string;
  readonly email: string;
  readonly role: string;
};

type DevPreflightConfig = {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseServiceRoleKey: string;
  readonly databaseUrl: string;
  readonly documentStorageBucket: string;
  readonly devOrganizationSlug: string;
  readonly devAuthUserId: string;
  readonly signedUrlTtlSeconds: number;
};

const envPath = new URL('../../../.env', import.meta.url);

function loadRootEnv(): void {
  const envText = readFileSync(envPath, 'utf8');

  for (const line of envText.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    process.env[key] = value;
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for dev preflight.`);
  }

  return value;
}

function readPositiveIntegerEnv(name: string): number {
  const rawValue = readRequiredEnv(name);
  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function decodeJwtPayload(token: string, label: string): JwtPayload {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error(`${label} must be a JWT with three dot-separated parts.`);
  }

  const payload = parts[1];

  if (!payload) {
    throw new Error(`${label} is missing a JWT payload.`);
  }

  const normalizedPayload = payload
    .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')
    .replaceAll('-', '+')
    .replaceAll('_', '/');

  return JSON.parse(Buffer.from(normalizedPayload, 'base64').toString('utf8')) as JwtPayload;
}

function assertJwtRole(token: string, label: string, expectedRole: string): void {
  const payload = decodeJwtPayload(token, label);

  if (payload.role !== expectedRole) {
    throw new Error(
      `${label} must decode to role ${expectedRole}, but decoded to ${payload.role ?? 'missing'}.`,
    );
  }
}

function readDevPreflightConfig(): DevPreflightConfig {
  const supabaseUrl = readRequiredEnv('SUPABASE_URL');
  const supabaseAnonKey = readRequiredEnv('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseAnonKey === supabaseServiceRoleKey) {
    throw new Error('SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must not be identical.');
  }

  assertJwtRole(supabaseAnonKey, 'SUPABASE_ANON_KEY', 'anon');
  assertJwtRole(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY', 'service_role');

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    databaseUrl: readRequiredEnv('DATABASE_URL'),
    documentStorageBucket: readRequiredEnv('DOCUMENT_STORAGE_BUCKET'),
    devOrganizationSlug: readRequiredEnv('DEV_ORGANIZATION_SLUG'),
    devAuthUserId: readRequiredEnv('DEV_AUTH_USER_ID'),
    signedUrlTtlSeconds: readPositiveIntegerEnv('SIGNED_URL_TTL_SECONDS'),
  };
}

async function assertDevMembership(config: DevPreflightConfig): Promise<void> {
  const db = createPrismaClient();

  try {
    const rows = await db.$queryRawUnsafe<DevMembershipRow[]>(
      `
        select
          o.id as organization_id,
          o.slug,
          u.auth_user_id,
          u.email,
          m.role
        from organization_memberships m
        join organizations o on o.id = m.organization_id
        join app_users u on u.id = m.app_user_id
        where o.slug = $1
          and u.auth_user_id = $2
        order by o.slug, u.email
      `,
      config.devOrganizationSlug,
      config.devAuthUserId,
    );

    if (rows.length !== 1) {
      throw new Error(
        `Expected exactly one dev organization membership for ${config.devAuthUserId} in ${config.devOrganizationSlug}, found ${rows.length}.`,
      );
    }

    const membership = rows[0];

    if (!membership) {
      throw new Error('Dev membership query returned no row after count validation.');
    }

    console.info(
      `Dev membership ready: ${membership.slug} / ${membership.email} / ${membership.role}.`,
    );
  } finally {
    await db.$disconnect();
  }
}

async function assertDocumentStorageBoundary(config: DevPreflightConfig): Promise<void> {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(
    config.documentStorageBucket,
  );

  if (bucketError || !bucket) {
    throw new Error(
      `Document storage bucket ${config.documentStorageBucket} could not be read: ${
        bucketError?.message ?? 'missing bucket'
      }.`,
    );
  }

  if (bucket.public) {
    throw new Error(`Document storage bucket ${config.documentStorageBucket} must be private.`);
  }

  const preflightPath = `_preflight/${Date.now()}-dev-preflight.txt`;

  const { error: uploadError } = await supabase.storage
    .from(config.documentStorageBucket)
    .upload(preflightPath, Buffer.from('buildtrace document storage preflight'), {
      contentType: 'text/plain',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Document storage service-role upload failed: ${uploadError.message}.`);
  }

  const { error: removeError } = await supabase.storage
    .from(config.documentStorageBucket)
    .remove([preflightPath]);

  if (removeError) {
    throw new Error(`Document storage preflight cleanup failed: ${removeError.message}.`);
  }

  console.info(
    `Document storage ready: ${config.documentStorageBucket} is private and writable by service role.`,
  );
}

async function runDevPreflight(): Promise<void> {
  loadRootEnv();

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev preflight must not run with NODE_ENV=production.');
  }

  const config = readDevPreflightConfig();

  console.info(`Database target loaded: ${new URL(config.databaseUrl).host}.`);
  console.info(`Signed URL TTL loaded: ${config.signedUrlTtlSeconds} seconds.`);

  await assertDevMembership(config);
  await assertDocumentStorageBoundary(config);

  console.info('BuildTrace dev preflight passed.');
}

runDevPreflight().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
