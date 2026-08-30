'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { appNavLinks } from '@/lib/nav';

export type PageHeaderState = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

type PageHeaderContextValue = {
  header: PageHeaderState;
  setHeader: (header: PageHeaderState) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState>({});

  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider');
  }
  return context;
}

export function PageHeaderSync({
  title,
  subtitle,
  actions,
}: PageHeaderState) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader({ title, subtitle, actions });
    return () => setHeader({});
  }, [title, subtitle, actions, setHeader]);

  return null;
}

export function useResolvedPageHeader(displayName?: string) {
  const { header } = usePageHeader();
  const pathname = usePathname();

  if (header.title) {
    return header;
  }

  return getDefaultHeader(pathname, displayName);
}

function getDefaultHeader(
  pathname: string,
  displayName?: string,
): PageHeaderState {
  if (pathname === '/dashboard') {
    return {
      title: displayName ? `Hi, ${displayName}` : 'Dashboard',
      subtitle: 'Your CoBuild home for profiles, projects, and applications.',
    };
  }

  if (pathname === '/projects/new') {
    return {
      title: 'Create a project',
      subtitle: 'Describe the idea, stage, and teammates you need.',
    };
  }

  if (pathname === '/profile/edit') {
    return {
      title: 'Edit profile',
      subtitle: 'Update your photo, skills, and collaboration preferences.',
    };
  }

  if (pathname.endsWith('/edit') && pathname.startsWith('/projects/')) {
    return {
      title: 'Edit project',
      subtitle: 'Update details, recruitment status, or archive readiness.',
    };
  }

  const navLink = appNavLinks.find((link) => {
    if (link.href === '/dashboard') return pathname === link.href;
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  });

  if (navLink) {
    return {
      title: navLink.label,
      subtitle: navLink.description,
    };
  }

  return { title: 'CoBuild' };
}
