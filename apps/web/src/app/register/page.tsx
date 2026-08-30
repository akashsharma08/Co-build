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

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await register({
        email: String(form.get('email')),
        displayName: String(form.get('displayName')),
        username: String(form.get('username')),
        password: String(form.get('password')),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollPane className="scroll-pane--center">
      {pending ? <OverlayLoader label="Creating your account…" /> : null}
      <TiltCard
        as="form"
        onSubmit={onSubmit}
        className="w-full max-w-lg space-y-2 p-3.5"
      >
        <h1 className="heading-page">
          Join CoBuild
        </h1>
        <p className="text-[var(--muted)]">
          Create an account to publish a profile and apply to projects.
        </p>
        <input className="field" name="displayName" placeholder="Display name" required />
        <input className="field" name="username" placeholder="Username" required />
        <input className="field" name="email" type="email" placeholder="Email" required />
        <input
          className="field"
          name="password"
          type="password"
          placeholder="Password (letter + number, 8+)"
          required
          minLength={8}
        />
        {error ? <p className="text-sm alert-error">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? (
            <>
              <ButtonSpinner /> Creating…
            </>
          ) : (
            'Create account'
          )}
        </button>
        <OAuthButtons />
        <p className="text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)]">
            Log in
          </Link>
        </p>
      </TiltCard>
    </ScrollPane>
  );
}
