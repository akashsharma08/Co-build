'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonSpinner, OverlayLoader, PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NewProjectPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const project = await apiFetch<{ id: string }>('/projects', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: form.get('name'),
          shortDescription: form.get('shortDescription'),
          detailedDescription: form.get('detailedDescription'),
          category: form.get('category'),
          stage: form.get('stage'),
          goal: form.get('goal'),
          requiredRoles: String(form.get('requiredRoles'))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          skills: String(form.get('skills'))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          timeCommitment: form.get('timeCommitment'),
        }),
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create project');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <PageLoader label="Opening project studio…" />;
  }

  return (
    <PageShell
      title="Create a project"
      subtitle="Describe the idea, stage, and teammates you need."
    >
      {pending ? <OverlayLoader label="Publishing project…" /> : null}
      <ScrollPane>
      <form onSubmit={onSubmit} className="card grid gap-2 p-3 md:grid-cols-2">
        <input className="field md:col-span-2" name="name" placeholder="Project name" required />
        <input
          className="field md:col-span-2"
          name="shortDescription"
          placeholder="Short description"
          required
          minLength={10}
        />
        <textarea
          className="field md:col-span-2 min-h-36"
          name="detailedDescription"
          placeholder="Detailed description"
          required
          minLength={20}
        />
        <input className="field" name="category" placeholder="Category" required />
        <input
          className="field"
          name="timeCommitment"
          placeholder="Time commitment"
          defaultValue="5-10 hours/week"
          required
        />
        <select className="field" name="stage" defaultValue="idea">
          <option value="idea">Idea</option>
          <option value="planning">Planning</option>
          <option value="development">Development</option>
          <option value="testing">Testing</option>
          <option value="launching">Launching</option>
        </select>
        <select className="field" name="goal" defaultValue="learning">
          <option value="learning">Learning</option>
          <option value="portfolio">Portfolio</option>
          <option value="startup">Startup</option>
          <option value="open_source">Open Source</option>
          <option value="competition">Competition</option>
        </select>
        <input
          className="field md:col-span-2"
          name="requiredRoles"
          placeholder="Required roles (comma separated)"
          required
        />
        <input
          className="field md:col-span-2"
          name="skills"
          placeholder="Skills (comma separated)"
          required
        />
        {error ? <p className="alert-error md:col-span-2">{error}</p> : null}
        <button className="btn btn-primary md:col-span-2" disabled={pending}>
          {pending ? (
            <>
              <ButtonSpinner /> Publishing…
            </>
          ) : (
            'Publish project'
          )}
        </button>
      </form>
      </ScrollPane>
    </PageShell>
  );
}
