'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ButtonSpinner, OverlayLoader, PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { ApiError, apiFetch, type Project } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    void apiFetch<Project>(`/projects/${params.id}`).then(setProject);
  }, [params.id]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !project) return;
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const updated = await apiFetch<Project>(`/projects/${project.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: form.get('name'),
          shortDescription: form.get('shortDescription'),
          detailedDescription: form.get('detailedDescription'),
          category: form.get('category'),
          stage: form.get('stage'),
          goal: form.get('goal'),
          status: form.get('status'),
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
      router.push(`/projects/${updated.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update project');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user || !project) {
    return <PageLoader label="Loading project editor…" />;
  }

  if (user.id !== project.ownerId) {
    return (
      <PageShell title="Not allowed" subtitle="Only the project owner can edit this listing.">
        <Link href={`/projects/${project.id}`} className="btn btn-secondary">
          Back to project
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Edit project"
      subtitle="Update details, recruitment status, or archive readiness."
      actions={
        <Link href={`/projects/${project.id}`} className="btn btn-secondary">
          Cancel
        </Link>
      }
    >
      {pending ? <OverlayLoader label="Saving project…" /> : null}
      <ScrollPane>
      <form onSubmit={onSubmit} className="card grid gap-2 p-3 md:grid-cols-2">
        <input
          className="field md:col-span-2"
          name="name"
          defaultValue={project.name}
          placeholder="Project name"
          required
        />
        <input
          className="field md:col-span-2"
          name="shortDescription"
          defaultValue={project.shortDescription}
          placeholder="Short description"
          required
          minLength={10}
        />
        <textarea
          className="field md:col-span-2 min-h-36"
          name="detailedDescription"
          defaultValue={project.detailedDescription}
          placeholder="Detailed description"
          required
          minLength={20}
        />
        <input
          className="field"
          name="category"
          defaultValue={project.category}
          placeholder="Category"
          required
        />
        <input
          className="field"
          name="timeCommitment"
          defaultValue={project.timeCommitment}
          placeholder="Time commitment"
          required
        />
        <select className="field" name="stage" defaultValue={project.stage}>
          <option value="idea">Idea</option>
          <option value="planning">Planning</option>
          <option value="development">Development</option>
          <option value="testing">Testing</option>
          <option value="launching">Launching</option>
        </select>
        <select className="field" name="goal" defaultValue={project.goal}>
          <option value="learning">Learning</option>
          <option value="portfolio">Portfolio</option>
          <option value="startup">Startup</option>
          <option value="open_source">Open Source</option>
          <option value="competition">Competition</option>
        </select>
        <select className="field md:col-span-2" name="status" defaultValue={project.status}>
          <option value="open">Open (recruiting)</option>
          <option value="paused">Paused recruitment</option>
          <option value="closed">Closed recruitment</option>
          <option value="archived">Archived</option>
        </select>
        <input
          className="field md:col-span-2"
          name="requiredRoles"
          defaultValue={project.requiredRoles.join(', ')}
          placeholder="Required roles (comma separated)"
          required
        />
        <input
          className="field md:col-span-2"
          name="skills"
          defaultValue={project.skills.join(', ')}
          placeholder="Skills (comma separated)"
          required
        />
        {error ? <p className="alert-error md:col-span-2">{error}</p> : null}
        <button className="btn btn-primary md:col-span-2" disabled={pending}>
          {pending ? (
            <>
              <ButtonSpinner /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </form>
      </ScrollPane>
    </PageShell>
  );
}
