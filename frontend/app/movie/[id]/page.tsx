'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '../../../lib/FavoritesContext';
import { useAuth } from '../../../lib/AuthContext';
import MovieCard from '../../components/MovieCard';
import RatingStars from '../../components/RatingStars';
import SaveButton from '../../components/SaveButton';
import { SkeletonText } from '../../components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

type Video = {
  key: string;
  site: string;
  type: string;
  name: string;
};

type Genre = { id: number; name: string };

type MovieDetails = {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  genres?: Genre[];
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
};

type SimilarResponse = {
  results: {
    id: number;
    title: string;
    poster_path?: string | null;
    poster_url: string | null;
    release_date?: string;
    vote_average?: number;
  }[];
};

export default function MovieDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const movieId = Number(params.id);

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<SimilarResponse['results']>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMovie(null);
    setError(null);
    fetch(`${API_URL}/api/movies/${movieId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        return json as MovieDetails;
      })
      .then(setMovie)
      .catch((err) => setError(err.message));

    fetch(`${API_URL}/api/movies/${movieId}/similar`)
      .then((r) => r.json())
      .then((d) => setSimilar((d.results ?? []).slice(0, 12)))
      .catch(() => {});
  }, [movieId]);

  useEffect(() => {
    if (movie?.title) {
      document.title = `${movie.title} · Movie Recommender`;
    }
    return () => {
      document.title = 'Movie Recommender';
    };
  }, [movie?.title]);

  if (error) {
    return (
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1>Movie not found</h1>
        <p style={{ color: '#94a3b8' }}>{error}</p>
        <Link href="/" style={{ color: '#60a5fa' }}>← Back to home</Link>
      </main>
    );
  }

  if (!movie) {
    return (
      <main>
        <section
          className="skeleton"
          style={{ height: 380, width: '100%', borderRadius: 0 }}
        />
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '2rem var(--page-padding-x)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <SkeletonText height="2rem" width="60%" />
          <SkeletonText height="1rem" width="40%" />
          <SkeletonText height="1rem" width="90%" />
          <SkeletonText height="1rem" width="85%" />
          <SkeletonText height="1rem" width="50%" />
        </div>
      </main>
    );
  }

  const backdropLarge = movie.backdrop_path
    ? `${IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;
  const posterLarge = movie.poster_path
    ? `${IMAGE_BASE}/w500${movie.poster_path}`
    : movie.poster_url;
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const trailer = movie.videos?.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  const topCast = (movie.credits?.cast ?? []).slice(0, 8);

  return (
    <main>
      {/* HERO with backdrop */}
      <section
        style={{
          position: 'relative',
          minHeight: 380,
          background: backdropLarge
            ? `linear-gradient(to bottom, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.95) 100%), url(${backdropLarge}) center/cover no-repeat`
            : '#1e293b',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '3rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: '2rem',
            alignItems: 'end',
          }}
        >
          <div
            style={{
              aspectRatio: '2 / 3',
              background: '#0f172a',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              border: '1px solid #334155',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            {posterLarge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterLarge}
                alt={movie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>

          <div>
            <h1 style={{ fontSize: '2.25rem', margin: 0 }}>
              {movie.title}{' '}
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                {year && `(${year})`}
              </span>
            </h1>
            {movie.tagline && (
              <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
                {movie.tagline}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                margin: '1rem 0',
              }}
            >
              {(movie.genres ?? []).map((g) => (
                <Link
                  key={g.id}
                  href={`/browse/${g.id}`}
                  style={{
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                  }}
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                color: '#cbd5e1',
                fontSize: '0.9rem',
              }}
            >
              {movie.runtime ? <span>⏱ {movie.runtime} min</span> : null}
              {movie.vote_average ? (
                <span style={{ color: '#fbbf24' }}>
                  ★ {movie.vote_average.toFixed(1)}{' '}
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    ({movie.vote_count?.toLocaleString()} votes)
                  </span>
                </span>
              ) : null}
              <SaveButton
                movie={{
                  id: movie.id,
                  title: movie.title,
                  poster_path: movie.poster_path,
                  poster_url: movie.poster_url,
                  genre_ids: (movie.genres ?? []).map((g) => g.id),
                }}
              />
            </div>

            {movie.overview && (
              <div style={{ marginTop: '1.25rem' }}>
                <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.4rem' }}>Overview</h2>
                <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.55 }}>
                  {movie.overview}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <MyRatingPanel movieId={movie.id} />

        {trailer && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', margin: '0 0 1rem' }}>Trailer</h2>
            <div
              style={{
                position: 'relative',
                paddingTop: '56.25%',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: '1px solid #334155',
                background: '#000',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          </section>
        )}

        {topCast.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', margin: '0 0 1rem' }}>Top cast</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {topCast.map((c) => (
                <article
                  key={c.id}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.6rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '2 / 3',
                      background: '#0f172a',
                      overflow: 'hidden',
                    }}
                  >
                    {c.profile_path && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${IMAGE_BASE}/w185${c.profile_path}`}
                        alt={c.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ padding: '0.55rem 0.65rem' }}>
                    <div
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: '#f1f5f9',
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      as {c.character}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.35rem', margin: '0 0 1rem' }}>Similar movies</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '1rem',
              }}
            >
              {similar.map((m) => (
                <Link
                  key={m.id}
                  href={`/movie/${m.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <MovieCard movie={m} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MyRatingPanel({ movieId }: { movieId: number }) {
  const { user } = useAuth();
  const { favorites, updateMovie, isFavorite } = useFavorites();
  const fav = favorites.find((f) => Number(f.itemId) === movieId);

  if (!user || !isFavorite(movieId) || !fav) return null;

  return (
    <section
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Your rating</h3>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
          {fav.userRating ? 'Tap a star to change.' : 'Tap to rate this movie.'}
        </p>
      </div>
      <RatingStars
        value={fav.userRating}
        onChange={(rating) => updateMovie(movieId, { userRating: rating })}
        size="lg"
      />
    </section>
  );
}
