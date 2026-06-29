'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { machineRecordsSessionCookieNames } from '@/machine-records-session';

type SupabasePasswordSession = {
  readonly access_token: string;
};

type AuthSessionResponse = {
  readonly session: {
    readonly organizationId: string;
  };
};

type CookieSameSite = 'lax';

const sessionCookieMaxAgeSeconds = 60 * 60 * 24 * 7;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function normalizeLocale(locale: string): string {
  const normalizedLocale = locale.trim();

  return normalizedLocale || 'en';
}

function readRequiredFormText(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);

  if (typeof value !== 'string') {
    throw new Error(`${label} is required.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

function readPassword(formData: FormData): string {
  const password = readRequiredFormText(formData, 'password', 'Password');

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  return password;
}

function buildLoginRedirect(locale: string, queryName: string, message: string): never {
  redirect(`/${locale}/login?${queryName}=${encodeURIComponent(message)}`);
}

function getSupabaseAuthHeaders(): HeadersInit {
  const anonKey = readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
    'content-type': 'application/json',
  };
}

function buildSupabaseAuthUrl(path: string): URL {
  return new URL(path, readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'));
}

function buildAppUrl(path: string): string {
  const appBaseUrl = readRequiredEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');

  return `${appBaseUrl}${path}`;
}

function buildApiUrl(path: string): URL {
  return new URL(path, readRequiredEnv('NEXT_PUBLIC_API_URL'));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown authentication error.';
}

async function readErrorResponse(response: Response): Promise<string> {
  const fallback = `Request failed with ${response.status}.`;

  try {
    const body = (await response.json()) as Record<string, unknown>;
    const message = body.msg ?? body.message ?? body.error_description ?? body.error;

    return typeof message === 'string' && message.trim() ? message.trim() : fallback;
  } catch {
    return fallback;
  }
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  throw new Error(await readErrorResponse(response));
}

async function signUpWithSupabase({
  email,
  password,
  displayName,
  locale,
}: {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly locale: string;
}): Promise<void> {
  const response = await fetch(buildSupabaseAuthUrl('/auth/v1/signup'), {
    method: 'POST',
    headers: getSupabaseAuthHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: {
        display_name: displayName,
      },
      email_redirect_to: buildAppUrl(`/${locale}/login?signup=confirmed`),
    }),
  });

  await assertOk(response);
}

async function signInWithSupabase({
  email,
  password,
}: {
  readonly email: string;
  readonly password: string;
}): Promise<SupabasePasswordSession> {
  const response = await fetch(buildSupabaseAuthUrl('/auth/v1/token?grant_type=password'), {
    method: 'POST',
    headers: getSupabaseAuthHeaders(),
    body: JSON.stringify({
      email,
      password,
    }),
  });

  await assertOk(response);

  const session = (await response.json()) as Partial<SupabasePasswordSession>;

  if (!session.access_token) {
    throw new Error('Supabase did not return an access token.');
  }

  return {
    access_token: session.access_token,
  };
}

async function onboardAppSession({
  accessToken,
  organizationName,
  displayName,
}: {
  readonly accessToken: string;
  readonly organizationName: string;
  readonly displayName?: string;
}): Promise<AuthSessionResponse> {
  const response = await fetch(buildApiUrl('/auth/onboard'), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      organizationName,
      ...(displayName ? { displayName } : {}),
    }),
  });

  await assertOk(response);

  return (await response.json()) as AuthSessionResponse;
}

async function setWorkspaceCookies({
  organizationId,
  accessToken,
}: {
  readonly organizationId: string;
  readonly accessToken: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const sameSite: CookieSameSite = 'lax';
  const options = {
    httpOnly: true,
    maxAge: sessionCookieMaxAgeSeconds,
    path: '/',
    sameSite,
    secure,
  };

  cookieStore.set(machineRecordsSessionCookieNames.organizationId, organizationId, options);
  cookieStore.set(machineRecordsSessionCookieNames.accessToken, accessToken, options);
}

async function clearWorkspaceCookies(): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    maxAge: 0,
    path: '/',
  };

  cookieStore.set(machineRecordsSessionCookieNames.organizationId, '', options);
  cookieStore.set(machineRecordsSessionCookieNames.accessToken, '', options);
}

export async function signUpAction(locale: string, formData: FormData): Promise<void> {
  const redirectLocale = normalizeLocale(locale);

  try {
    await signUpWithSupabase({
      locale: redirectLocale,
      email: readRequiredFormText(formData, 'email', 'Email').toLowerCase(),
      password: readPassword(formData),
      displayName: readRequiredFormText(formData, 'displayName', 'Name'),
    });
  } catch (error) {
    buildLoginRedirect(redirectLocale, 'signupError', getErrorMessage(error));
  }

  redirect(`/${redirectLocale}/login?signup=check-email`);
}

export async function signInAction(locale: string, formData: FormData): Promise<void> {
  const redirectLocale = normalizeLocale(locale);

  try {
    const email = readRequiredFormText(formData, 'email', 'Email').toLowerCase();
    const password = readPassword(formData);
    const organizationName = readRequiredFormText(
      formData,
      'organizationName',
      'Organization name',
    );
    const displayName = readRequiredFormText(formData, 'displayName', 'Name');
    const { access_token: accessToken } = await signInWithSupabase({
      email,
      password,
    });
    const authSession = await onboardAppSession({
      accessToken,
      organizationName,
      displayName,
    });

    await setWorkspaceCookies({
      accessToken,
      organizationId: authSession.session.organizationId,
    });
  } catch (error) {
    buildLoginRedirect(redirectLocale, 'signinError', getErrorMessage(error));
  }

  redirect(`/${redirectLocale}/machines?session=ready`);
}

export async function signOutAction(locale: string): Promise<void> {
  const redirectLocale = normalizeLocale(locale);

  await clearWorkspaceCookies();

  redirect(`/${redirectLocale}/login?signedOut=true`);
}
