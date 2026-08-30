import type { NavIcon } from '@/lib/nav';

export function NavIconGlyph({
  name,
  className = 'size-5',
}: {
  name: NavIcon;
  className?: string;
}) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'projects':
      return (
        <svg {...props}>
          <path d="M4 7.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7.5" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M3 7.5h18" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 19.5c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" />
        </svg>
      );
    case 'applications':
      return (
        <svg {...props}>
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-4-2.5L11 20V6a2 2 0 0 0-2-2Z" />
          <path d="M7 8h6" />
        </svg>
      );
    case 'notifications':
      return (
        <svg {...props}>
          <path d="M12 3a4.5 4.5 0 0 0-4.5 4.5v3.2L5 14.5h14l-2.5-3.8V7.5A4.5 4.5 0 0 0 12 3Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      );
  }
}
