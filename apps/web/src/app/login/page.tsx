'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';
import { ButtonSpinner, OverlayLoader } from '@/components/loaders';
import { OAuthButtons } from '@/components/oauth-buttons';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollPane className="scroll-pane--center">
      {pending ? <OverlayLoader label="Signing you in…" /> : null}
      <TiltCard as="form" onSubmit={onSubmit} className="w-full max-w-lg space-y-2 p-3.5">
        <h1 className="heading-page">
          Welcome back
        </h1>
        <input className="field" name="email" type="email" placeholder="Email" required />
        <input
          className="field"
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        {error ? <p className="text-sm alert-error">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? (
            <>
              <ButtonSpinner /> Signing in…
            </>
          ) : (
            'Log in'
          )}
        </button>
        <OAuthButtons />
        <p className="text-sm text-[var(--muted)]">
          New here?{' '}
          <Link href="/register" className="text-[var(--accent)]">
            Create an account
          </Link>
        </p>
      </TiltCard>
    </ScrollPane>
  );
}
