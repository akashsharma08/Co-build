'use client';

import Link from 'next/link';
import { OverlayLoader } from '@/components/loaders';
import { useAuth } from '@/lib/auth';

export function SiteHeader() {
  const { user, logout, loading, loggingOut } = useAuth();

  return (
    <>
      {loggingOut ? <OverlayLoader label="Signing you out…" /> : null}
      <header className="border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_90%,transparent)] backdrop-blur">
        <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-[var(--accent-glow)] to-[var(--accent-strong)] font-[family-name:var(--font-display)] text-sm text-white shadow-[0_0_16px_rgba(59,130,246,0.35)]">
              C
            </span>
            <span className="font-[family-name:var(--font-display)] text-base tracking-tight">
              CoBuild
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {loading ? (
              <span className="h-4 w-16 animate-pulse rounded-full bg-[var(--line)]" />
            ) : user ? (
              <Link href="/dashboard" className="btn btn-primary !px-3 !py-1.5 text-sm">
                Open app
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
