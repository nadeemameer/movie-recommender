'use client';

import Link from 'next/link';
import MovieCard from './MovieCard';

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

export default function MovieRail({
  title,
  subtitle,
  emoji,
  movies,
  loading,
  emptyMessage,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
  viewAllHref?: string;
}) {
  if (loading) {
    return (
      <section style={{ marginBottom: '3rem' }}>
        <RailHeader title={title} subtitle={subtitle} emoji={emoji} />
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                minWidth: 180,
                height: 270,
                background: '#1e293b',
                borderRadius: '0.5rem',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section style={{ marginBottom: '3rem' }}>
        <RailHeader title={title} subtitle={subtitle} emoji={emoji} />
        <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '1rem 0' }}>
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: '3rem' }}>
      <RailHeader
        title={title}
        subtitle={subtitle}
        emoji={emoji}
        viewAllHref={viewAllHref}
      />
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          scrollSnapType: 'x mandatory',
          alignItems: 'stretch',
        }}
      >
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movie/${movie.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              width: 180,
              flexShrink: 0,
              scrollSnapAlign: 'start',
            }}
          >
            <MovieCard movie={movie} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RailHeader({
  title,
  subtitle,
  emoji,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  viewAllHref?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: '1.4rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          style={{
            color: '#60a5fa',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          See all →
        </Link>
      )}
    </div>
  );
}
