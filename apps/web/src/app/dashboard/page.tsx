'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';
import { apiFetch, type Application, type Project } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) {
      if (!loading) setBootstrapping(false);
      return;
    }
    void Promise.all([
      apiFetch<Project[]>('/projects/mine', { token }),
      apiFetch<Application[]>('/applications/mine', { token }),
    ])
      .then(([mine, apps]) => {
        setProjects(mine);
        setApplications(apps);
      })
      .finally(() => setBootstrapping(false));
  }, [token, loading]);

  if (loading || !user || bootstrapping) {
    return <PageLoader label="Preparing your dashboard…" />;
  }

  return (
    <PageShell
      title={`Hi, ${user.displayName}`}
      subtitle="Your CoBuild home for profiles, projects, and applications."
      actions={
        <Link href="/projects/new" className="btn btn-primary">
          Create project
        </Link>
      }
    >
      <ScrollPane>
      <div className="card-grid pb-1 md:grid-cols-3">
        <TiltCard as="article" className="p-3">
          <p className="eyebrow">Profile</p>
          <h2 className="heading-section mt-1">
            Complete your profile
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Skills and availability power better project matches.
          </p>
          <Link href="/profile" className="btn btn-secondary mt-3">
            View profile
          </Link>
        </TiltCard>
        <TiltCard as="article" className="p-3">
          <p className="eyebrow">Owned projects</p>
          <h2 className="heading-section mt-1">
            {projects.length}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">Projects you created.</p>
        </TiltCard>
        <TiltCard as="article" className="p-3">
          <p className="eyebrow">Applications</p>
          <h2 className="heading-section mt-1">
            {applications.length}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">Applications you sent.</p>
        </TiltCard>
      </div>
      </ScrollPane>
    </PageShell>
  );
}
