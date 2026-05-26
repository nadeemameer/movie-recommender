'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Movie = {
  id: number;
  title: string;
  poster_url: string | null;
  release_date?: string;
  vote_average?: number;
};

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounce: only fire fetch 250ms after last keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch when debounced query changes
  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/movies/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults((data.results ?? []).slice(0, 6));
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
      <form onSubmit={onSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search movies…"
          style={{
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#f1f5f9',
            padding: '0.45rem 0.75rem',
            borderRadius: '0.4rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      </form>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.4rem)',
            left: 0,
            right: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        >
          {loading && results.length === 0 && (
            <p style={{ color: '#94a3b8', padding: '0.75rem', margin: 0, fontSize: '0.85rem' }}>
              Searching…
            </p>
          )}

          {!loading && results.length === 0 && (
            <p style={{ color: '#94a3b8', padding: '0.75rem', margin: 0, fontSize: '0.85rem' }}>
              No matches.
            </p>
          )}

          {results.map((m) => (
            <Link
              key={m.id}
              href={`/movie/${m.id}`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                textDecoration: 'none',
                color: '#f1f5f9',
                borderBottom: '1px solid #0f172a',
              }}
            >
              <div
                style={{
                  width: 36,
                  minWidth: 36,
                  aspectRatio: '2 / 3',
                  background: '#0f172a',
                  borderRadius: '0.3rem',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {m.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.poster_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.title}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {m.release_date ? m.release_date.slice(0, 4) : ''}
                  {m.vote_average ? ` · ★ ${m.vote_average.toFixed(1)}` : ''}
                </div>
              </div>
            </Link>
          ))}

          {results.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              style={{
                width: '100%',
                background: '#0b1220',
                color: '#60a5fa',
                border: 'none',
                padding: '0.55rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              See all results for "{query.trim()}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
