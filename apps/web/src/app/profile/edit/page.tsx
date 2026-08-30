'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarPicker } from '@/components/avatar-picker';
import { ButtonSpinner, OverlayLoader, PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import {
  ApiError,
  apiFetch,
  apiUpload,
  mediaUrl,
  type Profile,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

const emptyProfile = {
  headline: '',
  bio: '',
  location: '',
  remotePreference: 'flexible',
  experienceLevel: 'beginner',
  languages: '',
  availability: '5-10',
  visibility: 'public',
  skills: '',
  interests: '',
};

export default function EditProfilePage() {
  const { user, token, loading, setAvatarUrl: setSessionAvatar } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(emptyProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Profile>('/profiles/me', { token })
      .then((profile) => {
        setForm({
          headline: profile.headline ?? '',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          remotePreference: profile.remotePreference,
          experienceLevel: profile.experienceLevel,
          languages: profile.languages.join(', '),
          availability: profile.availability,
          visibility: profile.visibility,
          skills: profile.skills
            .map(
              (skill) =>
                `${skill.name}:${skill.proficiency}:${skill.yearsOfExperience}`,
            )
            .join('\n'),
          interests: profile.interests.join(', '),
        });
        setAvatarUrl(mediaUrl(profile.avatarUrl));
        setPendingAvatarBlob(null);
        setAvatarRemoved(false);
      })
      .finally(() => setLoadingProfile(false));
  }, [token]);

  function clearLocalPreview() {
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function stageAvatar(blob: Blob) {
    clearLocalPreview();
    const preview = URL.createObjectURL(blob);
    setLocalPreviewUrl(preview);
    setPendingAvatarBlob(blob);
    setAvatarRemoved(false);
    setAvatarUrl(preview);
    return preview;
  }

  async function stageRemoveAvatar() {
    clearLocalPreview();
    setPendingAvatarBlob(null);
    setAvatarRemoved(true);
    setAvatarUrl(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError('');
    setMessage('');
    try {
      if (avatarRemoved) {
        await apiFetch('/profiles/me/avatar', { method: 'DELETE', token });
        setSessionAvatar(null);
      } else if (pendingAvatarBlob) {
        const body = new FormData();
        body.append('file', pendingAvatarBlob, 'avatar.jpg');
        const profile = await apiUpload<Profile>('/profiles/me/avatar', body, {
          token,
        });
        setSessionAvatar(mediaUrl(profile.avatarUrl));
      }

      const skills = form.skills
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, proficiency = 'intermediate', years = '1'] = line
            .split(':')
            .map((part) => part.trim());
          return {
            name,
            proficiency: proficiency as
              | 'beginner'
              | 'intermediate'
              | 'advanced'
              | 'expert',
            yearsOfExperience: Number(years) || 0,
          };
        });

      await apiFetch('/profiles/me', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          headline: form.headline || undefined,
          bio: form.bio || undefined,
          location: form.location || undefined,
          remotePreference: form.remotePreference,
          experienceLevel: form.experienceLevel,
          languages: form.languages
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          availability: form.availability,
          visibility: form.visibility,
          skills,
          interests: form.interests
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      setMessage('Profile saved');
      router.push('/profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user || loadingProfile) {
    return <PageLoader label="Loading editor…" />;
  }

  return (
    <PageShell
      title="Edit profile"
      subtitle="Update your photo, skills, and collaboration preferences."
      actions={
        <Link href="/profile" className="btn btn-secondary">
          Cancel
        </Link>
      }
    >
      {pending ? <OverlayLoader label="Saving profile…" /> : null}
      <ScrollPane>
      <form onSubmit={onSubmit} className="card grid gap-2.5 p-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <AvatarPicker
            avatarUrl={avatarUrl}
            displayName={user.displayName}
            onUploaded={setAvatarUrl}
            upload={stageAvatar}
            remove={stageRemoveAvatar}
          />
        </div>
        <input
          className="field md:col-span-2"
          placeholder="Headline"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <textarea
          className="field md:col-span-2 min-h-28"
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <input
          className="field"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <select
          className="field"
          value={form.remotePreference}
          onChange={(e) =>
            setForm({ ...form, remotePreference: e.target.value })
          }
        >
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
          <option value="flexible">Flexible</option>
        </select>
        <select
          className="field"
          value={form.experienceLevel}
          onChange={(e) =>
            setForm({ ...form, experienceLevel: e.target.value })
          }
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <select
          className="field"
          value={form.availability}
          onChange={(e) => setForm({ ...form, availability: e.target.value })}
        >
          <option value="2-5">2–5 hrs/week</option>
          <option value="5-10">5–10 hrs/week</option>
          <option value="10-20">10–20 hrs/week</option>
          <option value="20+">20+ hrs/week</option>
          <option value="full-time">Full-time</option>
        </select>
        <input
          className="field md:col-span-2"
          placeholder="Languages (comma separated)"
          value={form.languages}
          onChange={(e) => setForm({ ...form, languages: e.target.value })}
        />
        <textarea
          className="field md:col-span-2 min-h-28"
          placeholder={'Skills, one per line: NestJS:advanced:3'}
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
        />
        <input
          className="field md:col-span-2"
          placeholder="Interests (comma separated)"
          value={form.interests}
          onChange={(e) => setForm({ ...form, interests: e.target.value })}
        />
        <select
          className="field"
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="platform">Platform users only</option>
          <option value="hidden">Hidden from discovery</option>
        </select>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button className="btn btn-primary" disabled={pending}>
            {pending ? (
              <>
                <ButtonSpinner /> Saving…
              </>
            ) : (
              'Save profile'
            )}
          </button>
          <Link href="/profile" className="btn btn-secondary">
            Back to profile
          </Link>
          {message ? <p className="text-[var(--accent)]">{message}</p> : null}
          {error ? <p className="alert-error">{error}</p> : null}
        </div>
      </form>
      </ScrollPane>
    </PageShell>
  );
}
