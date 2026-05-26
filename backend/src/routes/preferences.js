const express = require('express');

function createPreferencesRouter({ supabase, requireAuth }) {
  const router = express.Router();

  // Map between API shape (camelCase) and DB shape (snake_case)
  function toApi(row) {
    if (!row) return null;
    return {
      favoriteGenres: row.favorite_genres ?? [],
      favoriteActors: row.favorite_actors ?? [],
      minRating: row.min_rating != null ? Number(row.min_rating) : 0,
      yearMin: row.year_min,
      yearMax: row.year_max,
      maxDuration: row.max_duration ?? null,
      updatedAt: row.updated_at,
    };
  }

  router.get('/', requireAuth, async (req, res) => {
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Load preferences error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ preferences: toApi(data) });
  });

  router.put('/', requireAuth, async (req, res) => {
    const {
      favoriteGenres,
      favoriteActors = [],
      minRating,
      yearMin,
      yearMax,
      maxDuration,
    } = req.body || {};

    if (!Array.isArray(favoriteGenres) || favoriteGenres.length === 0) {
      return res.status(400).json({
        error: 'favoriteGenres must be a non-empty array of TMDB genre IDs',
      });
    }

    const row = {
      user_id: req.user.id,
      favorite_genres: favoriteGenres.map(Number).filter(Number.isFinite),
      favorite_actors: Array.isArray(favoriteActors)
        ? favoriteActors.map(Number).filter(Number.isFinite)
        : [],
      min_rating: Number.isFinite(minRating) ? minRating : 0,
      year_min: Number.isFinite(yearMin) ? yearMin : null,
      year_max: Number.isFinite(yearMax) ? yearMax : null,
      max_duration: Number.isFinite(maxDuration) ? maxDuration : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('preferences')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Save preferences error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ preferences: toApi(data) });
  });

  return router;
}

module.exports = { createPreferencesRouter };
