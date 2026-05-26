import MovieCard from './MovieCard';

type Movie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  poster_url: string | null;
  release_date?: string;
  vote_average?: number;
};

type Breakdown = {
  genre: number;
  rating: number;
  popularity: number;
  matched_genre_ids: number[];
};

export default function RecommendationCard({
  movie,
  rank,
  score,
  breakdown,
}: {
  movie: Movie;
  rank: number;
  score: number;
  breakdown: Breakdown;
}) {
  const matchColor =
    score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#94a3b8';

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 3,
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f1f5f9',
          padding: '0.25rem 0.55rem',
          borderRadius: '0.4rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          border: '1px solid #334155',
        }}
      >
        #{rank}
      </div>

      <MovieCard movie={{ ...movie, score }} />

      <div
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            color: matchColor,
            padding: '0.2rem 0.55rem',
            borderRadius: '0.4rem',
            fontWeight: 700,
            fontSize: '0.78rem',
            border: `1px solid ${matchColor}`,
          }}
          title={`Genre ${breakdown.genre} · Rating ${breakdown.rating} · Popularity ${breakdown.popularity}`}
        >
          {Math.round(score)}% match
        </div>
      </div>
    </div>
  );
}
