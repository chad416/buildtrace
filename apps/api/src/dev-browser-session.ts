import { createPrismaClient } from '@buildtrace/db';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

type JwtPayload = {
  readonly sub?: string;
  readonly exp?: number;
  readonly role?: string;
};

type PasswordGrantResponse = {
  readonly access_token?: string;
};

type DevMembershipRow = {
  readonly organization_id: string;
  readonly slug: string;
  readonly auth_user_id: string;
  readonly email: string;
  readonly role: string;
};

type DevBrowserSessionConfig = {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseServiceRoleKey: string;
  readonly devOrganizationSlug: string;
  readonly devAuthUserId: string;
  readonly devUserEmail: string;
  readonly webUrl: string;
};

const envPath = new URL('../../../.env', import.meta.url);
const machineRecordsAccessTokenCookieName = 'buildtrace_machine_records_access_token';
const machineRecordsOrganizationIdCookieName = 'buildtrace_machine_records_organization_id';

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

    process.env[trimmedLine.slice(0, separatorIndex).trim()] = trimmedLine
      .slice(separatorIndex + 1)
      .trim();
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for dev browser session bootstrap.`);
  }

  return value;
}

function decodeJwtPayload(token: string, label: string): JwtPayload {
  const parts = token.split('.');

  if (parts.length !== 3 || !parts[1]) {
    throw new Error(`${label} must be a JWT with three dot-separated parts.`);
  }

  const payload = parts[1];
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

function readConfig(): DevBrowserSessionConfig {
  const supabaseAnonKey = readRequiredEnv('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseAnonKey === supabaseServiceRoleKey) {
    throw new Error('SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must not be identical.');
  }

  assertJwtRole(supabaseAnonKey, 'SUPABASE_ANON_KEY', 'anon');
  assertJwtRole(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY', 'service_role');

  return {
    supabaseUrl: readRequiredEnv('SUPABASE_URL'),
    supabaseAnonKey,
    supabaseServiceRoleKey,
    devOrganizationSlug: readRequiredEnv('DEV_ORGANIZATION_SLUG'),
    devAuthUserId: readRequiredEnv('DEV_AUTH_USER_ID'),
    devUserEmail: readRequiredEnv('DEV_USER_EMAIL'),
    webUrl: process.env.DEV_WEB_URL?.trim() || 'http://localhost:3000/en/machines',
  };
}

async function readSupabasePassword(): Promise<string> {
  const readline = createInterface({ input, output });

  try {
    const password = await readline.question('Supabase password for DEV_USER_EMAIL: ');

    if (!password.trim()) {
      throw new Error('Supabase password is required.');
    }

    return password;
  } finally {
    readline.close();
  }
}

async function requestAccessToken(
  config: DevBrowserSessionConfig,
  password: string,
): Promise<string> {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: config.devUserEmail,
      password,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase password token request failed with ${response.status}: ${responseText}`,
    );
  }

  const responseBody = JSON.parse(responseText) as PasswordGrantResponse;
  const accessToken = responseBody.access_token?.trim();

  if (!accessToken) {
    throw new Error('Supabase password token response did not include access_token.');
  }

  return accessToken;
}

async function verifyAccessToken(
  config: DevBrowserSessionConfig,
  accessToken: string,
): Promise<void> {
  const tokenPayload = decodeJwtPayload(accessToken, 'Supabase access token');

  if (tokenPayload.sub !== config.devAuthUserId) {
    throw new Error(
      `Supabase access token user ${tokenPayload.sub ?? 'missing'} does not match DEV_AUTH_USER_ID ${config.devAuthUserId}.`,
    );
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error(
      `Supabase access token could not be verified: ${error?.message ?? 'missing user'}.`,
    );
  }

  if (data.user.id !== config.devAuthUserId) {
    throw new Error(
      `Verified Supabase user ${data.user.id} does not match DEV_AUTH_USER_ID ${config.devAuthUserId}.`,
    );
  }

  if (tokenPayload.exp) {
    console.info(`Access token expires at ${new Date(tokenPayload.exp * 1000).toISOString()}.`);
  }
}

async function readDevMembership(config: DevBrowserSessionConfig): Promise<DevMembershipRow> {
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
        `Expected exactly one dev membership for ${config.devAuthUserId} in ${config.devOrganizationSlug}, found ${rows.length}. Run pnpm.cmd --filter @buildtrace/db run dev:bootstrap first.`,
      );
    }

    const membership = rows[0];

    if (!membership) {
      throw new Error('Dev membership query returned no row after count validation.');
    }

    return membership;
  } finally {
    await db.$disconnect();
  }
}

function buildBrowserConsoleCommand(input: {
  readonly accessToken: string;
  readonly organizationId: string;
  readonly webUrl: string;
}): string {
  return [
    `document.cookie=${JSON.stringify(`${machineRecordsAccessTokenCookieName}=${input.accessToken}; path=/; SameSite=Lax`)};`,
    `document.cookie=${JSON.stringify(`${machineRecordsOrganizationIdCookieName}=${input.organizationId}; path=/; SameSite=Lax`)};`,
    `location.href=${JSON.stringify(input.webUrl)};`,
  ].join(' ');
}

async function runPowerShellWithStdin(command: string, stdinText: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdoutText = '';
    let stderrText = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutText += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrText += chunk.toString('utf8');
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdoutText);
        return;
      }

      reject(new Error(`PowerShell command failed with exit code ${code}: ${stderrText}`));
    });

    child.stdin.end(stdinText);
  });
}

async function copyToClipboard(text: string): Promise<void> {
  await runPowerShellWithStdin(
    '$value = [Console]::In.ReadToEnd(); Set-Clipboard -Value $value',
    text,
  );

  const clipboardText = await runPowerShellWithStdin('Get-Clipboard -Raw', '');

  if (clipboardText.trimEnd() !== text) {
    throw new Error('Clipboard verification failed. Browser session command was not copied.');
  }
}

async function openBrowser(url: string): Promise<void> {
  await runPowerShellWithStdin(`Start-Process ${JSON.stringify(url)}`, '');
}

async function runDevBrowserSession(): Promise<void> {
  loadRootEnv();

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev browser session bootstrap must not run with NODE_ENV=production.');
  }

  const config = readConfig();
  const password = await readSupabasePassword();
  const accessToken = await requestAccessToken(config, password);

  await verifyAccessToken(config, accessToken);

  const membership = await readDevMembership(config);
  const browserCommand = buildBrowserConsoleCommand({
    accessToken,
    organizationId: membership.organization_id,
    webUrl: config.webUrl,
  });

  await copyToClipboard(browserCommand);
  await openBrowser(config.webUrl);

  console.info(
    `Dev membership ready: ${membership.slug} / ${membership.email} / ${membership.role}.`,
  );
  console.info(
    'Browser session command copied to clipboard and verified without printing the token.',
  );
  console.info(
    `Browser opened at ${config.webUrl}. Paste into the browser console once, then press Enter.`,
  );
}

runDevBrowserSession().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
