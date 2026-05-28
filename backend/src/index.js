const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { createClient: createRedisClient } = require('redis');
const { createTmdbService } = require('./services/tmdb');
const { createMoviesRouter } = require('./routes/movies');
const { createRecommendationsRouter } = require('./routes/recommendations');
const { createPreferencesRouter } = require('./routes/preferences');
const { createFavoritesRouter } = require('./routes/favorites');
const { createRequireAuth } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: lock to specific origins in production via FRONTEND_ORIGIN env var.
// Supports a comma-separated list of EITHER:
//   - literal origins (e.g. "https://example.com"), or
//   - glob-style patterns using "*" (e.g. "https://*.vercel.app")
// In dev (no FRONTEND_ORIGIN set), allow all so curl/Postman work too.
//
// Why glob support: Vercel assigns multiple URLs to every deployment
// (canonical + per-deployment + per-branch). Listing them all is brittle;
// a single pattern like "https://movie-recommender-*.vercel.app" covers
// every alias for this project.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

function globToRegex(pattern) {
  // Escape regex metacharacters except '*', then turn '*' into '.*'
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

const allowedOriginMatchers = FRONTEND_ORIGIN
  ? FRONTEND_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => (entry.includes('*') ? globToRegex(entry) : entry))
  : null;

app.use(
  cors({
    origin: allowedOriginMatchers ?? true,
    credentials: true,
  })
);
app.use(express.json());

// Render and other hosts probe / for health by default; respond with 200.
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'movie-recommender-backend' });
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Supabase calls will fail until you fill them in your .env file.'
  );
}

// Service-role client bypasses RLS — keep server-side ONLY.
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const redisClient = createRedisClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis error:', err));

const tmdb = createTmdbService({ apiKey: TMDB_API_KEY, redis: redisClient });
const requireAuth = createRequireAuth(supabase);

async function init() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
  }

  if (supabase) {
    const { error } = await supabase
      .from('preferences')
      .select('id', { count: 'exact', head: true });
    if (error) {
      console.error(
        'Supabase reachable but query failed (run db/schema.sql in your project?):',
        error.message
      );
    } else {
      console.log('Connected to Supabase');
    }
  }

  if (TMDB_API_KEY) {
    try {
      const genres = await tmdb.getGenres();
      console.log(`Connected to TMDB (${genres.length} genres loaded)`);
    } catch (err) {
      console.error('Failed to reach TMDB:', err.message);
    }
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'movie-recommender-backend',
    supabaseConfigured: Boolean(supabase),
    tmdbConfigured: Boolean(TMDB_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ping-db', async (req, res) => {
  if (!supabase) return res.status(500).json({ db: 'error', message: 'Supabase not configured' });
  const { count, error } = await supabase
    .from('preferences')
    .select('id', { count: 'exact', head: true });
  if (error) return res.status(500).json({ db: 'error', message: error.message });
  res.json({ db: 'ok', preferencesCount: count ?? 0 });
});

app.get('/api/ping-cache', async (req, res) => {
  try {
    await redisClient.set('ping', 'pong', { EX: 10 });
    const value = await redisClient.get('ping');
    res.json({ cache: 'ok', value });
  } catch (err) {
    res.status(500).json({ cache: 'error', message: err.message });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use('/api/movies', createMoviesRouter(tmdb));
app.use('/api/recommendations', createRecommendationsRouter({ tmdb, supabase }));
app.use('/api/preferences', createPreferencesRouter({ supabase, requireAuth }));
app.use('/api/favorites', createFavoritesRouter({ supabase, requireAuth }));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  init();
});
