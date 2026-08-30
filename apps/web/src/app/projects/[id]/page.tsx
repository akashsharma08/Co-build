'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';
import { ButtonSpinner, OverlayLoader, PageLoader } from '@/components/loaders';
import {
  ApiError,
  apiFetch,
  type Application,
  type Project,
  type ProjectMember,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

  const isOwner = Boolean(user && project && user.id === project.ownerId);

  useEffect(() => {
    void apiFetch<Project>(`/projects/${params.id}`).then(setProject);
    void apiFetch<ProjectMember[]>(`/projects/${params.id}/members`).then(
      setMembers,
    );
  }, [params.id]);

  useEffect(() => {
    if (!token || !isOwner) return;
    void apiFetch<Application[]>(`/projects/${params.id}/applications`, {
      token,
    }).then(setApplications);
  }, [token, isOwner, params.id]);

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      router.push('/login');
      return;
    }
    setPending(true);
    setError('');
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch(`/projects/${params.id}/applications`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          introduction: form.get('introduction'),
          availability: form.get('availability'),
          skills: String(form.get('skills'))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          portfolioLinks: String(form.get('portfolioLinks'))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      setMessage('Application submitted');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not apply');
    } finally {
      setPending(false);
    }
  }

  async function review(id: string, status: string) {
    if (!token) return;
    const updated = await apiFetch<Application>(`/applications/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
    setApplications((current) =>
      current.map((item) => (item.id === id ? updated : item)),
    );
    if (status === 'accepted') {
      const nextMembers = await apiFetch<ProjectMember[]>(
        `/projects/${params.id}/members`,
      );
      setMembers(nextMembers);
    }
  }

  async function setStatus(status: string) {
    if (!token || !project) return;
    setStatusPending(true);
    setError('');
    try {
      const updated =
        status === 'archived'
          ? await apiFetch<Project>(`/projects/${project.id}/archive`, {
              method: 'POST',
              token,
            })
          : await apiFetch<Project>(`/projects/${project.id}`, {
              method: 'PATCH',
              token,
              body: JSON.stringify({ status }),
            });
      setProject(updated);
      setMessage(`Project marked as ${updated.status}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status');
    } finally {
      setStatusPending(false);
    }
  }

  if (!project) {
    return <PageLoader label="Loading project…" />;
  }

  return (
    <PageShell
      title={project.name}
      subtitle={project.shortDescription}
      actions={
        isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${project.id}/edit`}
              className="btn btn-secondary"
            >
              Edit project
            </Link>
            <Link href="/applications" className="btn btn-secondary">
              Applications hub
            </Link>
          </div>
        ) : null
      }
    >
      {pending || statusPending ? (
        <OverlayLoader
          label={statusPending ? 'Updating project…' : 'Submitting application…'}
        />
      ) : null}
      <ScrollPane>
      <div className="grid gap-2 pb-1 lg:grid-cols-[1.4fr_1fr]">
        <TiltCard as="article" className="space-y-2.5 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-[var(--line)] px-3 py-1 uppercase tracking-wide">
              {project.status}
            </span>
            <span className="text-[var(--muted)]">{project.category}</span>
          </div>
          <p className="whitespace-pre-wrap text-[var(--muted)]">
            {project.detailedDescription}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.requiredRoles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
              >
                {role}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-[var(--glow)] px-3 py-1 text-xs text-[var(--accent-strong)]"
              >
                {skill}
              </span>
            ))}
          </div>
          <dl className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
            <div>
              <dt className="uppercase tracking-wide">Goal</dt>
              <dd className="text-[var(--ink)]">{project.goal}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Stage</dt>
              <dd className="text-[var(--ink)]">{project.stage}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Commitment</dt>
              <dd className="text-[var(--ink)]">{project.timeCommitment}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Owner</dt>
              <dd className="text-[var(--ink)]">
                {project.owner?.displayName ?? 'Unknown'}
              </dd>
            </div>
          </dl>

          {isOwner ? (
            <div className="space-y-2 border-t border-[var(--line)] pt-2.5">
              <h3 className="font-semibold">Recruitment controls</h3>
              <div className="flex flex-wrap gap-2">
                {project.status !== 'open' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void setStatus('open')}
                  >
                    Reopen recruiting
                  </button>
                ) : null}
                {project.status !== 'paused' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void setStatus('paused')}
                  >
                    Pause recruitment
                  </button>
                ) : null}
                {project.status !== 'closed' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void setStatus('closed')}
                  >
                    Close recruitment
                  </button>
                ) : null}
                {project.status !== 'archived' ? (
                  <button
                    type="button"
                    className="btn alert-danger-btn"
                    onClick={() => void setStatus('archived')}
                  >
                    Archive project
                  </button>
                ) : null}
              </div>
              {message ? (
                <p className="text-sm text-[var(--accent)]">{message}</p>
              ) : null}
              {error && isOwner ? (
                <p className="text-sm alert-error">{error}</p>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-2 border-t border-[var(--line)] pt-2.5">
            <h3 className="font-semibold">Team</h3>
            {members.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <span>
                      {member.user?.displayName ?? 'Member'}{' '}
                      <span className="text-[var(--muted)]">
                        @{member.user?.username}
                      </span>
                    </span>
                    <span className="uppercase tracking-wide text-xs text-[var(--muted)]">
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TiltCard>

        <div className="space-y-2">
          {!isOwner ? (
            project.status === 'open' ? (
              <form onSubmit={apply} className="card space-y-2 p-3">
                <h2 className="heading-section">
                  Apply to join
                </h2>
                <textarea
                  className="field min-h-28"
                  name="introduction"
                  placeholder="Introduction"
                  required
                  minLength={20}
                />
                <input
                  className="field"
                  name="skills"
                  placeholder="Relevant skills (comma separated)"
                  required
                />
                <input
                  className="field"
                  name="availability"
                  placeholder="Availability"
                  defaultValue="5-10 hours/week"
                  required
                />
                <input
                  className="field"
                  name="portfolioLinks"
                  placeholder="Portfolio links (comma separated URLs)"
                />
                {error ? <p className="text-sm alert-error">{error}</p> : null}
                {message ? (
                  <p className="text-sm text-[var(--accent)]">{message}</p>
                ) : null}
                <button className="btn btn-primary w-full" disabled={pending}>
                  {pending ? (
                    <>
                      <ButtonSpinner /> Submitting…
                    </>
                  ) : (
                    'Submit application'
                  )}
                </button>
              </form>
            ) : (
              <TiltCard className="p-3 text-sm text-[var(--muted)]">
                This project is not currently accepting applications (
                {project.status}).
              </TiltCard>
            )
          ) : (
            <TiltCard as="section" className="space-y-2 p-3">
              <h2 className="heading-section">
                Applications
              </h2>
              {applications.length === 0 ? (
                <p className="text-[var(--muted)]">No applications yet.</p>
              ) : (
                applications.map((application) => (
                  <TiltCard
                    key={application.id}
                    as="article"
                    className="rounded-lg border border-[var(--line)] p-2.5"
                  >
                    <p className="font-semibold">
                      {application.applicant?.displayName}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {application.introduction}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wide">
                      {application.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['shortlisted', 'accepted', 'rejected'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="btn btn-secondary !px-3 !py-1 text-xs"
                          onClick={() => void review(application.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </TiltCard>
                ))
              )}
            </TiltCard>
          )}
        </div>
      </div>
      </ScrollPane>
    </PageShell>
  );
}
