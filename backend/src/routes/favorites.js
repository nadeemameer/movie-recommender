const express = require('express');

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function createFavoritesRouter({ supabase, requireAuth }) {
  const router = express.Router();

  function toApi(row) {
    if (!row) return null;
    // item_id is stored as text (for flexibility across content types) but
    // movie IDs from TMDB are always integers — coerce so the frontend
    // can compare === without surprises.
    const numericItemId = Number(row.item_id);
    return {
      id: row.id,
      itemId: Number.isFinite(numericItemId) ? numericItemId : row.item_id,
      itemType: row.item_type,
      title: row.title,
      posterPath: row.poster_path,
      posterUrl: row.poster_path
        ? row.poster_path.startsWith('http')
          ? row.poster_path
          : `${IMAGE_BASE_URL}${row.poster_path}`
        : null,
      genreIds: row.genre_ids ?? [],
      score: row.score != null ? Number(row.score) : null,
      savedAt: row.saved_at,
      userRating: row.user_rating,
      userReview: row.user_review,
    };
  }

  router.get('/', requireAuth, async (req, res) => {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Load favorites error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ favorites: (data ?? []).map(toApi) });
  });

  router.post('/', requireAuth, async (req, res) => {
    const {
      itemId,
      itemType = 'movie',
      title,
      posterPath,
      posterUrl,
      score,
      genreIds,
    } = req.body || {};

    if (!itemId || !title) {
      return res.status(400).json({ error: 'itemId and title are required' });
    }

    // Store the relative path if we have it; otherwise full URL.
    const posterValue = posterPath ?? posterUrl ?? null;

    const row = {
      user_id: req.user.id,
      item_id: String(itemId),
      item_type: itemType,
      title,
      poster_path: posterValue,
      genre_ids: Array.isArray(genreIds)
        ? genreIds.map(Number).filter(Number.isFinite)
        : [],
      score: typeof score === 'number' ? score : null,
    };

    const { data, error } = await supabase
      .from('recommendations')
      .upsert(row, { onConflict: 'user_id,item_id,item_type' })
      .select()
      .single();

    if (error) {
      console.error('Save favorite error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ favorite: toApi(data) });
  });

  router.patch('/:itemId', requireAuth, async (req, res) => {
    const { itemId } = req.params;
    const { itemType = 'movie', userRating, userReview } = req.body || {};

    const updates = {};
    if (userRating !== undefined) {
      if (
        userRating !== null &&
        (!Number.isInteger(userRating) || userRating < 1 || userRating > 5)
      ) {
        return res.status(400).json({ error: 'userRating must be 1..5 or null' });
      }
      updates.user_rating = userRating;
    }
    if (userReview !== undefined) {
      updates.user_review = userReview;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update(updates)
      .eq('user_id', req.user.id)
      .eq('item_id', String(itemId))
      .eq('item_type', itemType)
      .select()
      .single();

    if (error) {
      console.error('Update favorite error:', error.message);
      const status = error.code === 'PGRST116' ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
    res.json({ favorite: toApi(data) });
  });

  router.delete('/:itemId', requireAuth, async (req, res) => {
    const { itemId } = req.params;
    const itemType = req.query.itemType || 'movie';

    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('user_id', req.user.id)
      .eq('item_id', String(itemId))
      .eq('item_type', itemType);

    if (error) {
      console.error('Delete favorite error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(204).end();
  });

  return router;
}

module.exports = { createFavoritesRouter };
