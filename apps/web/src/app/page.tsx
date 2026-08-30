import Link from 'next/link';
import { ScrollPane } from '@/components/page-shell';
import { TiltCard } from '@/components/tilt-card';

export default function HomePage() {
  return (
    <ScrollPane>
      <div className="mx-auto flex w-full max-w-6xl flex-col px-3 py-4 sm:px-4">
        <TiltCard as="section" className="relative overflow-hidden px-4 py-6 sm:px-5">
          <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[var(--accent)]/20 blur-3xl" />
          <p className="eyebrow mb-2">Project partner finder</p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight text-[var(--ink)] sm:text-3xl">
            CoBuild
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Create a profile, discover projects that fit your skills, and apply to
            teams that want to ship together.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Link href="/register" className="btn btn-primary">
              Create account
            </Link>
            <Link href="/projects" className="btn btn-secondary">
              Browse projects
            </Link>
          </div>
        </TiltCard>

        <section className="card-grid mt-3 md:grid-cols-3">
          {[
            [
              '1. Profile',
              'Add skills, availability, and what you want to build.',
            ],
            [
              '2. Discover',
              'Search open projects by role, stack, goal, and stage.',
            ],
            [
              '3. Apply',
              'Send an introduction and join when the owner accepts you.',
            ],
          ].map(([title, copy]) => (
            <TiltCard key={title} as="article" className="p-3">
              <h2 className="heading-section">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy}</p>
            </TiltCard>
          ))}
        </section>
      </div>
    </ScrollPane>
  );
}
