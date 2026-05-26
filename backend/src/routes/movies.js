const express = require('express');

function createMoviesRouter(tmdb) {
  const router = express.Router();

  function handleError(res, err) {
    const tmdbStatus = err.response?.status;
    if (tmdbStatus === 404) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (tmdbStatus === 401) {
      return res.status(500).json({
        error: 'TMDB auth failed',
        message: 'Check TMDB_API_KEY in .env',
      });
    }
    console.error('TMDB error:', err.message);
    res.status(502).json({
      error: 'TMDB request failed',
      message: err.message,
    });
  }

  router.get('/trending', async (req, res) => {
    try {
      const data = await tmdb.getTrending(req.query.window);
      res.json(data);
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get('/genres', async (req, res) => {
    try {
      const genres = await tmdb.getGenres();
      res.json({ genres });
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get('/search', async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const data = await tmdb.searchMovies(req.query.q, page);
      res.json(data);
    } catch (err) {
      handleError(res, err);
    }
  });

  // Browse: lightweight wrapper around discover for a single genre
  router.get('/browse', async (req, res) => {
    try {
      const genre = req.query.genre ? Number(req.query.genre) : null;
      const page = parseInt(req.query.page || '1', 10);
      const data = await tmdb.discoverMovies({
        favoriteGenres: genre ? [genre] : [],
        page,
      });
      res.json(data);
    } catch (err) {
      handleError(res, err);
    }
  });

  // /:id/similar must be defined before /:id so Express matches it first
  router.get('/:id/similar', async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const data = await tmdb.getSimilar(req.params.id, page);
      res.json(data);
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const data = await tmdb.getMovieDetails(req.params.id);
      res.json(data);
    } catch (err) {
      handleError(res, err);
    }
  });

  return router;
}

module.exports = { createMoviesRouter };
