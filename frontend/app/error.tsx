'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Next.js App Router automatically renders this when a route segment
 * throws. Wraps the layout's children in an error boundary.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

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
          fontSize: '4rem',
          marginBottom: '0.5rem',
        }}
        aria-hidden
      >
        ⚠️
      </div>
      <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
      <p style={{ color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>
        We hit an unexpected error while rendering this page.
      </p>
      {error.message && (
        <p
          style={{
            color: 'var(--color-text-subtle)',
            fontSize: '0.85rem',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            background: 'var(--color-bg-elevated)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginTop: '1rem',
            textAlign: 'left',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={reset}
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
          Try again
        </button>
        <Link href="/" style={{ textDecoration: 'none' }}>
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
            Go home
          </button>
        </Link>
      </div>
    </main>
  );
}
