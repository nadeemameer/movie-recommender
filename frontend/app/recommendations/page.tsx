'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import {
  fetchPreferencesFromBackend,
  loadPreferences,
  Preferences,
  savePreferences,
} from '../../lib/preferences';
import RecommendationCard from '../components/RecommendationCard';
import { SkeletonGrid } from '../components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Genre = { id: number; name: string };

type Movie = {
  id: number;
  title: string;
  overview?: string;
  poster_url: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  score: number;
  breakdown: {
    genre: number;
    rating: number;
    popularity: number;
    matched_genre_ids: number[];
  };
};

type Response = {
  candidate_count: number;
  weights: { genre: number; rating: number; popularity: number };
  personalized?: boolean;
  history_summary?: {
    high_rated_signals: number;
    low_rated_signals: number;
    excluded_saved: number;
  } | null;
  recommendations: Movie[];
};

export default function RecommendationsPage() {
  const { session, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [prefsResolved, setPrefsResolved] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Load genre name lookup table (for the "Based on" summary)
  useEffect(() => {
    fetch(`${API_URL}/api/movies/genres`)
      .then((res) => res.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => {});
  }, []);

  // 2. Resolve which preferences to use: prefer backend if signed in, else localStorage
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      let resolved: Preferences | null = loadPreferences();

      if (session?.access_token) {
        try {
          const remote = await fetchPreferencesFromBackend(session.access_token);
          if (remote && remote.favoriteGenres.length > 0) {
            resolved = remote;
            savePreferences(remote);
          }
        } catch (err) {
          console.warn('Backend preferences fetch failed:', (err as Error).message);
        }
      }

      if (cancelled) return;
      setPrefs(resolved);
      setPrefsResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session]);

  // 3. Once prefs are resolved, fetch recommendations
  useEffect(() => {
    if (!prefsResolved) return;
    if (!prefs || prefs.favoriteGenres.length === 0) return;

    setLoading(true);
    setError(null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    fetch(`${API_URL}/api/recommendations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        favoriteGenres: prefs.favoriteGenres,
        yearMin: prefs.yearMin,
        yearMax: prefs.yearMax,
        minRating: prefs.minRating,
        maxDuration: prefs.maxDuration ?? undefined,
        limit: 20,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`);
        return json as Response;
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [prefsResolved, prefs, session?.access_token]);

  if (!prefsResolved || authLoading) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading your preferences…</p>
      </main>
    );
  }

  if (!prefs || prefs.favoriteGenres.length === 0) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem' }}>No preferences saved yet</h1>
        <p style={{ color: '#94a3b8' }}>
          Take a moment to tell us what you like, and we'll build your recommendations.
        </p>
        <Link href="/questionnaire" style={{ textDecoration: 'none' }}>
          <button
            style={{
              marginTop: '1rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '0.85rem 1.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start the questionnaire →
          </button>
        </Link>
      </main>
    );
  }

  const selectedGenreNames = prefs.favoriteGenres
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Your Recommendations</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          {session
            ? 'Synced with your account.'
            : 'Based on locally saved preferences — sign in to sync across devices.'}
        </p>

        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
            <strong>Based on:</strong>{' '}
            {selectedGenreNames || prefs.favoriteGenres.length + ' genres'} · rating ≥{' '}
            {prefs.minRating.toFixed(1)} · {prefs.yearMin}–{prefs.yearMax}
            {prefs.maxDuration && ` · ≤ ${prefs.maxDuration} min`}
          </div>
          <Link href="/questionnaire" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Edit preferences
            </button>
          </Link>
        </div>
      </header>

      {loading && (
        <>
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            Scoring movies for you…
          </p>
          <SkeletonGrid count={12} />
        </>
      )}

      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
        >
          Couldn't generate recommendations: {error}
        </div>
      )}

      {data && data.recommendations.length === 0 && (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem 0' }}>
          No movies matched these filters. Try widening the year range or lowering the minimum
          rating.
        </p>
      )}

      {data && data.recommendations.length > 0 && (
        <>
          {data.personalized && data.history_summary && (
            <div
              style={{
                background: '#1e3a8a',
                border: '1px solid #2563eb',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                color: '#dbeafe',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span>🎯 Tuned to your ratings:</span>
              <span>👍 {data.history_summary.high_rated_signals} high-rated genre signals</span>
              {data.history_summary.low_rated_signals > 0 && (
                <span>👎 {data.history_summary.low_rated_signals} low-rated avoidance signals</span>
              )}
              {data.history_summary.excluded_saved > 0 && (
                <span>
                  Excluded {data.history_summary.excluded_saved} movie
                  {data.history_summary.excluded_saved === 1 ? '' : 's'} you've already saved
                </span>
              )}
            </div>
          )}
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Scored {data.candidate_count} candidates · base weights{' '}
            {(data.weights.genre * 100).toFixed(0)}% genre /{' '}
            {(data.weights.rating * 100).toFixed(0)}% rating /{' '}
            {(data.weights.popularity * 100).toFixed(0)}% popularity
            {data.personalized ? ' · history modifier ±20' : ''}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {data.recommendations.map((m, i) => (
              <Link
                key={m.id}
                href={`/movie/${m.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <RecommendationCard
                  movie={m}
                  rank={i + 1}
                  score={m.score}
                  breakdown={m.breakdown}
                />
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
