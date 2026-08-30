'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appNavLinks } from '@/lib/nav';
import { NavIconGlyph } from '@/components/nav-icon';

type AppSidebarProps = {
  unread: number;
  mobileOpen: boolean;
  visible: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  onLogout: () => void;
  loggingOut: boolean;
};

function SidebarAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className="relative size-8 shrink-0 overflow-hidden rounded-full border border-white/20 bg-[var(--glow)] shadow-inner">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-sm font-semibold text-[var(--accent-glow)]">
          {initials || '?'}
        </span>
      )}
    </span>
  );
}

export function AppSidebar({
  unread,
  mobileOpen,
  visible,
  onClose,
  displayName,
  username,
  avatarUrl,
  onLogout,
  loggingOut,
}: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'sidebar-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={`app-sidebar ${mobileOpen ? 'app-sidebar--open' : ''} ${
          visible ? '' : 'app-sidebar--desktop-hidden'
        }`}
        aria-label="Main navigation"
        aria-hidden={!visible && !mobileOpen}
      >
        <div className="app-sidebar__glow" aria-hidden />

        <div className="app-sidebar__inner">
          <div className="app-sidebar__header">
            <Link href="/dashboard" className="app-sidebar__brand" onClick={onClose}>
              <span className="app-sidebar__logo">C</span>
              <div>
                <span className="app-sidebar__title">CoBuild</span>
                <span className="app-sidebar__tagline">Build together</span>
              </div>
            </Link>
          </div>

          <nav className="app-sidebar__nav">
            {appNavLinks.map((link, index) => {
              const active = isActive(link.href);
              const badge =
                'badge' in link && link.badge && unread > 0
                  ? unread > 9
                    ? '9+'
                    : unread
                  : null;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`sidebar-nav-item ${active ? 'sidebar-nav-item--active' : ''}`}
                  style={{ animationDelay: `${80 + index * 55}ms` }}
                >
                  <span className="sidebar-nav-item__icon">
                    <NavIconGlyph name={link.icon} />
                  </span>
                  <span className="sidebar-nav-item__copy">
                    <span className="sidebar-nav-item__label">{link.label}</span>
                    <span className="sidebar-nav-item__desc">{link.description}</span>
                  </span>
                  {badge ? (
                    <span className="sidebar-nav-item__badge">{badge}</span>
                  ) : null}
                  {active ? (
                    <span className="sidebar-nav-item__active-glow" aria-hidden />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="app-sidebar__footer">
            <Link
              href="/profile"
              className="app-sidebar__user"
              onClick={onClose}
            >
              <SidebarAvatar displayName={displayName} avatarUrl={avatarUrl} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{displayName}</p>
                <p className="truncate text-xs text-white/55">@{username}</p>
              </div>
            </Link>
            <button
              type="button"
              className="app-sidebar__logout"
              onClick={() => void onLogout()}
              disabled={loggingOut}
            >
              {loggingOut ? 'Signing out…' : 'Log out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
