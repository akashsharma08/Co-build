'use client';

type LoaderProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ label, size = 'md', className = '' }: LoaderProps) {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`${sizes[size]} animate-spin rounded-full border-[var(--line)] border-t-[var(--accent)]`}
      />
      {label ? (
        <span className="text-sm font-medium tracking-wide text-[var(--muted)]">
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

export function PageLoader({ label = 'Loading CoBuild…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center px-4">
      <div className="card relative overflow-hidden px-5 py-6">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-[var(--glow)]">
          <div className="loader-shimmer h-full w-1/2 bg-[var(--accent)]" />
        </div>
        <Spinner size="lg" label={label} />
      </div>
    </div>
  );
}

export function ButtonSpinner() {
  return (
    <span
      className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}

export function OverlayLoader({ label = 'Working…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(2,6,14,0.72)] backdrop-blur-[3px]">
      <div className="card px-5 py-6 shadow-xl">
        <Spinner size="lg" label={label} />
      </div>
    </div>
  );
}
