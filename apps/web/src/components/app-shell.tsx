'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { OverlayLoader } from '@/components/loaders';
import { useResolvedPageHeader } from '@/components/page-header';
import { SiteHeader } from '@/components/site-header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { guestRoutes } from '@/lib/nav';

const SIDEBAR_VISIBLE_KEY = 'cobuild-sidebar-visible';
const SIDEBAR_CHANGE_EVENT = 'cobuild-sidebar-change';

function subscribeSidebarVisibility(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function getSidebarVisibleSnapshot() {
  return localStorage.getItem(SIDEBAR_VISIBLE_KEY) !== 'false';
}

function getSidebarVisibleServerSnapshot() {
  return true;
}

function setSidebarVisiblePreference(next: boolean) {
  localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(next));
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
}

function subscribeDesktop(onStoreChange: () => void) {
  const media = window.matchMedia('(min-width: 1024px)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 1024px)').matches;
}

function getDesktopServerSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
}

function useSidebarVisible() {
  return useSyncExternalStore(
    subscribeSidebarVisibility,
    getSidebarVisibleSnapshot,
    getSidebarVisibleServerSnapshot,
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, avatarUrl, token, logout, loading, loggingOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuForPath, setMobileMenuForPath] = useState<string | null>(
    null,
  );
  const [unread, setUnread] = useState(0);
  const isDesktop = useIsDesktop();
  const sidebarVisible = useSidebarVisible();
  const pageHeader = useResolvedPageHeader(user?.displayName);

  const useSidebar = Boolean(user) && !guestRoutes.has(pathname);
  const mobileOpen = mobileMenuForPath === pathname;
  const displayedUnread = token && useSidebar ? unread : 0;

  useEffect(() => {
    if (!token || !useSidebar) {
      return;
    }

    let cancelled = false;

    void apiFetch<{ count: number }>('/notifications/unread-count', { token })
      .then((data) => {
        if (!cancelled) setUnread(data.count);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });

    return () => {
      cancelled = true;
    };
  }, [token, pathname, useSidebar]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuForPath(null);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  function handleNavSelect() {
    setMobileMenuForPath(null);
    setSidebarVisiblePreference(false);
  }

  function toggleSidebarVisibility() {
    setSidebarVisiblePreference(!sidebarVisible);
  }

  function handleNavToggle() {
    if (isDesktop) {
      toggleSidebarVisibility();
      return;
    }
    setMobileMenuForPath((current) =>
      current === pathname ? null : pathname,
    );
  }

  const toggleLabel =
    (isDesktop && sidebarVisible) || (!isDesktop && mobileOpen)
      ? 'Close menu'
      : 'Open menu';

  const toggleText =
    !isDesktop && mobileOpen
      ? 'Close'
      : !isDesktop || !sidebarVisible
        ? 'Menu'
        : null;

  if (!useSidebar) {
    return (
      <div className="guest-layout">
        {loggingOut ? <OverlayLoader label="Signing you out…" /> : null}
        <SiteHeader />
        <main className="guest-layout__main">{children}</main>
      </div>
    );
  }

  return (
    <>
      {loggingOut ? <OverlayLoader label="Signing you out…" /> : null}
      <div
        className={`app-layout ${sidebarVisible ? '' : 'app-layout--sidebar-hidden'}`}
      >
        <AppSidebar
          unread={displayedUnread}
          mobileOpen={mobileOpen}
          visible={sidebarVisible}
          onClose={handleNavSelect}
          displayName={user!.displayName}
          username={user!.username}
          avatarUrl={avatarUrl}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <div className="app-layout__main">
          <header className="app-topbar">
            <button
              type="button"
              className={`app-topbar__toggle ${!isDesktop && mobileOpen ? 'app-topbar__toggle--open' : ''}`}
              onClick={handleNavToggle}
              aria-label={toggleLabel}
              title={toggleLabel}
            >
              {isDesktop ? (
                sidebarVisible ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
                    <rect
                      x="3"
                      y="4"
                      width="8"
                      height="16"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M14 8l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
                    <rect
                      x="3"
                      y="4"
                      width="8"
                      height="16"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M14 8h5M14 12h5M14 16h5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                )
              ) : (
                <>
                  <span />
                  <span />
                  <span />
                </>
              )}
              {toggleText ? (
                <span className="app-topbar__toggle-text hidden sm:inline">
                  {toggleText}
                </span>
              ) : null}
            </button>
            <div className="app-topbar__title">
              <p className="app-topbar__heading">
                {loading ? 'Loading…' : pageHeader.title}
              </p>
              {pageHeader.subtitle ? (
                <p className="app-topbar__subtitle">{pageHeader.subtitle}</p>
              ) : null}
            </div>
            {pageHeader.actions ? (
              <div className="app-topbar__actions">{pageHeader.actions}</div>
            ) : null}
          </header>

          <main className="app-layout__content">{children}</main>
        </div>
      </div>
    </>
  );
}
