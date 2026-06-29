import { appMessages, isSupportedLocale } from '@buildtrace/i18n';
import { notFound } from 'next/navigation';

import { readMachineRecordsSession } from '@/machine-records-session';
import { signInAction, signOutAction, signUpAction } from './actions';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    signup?: string | readonly string[];
    signupError?: string | readonly string[];
    signinError?: string | readonly string[];
    signedOut?: string | readonly string[];
  }>;
};

function readSearchParam(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;

    return firstValue;
  }

  return undefined;
}

function renderFeedbackPanel({
  tone,
  title,
  body,
}: {
  readonly tone: 'success' | 'error';
  readonly title: string;
  readonly body: string;
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-100'
      : 'border-red-500/40 bg-red-950/20 text-red-100';

  return (
    <section className={`rounded-lg border p-5 ${className}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </section>
  );
}

function renderTextInput({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  readonly label: string;
  readonly name: string;
  readonly type?: string;
  readonly autoComplete: string;
  readonly placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-stone-200">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-h-11 rounded-md border border-stone-700 bg-black px-3 py-2 text-sm font-normal text-white outline-none transition placeholder:text-stone-600 focus:border-emerald-400"
      />
    </label>
  );
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = appMessages[locale].pages.login;
  const session = await readMachineRecordsSession();
  const signupStatus = readSearchParam(resolvedSearchParams.signup);
  const signupError = readSearchParam(resolvedSearchParams.signupError);
  const signinError = readSearchParam(resolvedSearchParams.signinError);
  const signedOut = readSearchParam(resolvedSearchParams.signedOut);
  const boundSignUpAction = signUpAction.bind(null, locale);
  const boundSignInAction = signInAction.bind(null, locale);
  const boundSignOutAction = signOutAction.bind(null, locale);

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 md:py-16 lg:grid-cols-[0.78fr_1fr] lg:items-start">
      <section aria-labelledby="login-title" className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
          {messages.eyebrow}
        </p>
        <h1
          id="login-title"
          className="mt-4 text-4xl font-semibold tracking-normal text-white md:text-5xl"
        >
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{messages.description}</p>

        {session.status === 'ready' ? (
          <form action={boundSignOutAction} className="mt-6">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md border border-stone-700 px-5 py-2 text-sm font-semibold text-stone-100 transition hover:border-emerald-400 hover:text-white"
            >
              Sign out
            </button>
          </form>
        ) : null}
      </section>

      <section aria-label="BuildTrace authentication" className="grid gap-5">
        {signupStatus === 'check-email'
          ? renderFeedbackPanel({
              tone: 'success',
              title: 'Check your email',
              body: 'Confirm the Supabase email link, then sign in below to create your BuildTrace organisation.',
            })
          : null}

        {signupStatus === 'confirmed'
          ? renderFeedbackPanel({
              tone: 'success',
              title: 'Email confirmed',
              body: 'Sign in with the same email and password to open your workspace.',
            })
          : null}

        {signedOut
          ? renderFeedbackPanel({
              tone: 'success',
              title: 'Signed out',
              body: 'Your BuildTrace workspace session was cleared on this device.',
            })
          : null}

        {signupError
          ? renderFeedbackPanel({
              tone: 'error',
              title: 'Account could not be created',
              body: signupError,
            })
          : null}

        {signinError
          ? renderFeedbackPanel({
              tone: 'error',
              title: 'Workspace could not be opened',
              body: signinError,
            })
          : null}

        <form
          action={boundSignUpAction}
          className="rounded-lg border border-stone-800 bg-neutral-900/70 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
            New account
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
            Create your login
          </h2>

          <div className="mt-6 grid gap-4">
            {renderTextInput({
              label: 'Name',
              name: 'displayName',
              autoComplete: 'name',
              placeholder: 'Chander Singh',
            })}
            {renderTextInput({
              label: 'Email',
              name: 'email',
              type: 'email',
              autoComplete: 'email',
              placeholder: 'you@company.com',
            })}
            {renderTextInput({
              label: 'Password',
              name: 'password',
              type: 'password',
              autoComplete: 'new-password',
              placeholder: 'At least 8 characters',
            })}
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Sign up
          </button>
        </form>

        <form
          action={boundSignInAction}
          className="rounded-lg border border-emerald-500/20 bg-neutral-900/80 p-5 shadow-2xl shadow-emerald-950/30 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
            Workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-white">
            Sign in and create organisation
          </h2>

          <div className="mt-6 grid gap-4">
            {renderTextInput({
              label: 'Name',
              name: 'displayName',
              autoComplete: 'name',
              placeholder: 'Chander Singh',
            })}
            {renderTextInput({
              label: 'Email',
              name: 'email',
              type: 'email',
              autoComplete: 'email',
              placeholder: 'you@company.com',
            })}
            {renderTextInput({
              label: 'Password',
              name: 'password',
              type: 'password',
              autoComplete: 'current-password',
              placeholder: 'Your password',
            })}
            {renderTextInput({
              label: 'Organisation name',
              name: 'organizationName',
              autoComplete: 'organization',
              placeholder: 'BuildTrace Demo',
            })}
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-emerald-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Open workspace
          </button>
        </form>
      </section>
    </div>
  );
}
