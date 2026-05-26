const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Cache TTLs (seconds). Tune per endpoint based on how often data changes.
const TTL = {
  trending: 60 * 60,           // 1 hour
  genres: 60 * 60 * 24,        // 1 day
  search: 60 * 10,             // 10 minutes
  details: 60 * 60 * 24,       // 1 day
  similar: 60 * 60,            // 1 hour
  discover: 60 * 30,           // 30 minutes
};

function withImageUrls(item) {
  return {
    ...item,
    poster_url: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    backdrop_url: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : null,
  };
}

function createTmdbService({ apiKey, redis }) {
  if (!apiKey) {
    console.warn(
      'WARNING: TMDB_API_KEY is not set. All /api/movies/* calls will fail.'
    );
  }

  const http = axios.create({
    baseURL: TMDB_BASE_URL,
    params: { api_key: apiKey },
    timeout: 10000,
  });

  async function cached(key, ttlSeconds, fetcher) {
    if (redis?.isReady) {
      try {
        const hit = await redis.get(key);
        if (hit) return JSON.parse(hit);
      } catch (err) {
        console.warn(`Redis read failed for ${key}: ${err.message}`);
      }
    }

    const value = await fetcher();

    if (redis?.isReady) {
      try {
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
      } catch (err) {
        console.warn(`Redis write failed for ${key}: ${err.message}`);
      }
    }

    return value;
  }

  return {
    async getTrending(timeWindow = 'day') {
      const window = timeWindow === 'week' ? 'week' : 'day';
      return cached(`tmdb:trending:${window}`, TTL.trending, async () => {
        const { data } = await http.get(`/trending/movie/${window}`);
        return {
          page: data.page,
          results: (data.results || []).map(withImageUrls),
        };
      });
    },

    async getGenres() {
      return cached('tmdb:genres', TTL.genres, async () => {
        const { data } = await http.get('/genre/movie/list');
        return data.genres || [];
      });
    },

    async searchMovies(query, page = 1) {
      const safeQuery = (query || '').trim();
      if (!safeQuery) {
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
      }
      const key = `tmdb:search:${safeQuery.toLowerCase()}:${page}`;
      return cached(key, TTL.search, async () => {
        const { data } = await http.get('/search/movie', {
          params: { query: safeQuery, page, include_adult: false },
        });
        return {
          page: data.page,
          total_pages: data.total_pages,
          total_results: data.total_results,
          results: (data.results || []).map(withImageUrls),
        };
      });
    },

    async getMovieDetails(id) {
      return cached(`tmdb:movie:${id}`, TTL.details, async () => {
        const { data } = await http.get(`/movie/${id}`, {
          params: { append_to_response: 'credits,videos' },
        });
        return withImageUrls(data);
      });
    },

    async getSimilar(id, page = 1) {
      return cached(`tmdb:similar:${id}:${page}`, TTL.similar, async () => {
        const { data } = await http.get(`/movie/${id}/similar`, {
          params: { page },
        });
        return {
          page: data.page,
          results: (data.results || []).map(withImageUrls),
        };
      });
    },

    async discoverMovies({
      favoriteGenres = [],
      yearMin,
      yearMax,
      minRating,
      maxDuration,
      page = 1,
    } = {}) {
      const params = {
        page,
        sort_by: 'popularity.desc',
        include_adult: false,
        'vote_count.gte': 100,
      };
      if (favoriteGenres.length > 0) params.with_genres = favoriteGenres.join(',');
      if (yearMin) params['primary_release_date.gte'] = `${yearMin}-01-01`;
      if (yearMax) params['primary_release_date.lte'] = `${yearMax}-12-31`;
      if (typeof minRating === 'number') params['vote_average.gte'] = minRating;
      if (maxDuration) params['with_runtime.lte'] = maxDuration;

      const key = `tmdb:discover:${JSON.stringify(params)}`;
      return cached(key, TTL.discover, async () => {
        const { data } = await http.get('/discover/movie', { params });
        return {
          page: data.page,
          total_pages: data.total_pages,
          total_results: data.total_results,
          results: (data.results || []).map(withImageUrls),
        };
      });
    },
  };
}

module.exports = { createTmdbService };
