'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { OverlayLoader } from '@/components/loaders';
import { useResolvedPageHeader } from '@/components/page-header';
import { SiteHeader } from '@/components/site-header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { guestRoutes } from '@/lib/nav';

const SIDEBAR_VISIBLE_KEY = 'cobuild-sidebar-visible';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, avatarUrl, token, logout, loading, loggingOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [unread, setUnread] = useState(0);
  const isDesktop = useIsDesktop();
  const pageHeader = useResolvedPageHeader(user?.displayName);

  const useSidebar = Boolean(user) && !guestRoutes.has(pathname);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    if (stored === 'false') {
      setSidebarVisible(false);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!token || !useSidebar) {
      setUnread(0);
      return;
    }
    void apiFetch<{ count: number }>('/notifications/unread-count', { token })
      .then((data) => setUnread(data.count))
      .catch(() => setUnread(0));
  }, [token, pathname, useSidebar]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  function handleNavSelect() {
    setMobileOpen(false);
    setSidebarVisible(false);
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, 'false');
  }

  function toggleSidebarVisibility() {
    setSidebarVisible((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(next));
      return next;
    });
  }

  function handleNavToggle() {
    if (isDesktop) {
      toggleSidebarVisibility();
      return;
    }
    setMobileOpen((open) => !open);
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
          unread={unread}
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
