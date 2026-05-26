'use client';

import SaveButton from './SaveButton';

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

export default function MovieCard({
  movie,
  showSaveButton = true,
}: {
  movie: Movie;
  showSaveButton?: boolean;
}) {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  return (
    <article
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      {showSaveButton && (
        // Wrapper has its own click handler to swallow any stray clicks
        // that land on the padding around the heart button. Without this,
        // a slight miss-click would bubble to the parent <Link> and the
        // user would see the page navigate instead of the heart turning red.
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 3,
            lineHeight: 0,
          }}
        >
          <SaveButton
            movie={{
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path ?? null,
              poster_url: movie.poster_url ?? null,
              genre_ids: movie.genre_ids,
              score: movie.score ?? null,
            }}
          />
        </div>
      )}

      <div
        style={{
          aspectRatio: '2 / 3',
          background: '#0f172a',
          overflow: 'hidden',
        }}
      >
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: '#475569',
              fontSize: '0.75rem',
              padding: '1rem',
              textAlign: 'center',
            }}
          >
            No image
          </div>
        )}
      </div>

      <div style={{ padding: '0.75rem 0.875rem', flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: '#f1f5f9',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={movie.title}
        >
          {movie.title}
        </h3>
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: '0.8rem',
          }}
        >
          <span>{year}</span>
          {rating && <span style={{ color: '#fbbf24' }}>★ {rating}</span>}
        </div>
      </div>
    </article>
  );
}
