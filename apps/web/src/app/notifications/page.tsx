'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/loaders';
import { PageShell, ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';
import {
  ApiError,
  apiFetch,
  type NotificationItem,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NotificationsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void apiFetch<NotificationItem[]>('/notifications', { token })
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load'),
      );
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    const updated = await apiFetch<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
      token,
    });
    setItems((current) =>
      current.map((item) => (item.id === id ? updated : item)),
    );
  }

  async function markAllRead() {
    if (!token) return;
    await apiFetch('/notifications/read-all', { method: 'POST', token });
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }

  if (loading || !user) {
    return <PageLoader label="Loading notifications…" />;
  }

  return (
    <PageShell
      title="Notifications"
      subtitle="Application updates and project activity."
      actions={
        <button type="button" className="btn btn-secondary" onClick={() => void markAllRead()}>
          Mark all read
        </button>
      }
    >
      {error ? <p className="shrink-0 alert-error">{error}</p> : null}
      <ScrollPane>
        <div className="space-y-2 pb-1">
        {items.length === 0 ? (
          <p className="text-[var(--muted)]">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <TiltCard
              key={item.id}
              as="article"
              className={`p-3 ${item.readAt ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.link ? (
                    <Link href={item.link} className="btn btn-secondary !px-3 !py-1 text-xs">
                      Open
                    </Link>
                  ) : null}
                  {!item.readAt ? (
                    <button
                      type="button"
                      className="btn btn-secondary !px-3 !py-1 text-xs"
                      onClick={() => void markRead(item.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </TiltCard>
          ))
        )}
        </div>
      </ScrollPane>
    </PageShell>
  );
}
