'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Movie = {
  id: number;
  title: string;
  poster_path?: string | null;
  poster_url: string | null;
  release_date?: string;
  vote_average?: number;
};

type Response = {
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
};

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const pageParam = parseInt(params.get('page') ?? '1', 10);

  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/movies/search?q=${encodeURIComponent(q)}&page=${pageParam}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        return json as Response;
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, pageParam]);

  if (!q) {
    return (
      <p style={{ color: '#94a3b8' }}>
        Type a search query in the box above to find movies.
      </p>
    );
  }

  return (
    <>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
          Results for "{q}"
        </h1>
        {data && (
          <p style={{ color: '#94a3b8', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
            {data.total_results.toLocaleString()} matches · page {data.page} of{' '}
            {data.total_pages}
          </p>
        )}
      </header>

      {loading && <SkeletonGrid count={10} />}

      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
        >
          Search failed: {error}
        </div>
      )}

      {data && data.results.length === 0 && (
        <p style={{ color: '#94a3b8' }}>No matches. Try a different query.</p>
      )}

      {data && data.results.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1rem',
            }}
          >
            {data.results.map((m) => (
              <Link
                key={m.id}
                href={`/movie/${m.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <MovieCard movie={m} />
              </Link>
            ))}
          </div>

          <Pagination
            q={q}
            page={data.page}
            totalPages={Math.min(data.total_pages, 500)}
          />
        </>
      )}
    </>
  );
}

function Pagination({
  q,
  page,
  totalPages,
}: {
  q: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const linkStyle: React.CSSProperties = {
    color: '#cbd5e1',
    textDecoration: 'none',
    background: '#1e293b',
    border: '1px solid #334155',
    padding: '0.45rem 0.9rem',
    borderRadius: '0.4rem',
    fontSize: '0.875rem',
  };
  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        marginTop: '2rem',
        alignItems: 'center',
      }}
    >
      <Link
        href={`/search?q=${encodeURIComponent(q)}&page=${prev}`}
        style={{ ...linkStyle, opacity: page <= 1 ? 0.4 : 1 }}
        aria-disabled={page <= 1}
      >
        ← Previous
      </Link>
      <span style={{ color: '#64748b', fontSize: '0.85rem', padding: '0 0.5rem' }}>
        Page {page} / {totalPages}
      </span>
      <Link
        href={`/search?q=${encodeURIComponent(q)}&page=${next}`}
        style={{ ...linkStyle, opacity: page >= totalPages ? 0.4 : 1 }}
        aria-disabled={page >= totalPages}
      >
        Next →
      </Link>
    </nav>
  );
}

export default function SearchPage() {
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'var(--page-padding-y) var(--page-padding-x)',
      }}
    >
      <Suspense fallback={<SkeletonGrid count={10} />}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
