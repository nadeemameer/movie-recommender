function createRequireAuth(supabase) {
  return async function requireAuth(req, res, next) {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  };
}

module.exports = { createRequireAuth };
