'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MovieCard from '../../components/MovieCard';
import { SkeletonGrid } from '../../components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Genre = { id: number; name: string };

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

function BrowseGenreInner({ genreId }: { genreId: number }) {
  const params = useSearchParams();
  const pageParam = parseInt(params.get('page') ?? '1', 10);

  const [genreName, setGenreName] = useState<string>('');
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/movies/genres`)
      .then((r) => r.json())
      .then((d) => {
        const g = (d.genres ?? []).find((x: Genre) => x.id === genreId);
        if (g) setGenreName(g.name);
      })
      .catch(() => {});
  }, [genreId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/movies/browse?genre=${genreId}&page=${pageParam}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        return json as Response;
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [genreId, pageParam]);

  return (
    <>
      <header style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/browse"
          style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← All genres
        </Link>
        <h1 style={{ fontSize: '2rem', margin: '0.75rem 0 0.25rem' }}>
          {genreName || 'Genre'}
        </h1>
        {data && (
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            {data.total_results.toLocaleString()} movies · page {data.page} of{' '}
            {Math.min(data.total_pages, 500)}
          </p>
        )}
      </header>

      {loading && !data && <SkeletonGrid count={12} />}

      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
        >
          Couldn't load: {error}
        </div>
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
            genreId={genreId}
            page={data.page}
            totalPages={Math.min(data.total_pages, 500)}
          />
        </>
      )}
    </>
  );
}

function Pagination({
  genreId,
  page,
  totalPages,
}: {
  genreId: number;
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
        href={`/browse/${genreId}?page=${prev}`}
        style={{ ...linkStyle, opacity: page <= 1 ? 0.4 : 1 }}
      >
        ← Previous
      </Link>
      <span style={{ color: '#64748b', fontSize: '0.85rem', padding: '0 0.5rem' }}>
        Page {page} / {totalPages}
      </span>
      <Link
        href={`/browse/${genreId}?page=${next}`}
        style={{ ...linkStyle, opacity: page >= totalPages ? 0.4 : 1 }}
      >
        Next →
      </Link>
    </nav>
  );
}

export default function BrowseGenrePage({
  params,
}: {
  params: { genreId: string };
}) {
  const id = Number(params.genreId);
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'var(--page-padding-y) var(--page-padding-x)',
      }}
    >
      <Suspense fallback={<SkeletonGrid count={12} />}>
        <BrowseGenreInner genreId={id} />
      </Suspense>
    </main>
  );
}
