// Recommendation engine
//
// Base scoring (no history):
//   final = 0.5 * genreScore + 0.3 * ratingScore + 0.2 * popularityScore
//
// With user history (Phase 7):
//   modifier = +5 per overlap with high-rated genres, -5 per overlap with low-rated
//   final   = clamp(base + clamp(modifier, -20, +20), 0, 100)
//   Already-saved items are excluded from the candidate pool entirely.

const WEIGHTS = { genre: 0.5, rating: 0.3, popularity: 0.2 };
const POPULARITY_CAP = 200;
const DEFAULT_PAGES = 3;
const DEFAULT_LIMIT = 20;

const HISTORY_POINTS_PER_MATCH = 5;
const HISTORY_MODIFIER_CAP = 20;
const HIGH_RATING_THRESHOLD = 4;
const LOW_RATING_THRESHOLD = 2;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function baseScore(movie, prefs) {
  const userGenres = new Set(prefs.favoriteGenres || []);
  const movieGenres = movie.genre_ids || [];

  const overlap = movieGenres.filter((g) => userGenres.has(g)).length;
  const genreScore = userGenres.size > 0 ? (overlap / userGenres.size) * 100 : 0;

  const ratingScore =
    typeof movie.vote_average === 'number' ? (movie.vote_average / 10) * 100 : 0;

  const popularityScore =
    typeof movie.popularity === 'number'
      ? (Math.min(movie.popularity, POPULARITY_CAP) / POPULARITY_CAP) * 100
      : 0;

  const total =
    WEIGHTS.genre * genreScore +
    WEIGHTS.rating * ratingScore +
    WEIGHTS.popularity * popularityScore;

  return {
    total,
    genreScore,
    ratingScore,
    popularityScore,
    matchedGenreIds: movieGenres.filter((g) => userGenres.has(g)),
  };
}

function historyModifier(movieGenres, history) {
  if (!history) return { value: 0, highMatches: 0, lowMatches: 0 };

  let boost = 0;
  let penalty = 0;
  let highMatches = 0;
  let lowMatches = 0;

  for (const gid of movieGenres) {
    if (history.highRatedGenres.has(gid)) {
      boost += history.highRatedGenres.get(gid) * HISTORY_POINTS_PER_MATCH;
      highMatches++;
    }
    if (history.lowRatedGenres.has(gid)) {
      penalty += history.lowRatedGenres.get(gid) * HISTORY_POINTS_PER_MATCH;
      lowMatches++;
    }
  }

  const raw = boost - penalty;
  const clamped = Math.max(-HISTORY_MODIFIER_CAP, Math.min(HISTORY_MODIFIER_CAP, raw));
  return { value: clamped, highMatches, lowMatches };
}

function scoreMovie(movie, prefs, history) {
  const base = baseScore(movie, prefs);
  const mod = historyModifier(movie.genre_ids || [], history);

  const total = Math.max(0, Math.min(100, base.total + mod.value));

  return {
    score: round1(total),
    breakdown: {
      genre: round1(base.genreScore),
      rating: round1(base.ratingScore),
      popularity: round1(base.popularityScore),
      history_modifier: round1(mod.value),
      history_high_matches: mod.highMatches,
      history_low_matches: mod.lowMatches,
      matched_genre_ids: base.matchedGenreIds,
    },
  };
}

async function fetchCandidatePool(tmdb, prefs, pages = DEFAULT_PAGES) {
  const pageResults = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      tmdb.discoverMovies({ ...prefs, page: i + 1 })
    )
  );

  const seen = new Set();
  const candidates = [];
  for (const page of pageResults) {
    for (const movie of page.results || []) {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        candidates.push(movie);
      }
    }
  }
  return candidates;
}

/**
 * Build a history features object from raw favorites rows.
 *   favorites: [{ item_id, user_rating, genre_ids }, ...]
 */
function buildHistoryFeatures(favorites) {
  const highRatedGenres = new Map(); // genre_id -> count
  const lowRatedGenres = new Map();
  const savedItemIds = new Set();

  for (const fav of favorites || []) {
    const tmdbId = Number(fav.item_id);
    if (Number.isFinite(tmdbId)) savedItemIds.add(tmdbId);

    if (fav.user_rating == null) continue;
    const genres = Array.isArray(fav.genre_ids) ? fav.genre_ids : [];
    if (genres.length === 0) continue;

    const bucket =
      fav.user_rating >= HIGH_RATING_THRESHOLD
        ? highRatedGenres
        : fav.user_rating <= LOW_RATING_THRESHOLD
          ? lowRatedGenres
          : null;
    if (!bucket) continue;

    for (const gid of genres) {
      bucket.set(gid, (bucket.get(gid) || 0) + 1);
    }
  }

  return {
    highRatedGenres,
    lowRatedGenres,
    savedItemIds,
    highRatedCount: [...highRatedGenres.values()].reduce((s, n) => s + n, 0),
    lowRatedCount: [...lowRatedGenres.values()].reduce((s, n) => s + n, 0),
  };
}

async function generateRecommendations(
  tmdb,
  prefs,
  limit = DEFAULT_LIMIT,
  history = null
) {
  let candidates = await fetchCandidatePool(tmdb, prefs);

  // Phase 7: skip movies the user has already saved
  if (history?.savedItemIds?.size) {
    candidates = candidates.filter((m) => !history.savedItemIds.has(m.id));
  }

  const scored = candidates.map((movie) => {
    const { score, breakdown } = scoreMovie(movie, prefs, history);
    return { ...movie, score, breakdown };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    candidate_count: candidates.length,
    weights: WEIGHTS,
    personalized: Boolean(history),
    history_summary: history
      ? {
          high_rated_signals: history.highRatedCount,
          low_rated_signals: history.lowRatedCount,
          excluded_saved: history.savedItemIds.size,
        }
      : null,
    recommendations: scored.slice(0, limit),
  };
}

module.exports = {
  generateRecommendations,
  scoreMovie,
  buildHistoryFeatures,
  WEIGHTS,
};
