'use client';

import type { ReactNode } from 'react';
import { PageHeaderSync } from '@/components/page-header';

export function ScrollPane({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`scroll-pane ${className}`.trim()}>{children}</div>
  );
}

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-shell mx-auto w-full max-w-6xl">
      <PageHeaderSync title={title} subtitle={subtitle} actions={actions} />
      <div className="page-shell__body">{children}</div>
    </div>
  );
}
