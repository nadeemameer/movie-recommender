'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { useFavorites } from '../lib/FavoritesContext';
import { loadPreferences, Preferences } from '../lib/preferences';
import MovieRail from './components/MovieRail';

type Movie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  poster_url: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  score?: number;
};

type RecResponse = {
  recommendations: Movie[];
  personalized?: boolean;
  history_summary?: {
    high_rated_signals: number;
    low_rated_signals: number;
    excluded_saved: number;
  } | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const { session } = useAuth();
  const { favorites } = useFavorites();
  const [savedPrefs, setSavedPrefs] = useState<Preferences | null>(null);

  // -- Rails --
  const [picks, setPicks] = useState<Movie[] | null>(null);
  const [picksMeta, setPicksMeta] = useState<RecResponse['history_summary']>(null);
  const [similar, setSimilar] = useState<Movie[] | null>(null);
  const [trending, setTrending] = useState<Movie[] | null>(null);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Pick the favorite to anchor the "Because you liked" rail.
  // Prefer a 4+ rated favorite, fall back to most recent saved item.
  const anchorFavorite = useMemo(() => {
    if (!favorites || favorites.length === 0) return null;
    const highRated = favorites
      .filter((f) => f.userRating != null && f.userRating >= 4)
      .sort((a, b) => (b.userRating ?? 0) - (a.userRating ?? 0));
    return highRated[0] ?? favorites[0];
  }, [favorites]);

  useEffect(() => {
    setSavedPrefs(loadPreferences());
  }, []);

  // Trending rail (works for everyone)
  useEffect(() => {
    setTrending(null);
    setTrendingError(null);
    fetch(`${API_URL}/api/movies/trending?window=day`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setTrending(data.results ?? []))
      .catch((err) => setTrendingError(err.message));
  }, []);

  // "Picks for you" — only fires when we have preferences
  useEffect(() => {
    if (!savedPrefs || savedPrefs.favoriteGenres.length === 0) {
      setPicks([]);
      return;
    }
    setPicks(null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    fetch(`${API_URL}/api/recommendations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        favoriteGenres: savedPrefs.favoriteGenres,
        yearMin: savedPrefs.yearMin,
        yearMax: savedPrefs.yearMax,
        minRating: savedPrefs.minRating,
        maxDuration: savedPrefs.maxDuration ?? undefined,
        limit: 12,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        return json as RecResponse;
      })
      .then((data) => {
        setPicks(data.recommendations ?? []);
        setPicksMeta(data.history_summary ?? null);
      })
      .catch(() => setPicks([]));
  }, [savedPrefs, session?.access_token]);

  // "Because you liked X" rail
  useEffect(() => {
    if (!anchorFavorite) {
      setSimilar([]);
      return;
    }
    setSimilar(null);
    fetch(`${API_URL}/api/movies/${anchorFavorite.itemId}/similar`)
      .then((res) => res.json())
      .then((data) => setSimilar((data.results ?? []).slice(0, 12)))
      .catch(() => setSimilar([]));
  }, [anchorFavorite]);

  const personalizationBadge = picksMeta && picksMeta.high_rated_signals > 0;

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'var(--page-padding-y) var(--page-padding-x)',
      }}
    >
      <section
        style={{
          background:
            'linear-gradient(135deg, var(--color-hero-from) 0%, var(--color-hero-to) 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          marginBottom: '2.5rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--hero-font-size)',
            margin: '0 0 0.5rem',
            lineHeight: 1.15,
          }}
        >
          Movie Recommender
        </h1>
        <p style={{ color: '#cbd5e1', margin: '0 0 1.5rem', fontSize: '1.05rem' }}>
          {savedPrefs
            ? "Personalized picks below — the more you rate, the smarter they get."
            : "Tell us what you like, and we'll find movies you'll love."}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {savedPrefs ? (
            <>
              <Link href="/recommendations" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'var(--color-success)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.85rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  See all recommendations →
                </button>
              </Link>
              <Link href="/questionnaire" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border-strong)',
                    padding: '0.85rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Edit preferences
                </button>
              </Link>
            </>
          ) : (
            <Link href="/questionnaire" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Get started →
              </button>
            </Link>
          )}
        </div>
        {personalizationBadge && (
          <p
            style={{
              color: '#a5b4fc',
              marginTop: '1rem',
              fontSize: '0.85rem',
            }}
          >
            🎯 Picks are tuned to your {picksMeta!.high_rated_signals} rating
            {picksMeta!.high_rated_signals === 1 ? '' : 's'}
            {picksMeta!.excluded_saved > 0
              ? ` · ${picksMeta!.excluded_saved} already-saved excluded`
              : ''}
          </p>
        )}
      </section>

      {/* Rail 1: Picks for you (only if preferences are saved) */}
      {savedPrefs && savedPrefs.favoriteGenres.length > 0 && (
        <MovieRail
          title="Picks for you"
          subtitle="Personalized recommendations based on your preferences"
          emoji="🎯"
          movies={picks ?? []}
          loading={picks === null}
          viewAllHref="/recommendations"
          emptyMessage="Hmm — no matches right now. Try widening your preferences."
        />
      )}

      {/* Rail 2: Because you liked X */}
      {anchorFavorite && (
        <MovieRail
          title={`Because you ${
            anchorFavorite.userRating && anchorFavorite.userRating >= 4 ? 'loved' : 'saved'
          } ${truncate(anchorFavorite.title, 40)}`}
          subtitle="Movies similar to ones you've enjoyed"
          emoji="❤️"
          movies={similar ?? []}
          loading={similar === null}
        />
      )}

      {/* Rail 3: Trending (always shown) */}
      {trendingError ? (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>🔥 Trending now</h2>
          <div
            style={{
              background: '#7f1d1d',
              padding: '1rem',
              borderRadius: '0.5rem',
              color: '#fecaca',
            }}
          >
            Couldn't load trending: {trendingError}
          </div>
        </section>
      ) : (
        <MovieRail
          title="Trending now"
          subtitle="What everyone else is watching"
          emoji="🔥"
          movies={trending ?? []}
          loading={trending === null}
          viewAllHref="/browse"
        />
      )}

      {/* Gentle nudge for guests */}
      {!session && (
        <section
          style={{
            background: '#1e293b',
            border: '1px dashed #475569',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginTop: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#cbd5e1', margin: '0 0 1rem' }}>
            Sign in to save favorites, rate movies, and unlock smarter recommendations
            that learn from your taste over time.
          </p>
          <Link
            href="/auth/sign-up"
            style={{
              color: '#60a5fa',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create an account →
          </Link>
        </section>
      )}
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
