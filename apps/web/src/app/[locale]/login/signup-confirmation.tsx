'use client';

import { useEffect, useRef, useState } from 'react';

import { readSupabaseConfirmationFragment } from '@/signup-confirmation';
import { completeSignUpAction } from './actions';

type ConfirmationState =
  | { readonly status: 'confirming' }
  | { readonly status: 'error'; readonly message: string };

export function SignUpConfirmation({ locale }: { readonly locale: string }) {
  const started = useRef(false);
  const [state, setState] = useState<ConfirmationState>({ status: 'confirming' });

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;
    const confirmation = readSupabaseConfirmationFragment(window.location.hash);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    if (confirmation.status === 'error') {
      queueMicrotask(() => setState(confirmation));
      return;
    }

    void completeSignUpAction(confirmation.accessToken)
      .then((result) => {
        if (result.status === 'error') {
          setState(result);
          return;
        }

        window.location.replace(`/${encodeURIComponent(locale)}/machines?session=ready`);
      })
      .catch(() => {
        setState({
          status: 'error',
          message:
            'Your email was confirmed, but the workspace could not be opened. Please sign in.',
        });
      });
  }, [locale]);

  const isError = state.status === 'error';

  return (
    <section
      aria-live="polite"
      className={`rounded-lg border p-5 ${
        isError
          ? 'border-red-500/40 bg-red-950/20 text-red-100'
          : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-100'
      }`}
    >
      <p className="text-sm font-semibold">
        {isError ? 'Confirmation could not be completed' : 'Email confirmed'}
      </p>
      <p className="mt-2 text-sm leading-6">
        {isError ? state.message : 'Opening your BuildTrace workspace...'}
      </p>
    </section>
  );
}
