'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageLoader, Spinner } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';
import { apiFetch, type Paginated, type Project } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  const load = useCallback(
    async (search = q, nextSkill = skill, nextRole = role) => {
      setFiltering(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (nextSkill) params.set('skill', nextSkill);
        if (nextRole) params.set('role', nextRole);
        const result = await apiFetch<Paginated<Project>>(
          `/projects?${params.toString()}`,
        );
        setProjects(result.data);
      } finally {
        setLoading(false);
        setFiltering(false);
      }
    },
    [q, skill, role],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await apiFetch<Paginated<Project>>('/projects?');
        if (cancelled) return;
        setProjects(result.data);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoader label="Discovering projects…" />;
  }

  return (
    <PageShell
      title="Discover projects"
      subtitle="Browse open opportunities by skill, role, and focus."
      actions={
        user ? (
          <Link href="/projects/new" className="btn btn-primary">
            Create project
          </Link>
        ) : null
      }
    >
      <form
        className="card grid shrink-0 gap-2 p-2.5 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <input
          className="field"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="field"
          placeholder="Skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
        <input
          className="field"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <button className="btn btn-secondary" disabled={filtering}>
          {filtering ? 'Filtering…' : 'Filter'}
        </button>
      </form>

      {filtering ? (
        <div className="flex shrink-0 justify-center py-2">
          <Spinner label="Refreshing results…" />
        </div>
      ) : null}

      <ScrollPane>
        <div className="card-grid pb-1 md:grid-cols-2">
        {projects.map((project) => (
          <TiltCard
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="heading-section">
                {project.name}
              </h2>
              <span className="rounded-full bg-[var(--glow)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--accent-strong)]">
                {project.stage}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{project.shortDescription}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.skills.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[0.6875rem]"
                >
                  {item}
                </span>
              ))}
            </div>
          </TiltCard>
        ))}
        {projects.length === 0 ? (
          <p className="py-4 text-[var(--muted)]">No open projects yet.</p>
        ) : null}
        </div>
      </ScrollPane>
    </PageShell>
  );
}
