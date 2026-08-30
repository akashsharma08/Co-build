export const appNavLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    description: 'Your overview',
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: 'projects',
    description: 'Browse & create',
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: 'profile',
    description: 'Your presence',
  },
  {
    href: '/applications',
    label: 'Applications',
    icon: 'applications',
    description: 'Track requests',
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: 'notifications',
    description: 'Stay updated',
    badge: true,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Account & security',
  },
] as const;

export type NavIcon = (typeof appNavLinks)[number]['icon'];

export const guestRoutes = new Set([
  '/',
  '/login',
  '/register',
  '/auth/callback',
]);
