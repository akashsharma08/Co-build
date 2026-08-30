'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { apiFetch, type Application } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ApplicationsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Application[]>('/applications/mine', { token })
      .then(setApplications)
      .finally(() => setLoadingApps(false));
  }, [token]);

  if (loading || !user || loadingApps) {
    return <PageLoader label="Loading your applications…" />;
  }

  return (
    <PageShell
      title="My applications"
      subtitle="Track the projects you asked to join."
    >
      <ScrollPane>
        <div className="space-y-3 pb-1">
        {applications.map((application) => (
          <article key={application.id} className="card p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="heading-section">
                  {application.project?.name ?? 'Project'}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {application.introduction}
                </p>
              </div>
              <span className="rounded-full bg-[var(--glow)] px-2 py-0.5 text-[0.6875rem] uppercase tracking-wide text-[var(--accent-glow)]">
                {application.status}
              </span>
            </div>
            {application.projectId ? (
              <Link
                href={`/projects/${application.projectId}`}
                className="btn btn-secondary mt-2"
              >
                View project
              </Link>
            ) : null}
          </article>
        ))}
        {applications.length === 0 ? (
          <p className="text-[var(--muted)]">
            No applications yet. Browse projects and apply.
          </p>
        ) : null}
        </div>
      </ScrollPane>
    </PageShell>
  );
}
