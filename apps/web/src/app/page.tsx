export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 sm:px-10">
      <div className="mb-14 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
          C
        </span>
        <span className="text-lg font-semibold tracking-tight">CoBuild</span>
      </div>

      <div className="max-w-3xl">
        <p className="mb-5 font-mono text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">
          Project partner finder
        </p>
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-7xl">
          Find your people.
          <br />
          Build what matters.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          The foundation is ready for profiles, project discovery, applications,
          and collaboration features.
        </p>
      </div>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          ['Frontend', 'Next.js 16 · React 19 · Tailwind CSS'],
          ['Backend', 'NestJS 11 · REST · OpenAPI'],
          ['Data', 'PostgreSQL · TypeORM · Migrations'],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-indigo-600">{label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
