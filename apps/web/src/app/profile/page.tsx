'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { apiFetch, mediaUrl, type Profile } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const availabilityLabels: Record<string, string> = {
  '2-5': '2–5 hrs/week',
  '5-10': '5–10 hrs/week',
  '10-20': '10–20 hrs/week',
  '20+': '20+ hrs/week',
  'full-time': 'Full-time',
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
        {label}
      </p>
      <p className="mt-1.5 capitalize text-[var(--ink)]">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Profile>('/profiles/me', { token })
      .then(setProfile)
      .finally(() => setLoadingProfile(false));
  }, [token]);

  if (loading || !user || loadingProfile || !profile) {
    return <PageLoader label="Loading your profile…" />;
  }

  const avatar = mediaUrl(profile.avatarUrl);
  const initials = user.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <PageShell
      title={user.displayName}
      subtitle={profile.headline || 'Your CoBuild professional profile.'}
      actions={
        <Link href="/profile/edit" className="btn btn-primary">
          Edit profile
        </Link>
      }
    >
      <ScrollPane>
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--glow)_40%,var(--surface))] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="size-16 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-sm">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={`${user.displayName} profile`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-xl text-[var(--accent-glow)]">
                  {initials || '?'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">@{user.username}</p>
              {profile.location ? (
                <p className="mt-2 text-[var(--ink)]">{profile.location}</p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-sm text-[var(--muted)]">
                <span className="capitalize">{profile.experienceLevel}</span>
                <span aria-hidden>·</span>
                <span className="capitalize">{profile.remotePreference}</span>
                <span aria-hidden>·</span>
                <span>
                  {availabilityLabels[profile.availability] ??
                    profile.availability}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-3 py-3 sm:px-4 md:grid-cols-[1.4fr_1fr]">
          <section className="space-y-3">
            <div>
              <h2 className="heading-section">About</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {profile.bio?.trim() || 'No bio yet. Add one from edit profile.'}
              </p>
            </div>

            <div>
              <h2 className="heading-section">Skills</h2>
              {profile.skills.length ? (
                <ul className="mt-2 space-y-1.5">
                  {profile.skills.map((skill) => (
                    <li
                      key={`${skill.name}-${skill.proficiency}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2"
                    >
                      <span className="font-medium text-[var(--ink)]">
                        {skill.name}
                      </span>
                      <span className="text-sm capitalize text-[var(--muted)]">
                        {skill.proficiency}
                        {skill.yearsOfExperience
                          ? ` · ${skill.yearsOfExperience} yrs`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[var(--muted)]">No skills listed yet.</p>
              )}
            </div>
          </section>

          <aside className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Detail label="Visibility" value={profile.visibility} />
              <Detail
                label="Languages"
                value={
                  profile.languages.length
                    ? profile.languages.join(', ')
                    : 'Not set'
                }
              />
            </div>

            <div>
              <p className="eyebrow">Interests</p>
              {profile.interests.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] px-2 py-0.5 text-xs text-[var(--ink)]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[var(--muted)]">No interests listed.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
      </ScrollPane>
    </PageShell>
  );
}
