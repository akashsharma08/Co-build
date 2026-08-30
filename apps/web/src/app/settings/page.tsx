'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonSpinner, OverlayLoader, PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user, token, loading, logoutAll, setUser } = useAuth();
  const router = useRouter();
  const [passwordMsg, setPasswordMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError('');
    setPasswordMsg('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ message: string }>('/auth/password', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          currentPassword: form.get('currentPassword'),
          newPassword: form.get('newPassword'),
        }),
      });
      setPasswordMsg(result.message);
      event.currentTarget.reset();
      await logoutAll();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password');
    } finally {
      setPending(false);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError('');
    setEmailMsg('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{
        message: string;
        user: NonNullable<typeof user>;
      }>('/auth/email', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          email: form.get('email'),
          currentPassword: form.get('currentPassword'),
        }),
      });
      setUser(result.user);
      setEmailMsg(result.message);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change email');
    } finally {
      setPending(false);
    }
  }

  async function onLogoutAll() {
    setLogoutPending(true);
    try {
      await logoutAll();
      router.replace('/login');
    } finally {
      setLogoutPending(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || deleteConfirm !== 'DELETE') return;
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/auth/account', {
        method: 'DELETE',
        token,
        body: JSON.stringify({
          currentPassword: form.get('currentPassword') || undefined,
        }),
      });
      await logoutAll();
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete account');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <PageLoader label="Loading settings…" />;
  }

  const hasPassword = user.hasPassword !== false;

  return (
    <PageShell
      title="Account settings"
      subtitle="Manage password, email, sessions, and account deletion."
      actions={
        <Link href="/profile" className="btn btn-secondary">
          Back to profile
        </Link>
      }
    >
      {pending || logoutPending ? (
        <OverlayLoader label={logoutPending ? 'Signing out…' : 'Saving…'} />
      ) : null}

      <ScrollPane>
      <div className="grid gap-4 pb-1 lg:grid-cols-2">
        {hasPassword ? (
          <form onSubmit={changePassword} className="card space-y-3 p-3">
            <h2 className="heading-section">
              Change password
            </h2>
            <input
              className="field"
              type="password"
              name="currentPassword"
              placeholder="Current password"
              required
              minLength={8}
            />
            <input
              className="field"
              type="password"
              name="newPassword"
              placeholder="New password (letter + number, 8+)"
              required
              minLength={8}
            />
            {passwordMsg ? (
              <p className="text-sm text-[var(--accent)]">{passwordMsg}</p>
            ) : null}
            <button className="btn btn-primary" disabled={pending}>
              {pending ? (
                <>
                  <ButtonSpinner /> Updating…
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        ) : (
          <div className="card space-y-2 p-3">
            <h2 className="heading-section">
              Password
            </h2>
            <p className="text-sm text-[var(--muted)]">
              This account uses {user.oauthProvider || 'social'} login and has no
              local password.
            </p>
          </div>
        )}

        {hasPassword ? (
          <form onSubmit={changeEmail} className="card space-y-3 p-3">
            <h2 className="heading-section">
              Change email
            </h2>
            <p className="text-sm text-[var(--muted)]">Current: {user.email}</p>
            <input
              className="field"
              type="email"
              name="email"
              placeholder="New email"
              required
            />
            <input
              className="field"
              type="password"
              name="currentPassword"
              placeholder="Current password"
              required
              minLength={8}
            />
            {emailMsg ? (
              <p className="text-sm text-[var(--accent)]">{emailMsg}</p>
            ) : null}
            <button className="btn btn-primary" disabled={pending}>
              Update email
            </button>
          </form>
        ) : null}

        <section className="card space-y-3 p-3">
          <h2 className="heading-section">
            Sessions
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Sign out of every device where you are currently logged in.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void onLogoutAll()}
            disabled={logoutPending}
          >
            Log out of all sessions
          </button>
        </section>

        <form onSubmit={deleteAccount} className="card space-y-3 p-3 lg:col-span-2">
          <h2 className="heading-section text-[#fca5a5]">
            Delete account
          </h2>
          <p className="text-sm text-[var(--muted)]">
            This permanently removes your profile, projects, and applications.
            Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            className="field"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            required
          />
          {hasPassword ? (
            <input
              className="field"
              type="password"
              name="currentPassword"
              placeholder="Current password"
              required
              minLength={8}
            />
          ) : null}
          <button
            className="btn alert-danger-btn"
            disabled={pending || deleteConfirm !== 'DELETE'}
          >
            Delete my account
          </button>
        </form>
      </div>
      {error ? <p className="mt-2 alert-error">{error}</p> : null}
      </ScrollPane>
    </PageShell>
  );
}
