'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLoader } from '@/components/loaders';
import { ScrollPane } from '@/components/page-shell';
import { ApiError, apiFetch, type AuthResponse, type PublicUser } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function AuthCallbackInner() {
  const { acceptSession } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) {
      setError('Missing authentication tokens');
      return;
    }

    void (async () => {
      try {
        const user = await apiFetch<PublicUser>('/auth/me', {
          token: accessToken,
          skipAuthRefresh: true,
        });
        const auth: AuthResponse = {
          accessToken,
          refreshToken,
          expiresIn: '15m',
          tokenType: 'Bearer',
          user,
        };
        await acceptSession(auth);
        router.replace('/dashboard');
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Could not complete sign-in',
        );
      }
    })();
  }, [acceptSession, params, router]);

  if (error) {
    return (
      <ScrollPane className="scroll-pane--center">
        <div className="w-full max-w-lg text-center">
          <p className="alert-error">{error}</p>
          <Link href="/login" className="btn btn-primary mt-4 inline-flex">
            Back to login
          </Link>
        </div>
      </ScrollPane>
    );
  }

  return <PageLoader label="Finishing sign-in…" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<PageLoader label="Finishing sign-in…" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
