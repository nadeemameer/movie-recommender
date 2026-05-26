const express = require('express');
const { generateRecommendations, buildHistoryFeatures } = require('../services/recommender');

function createRecommendationsRouter({ tmdb, supabase }) {
  const router = express.Router();

  // Optional auth: if the request carries a valid Supabase JWT, identify the
  // user and load their rating history so we can personalise. Anonymous
  // requests still work — they just don't get the history boost.
  async function maybeIdentifyUser(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token || !supabase) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  }

  async function loadHistoryForUser(userId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('recommendations')
      .select('item_id, user_rating, genre_ids')
      .eq('user_id', userId);
    if (error) {
      console.warn('Could not load user history:', error.message);
      return null;
    }
    return buildHistoryFeatures(data || []);
  }

  router.post('/', async (req, res) => {
    const {
      favoriteGenres = [],
      yearMin,
      yearMax,
      minRating,
      maxDuration,
      limit,
    } = req.body || {};

    if (!Array.isArray(favoriteGenres) || favoriteGenres.length === 0) {
      return res.status(400).json({
        error: 'favoriteGenres must be a non-empty array of TMDB genre IDs',
      });
    }

    const prefs = {
      favoriteGenres: favoriteGenres.map(Number).filter(Number.isFinite),
      yearMin: Number.isFinite(yearMin) ? yearMin : undefined,
      yearMax: Number.isFinite(yearMax) ? yearMax : undefined,
      minRating: Number.isFinite(minRating) ? minRating : undefined,
      maxDuration: Number.isFinite(maxDuration) ? maxDuration : undefined,
    };

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(parseInt(limit, 10), 1), 60)
      : 20;

    try {
      const user = await maybeIdentifyUser(req);
      const history = user ? await loadHistoryForUser(user.id) : null;
      const result = await generateRecommendations(tmdb, prefs, safeLimit, history);
      res.json({ ...result, prefs });
    } catch (err) {
      console.error('Recommendation error:', err.message);
      const tmdbStatus = err.response?.status;
      if (tmdbStatus === 401) {
        return res.status(500).json({
          error: 'TMDB auth failed',
          message: 'Check TMDB_API_KEY in .env',
        });
      }
      res.status(502).json({
        error: 'Recommendation generation failed',
        message: err.message,
      });
    }
  });

  return router;
}

module.exports = { createRecommendationsRouter };
