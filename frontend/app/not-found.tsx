import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 'var(--page-padding-y) var(--page-padding-x)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          fontWeight: 800,
          lineHeight: 1,
          background:
            'linear-gradient(135deg, var(--color-hero-from) 0%, var(--color-hero-to) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        We can't find what you're looking for. Maybe it was never made.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go home
          </button>
        </Link>
        <Link href="/browse" style={{ textDecoration: 'none' }}>
          <button
            style={{
              background: 'transparent',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Browse movies
          </button>
        </Link>
      </div>
    </main>
  );
}
