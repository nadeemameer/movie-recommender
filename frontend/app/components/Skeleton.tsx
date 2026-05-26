/**
 * Skeleton placeholders shown while data loads.
 * Uses .skeleton class defined in globals.css.
 */

export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="skeleton" style={{ aspectRatio: '2 / 3', width: '100%' }} />
      <div style={{ padding: '0.75rem' }}>
        <div
          className="skeleton"
          style={{ height: '14px', width: '85%', marginBottom: '0.5rem' }}
        />
        <div className="skeleton" style={{ height: '12px', width: '40%' }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({
  width = '100%',
  height = '14px',
}: {
  width?: string;
  height?: string;
}) {
  return <div className="skeleton" style={{ height, width }} />;
}
