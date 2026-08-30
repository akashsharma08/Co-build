'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch, oauthStartUrl } from '@/lib/api';

type Providers = { google: boolean; github: boolean };

export function OAuthButtons() {
  const [providers, setProviders] = useState<Providers>({
    google: false,
    github: false,
  });

  useEffect(() => {
    void apiFetch<Providers>('/auth/providers')
      .then(setProviders)
      .catch(() => setProviders({ google: false, github: false }));
  }, []);

  if (!providers.google && !providers.github) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        Or continue with
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {providers.google ? (
          <Link href={oauthStartUrl('google')} className="btn btn-secondary w-full">
            Google
          </Link>
        ) : null}
        {providers.github ? (
          <Link href={oauthStartUrl('github')} className="btn btn-secondary w-full">
            GitHub
          </Link>
        ) : null}
      </div>
    </div>
  );
}
