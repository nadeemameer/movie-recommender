'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Genre = { id: number; name: string };

// Vibrant tile colors so the page doesn't feel monotone
const TILE_COLORS = [
  ['#1e3a8a', '#312e81'],
  ['#7c2d12', '#9a3412'],
  ['#14532d', '#166534'],
  ['#581c87', '#6b21a8'],
  ['#7f1d1d', '#991b1b'],
  ['#0c4a6e', '#075985'],
  ['#854d0e', '#a16207'],
  ['#831843', '#9d174d'],
  ['#365314', '#3f6212'],
  ['#0f172a', '#1e293b'],
];

export default function BrowsePage() {
  const [genres, setGenres] = useState<Genre[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/movies/genres`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return json;
      })
      .then((data) => setGenres(data.genres ?? []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Browse by Genre</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          Pick a genre to explore what's popular.
        </p>
      </header>

      {error && <p style={{ color: '#f87171' }}>Couldn't load genres: {error}</p>}
      {!error && !genres && <p style={{ color: '#94a3b8' }}>Loading genres…</p>}

      {genres && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {genres.map((g, i) => {
            const [c1, c2] = TILE_COLORS[i % TILE_COLORS.length];
            return (
              <Link
                key={g.id}
                href={`/browse/${g.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                    color: '#fff',
                    aspectRatio: '5 / 3',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-end',
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {g.name}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
