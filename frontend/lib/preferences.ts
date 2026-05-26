export type Preferences = {
  favoriteGenres: number[];        // TMDB genre IDs
  yearMin: number;
  yearMax: number;
  minRating: number;                // 0.0 — 10.0
  maxDuration: number | null;       // minutes, null = no limit
  savedAt?: string;
};

const STORAGE_KEY = 'movieRecommender.preferences';

export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_PREFERENCES: Preferences = {
  favoriteGenres: [],
  yearMin: 2000,
  yearMax: CURRENT_YEAR,
  minRating: 6.0,
  maxDuration: null,
};

export function loadPreferences(): Preferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return null;
  }
}

export function savePreferences(prefs: Preferences): Preferences {
  const withTimestamp = { ...prefs, savedAt: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
  }
  return withTimestamp;
}

export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ---------------- Backend sync (Supabase via our Express API) ----------------

const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000';

export async function fetchPreferencesFromBackend(
  accessToken: string
): Promise<Preferences | null> {
  const res = await fetch(`${API_URL}/api/preferences`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.preferences) return null;
  const p = body.preferences;
  return {
    favoriteGenres: p.favoriteGenres ?? [],
    yearMin: p.yearMin ?? DEFAULT_PREFERENCES.yearMin,
    yearMax: p.yearMax ?? DEFAULT_PREFERENCES.yearMax,
    minRating: typeof p.minRating === 'number' ? p.minRating : DEFAULT_PREFERENCES.minRating,
    maxDuration: p.maxDuration ?? null,
    savedAt: p.updatedAt,
  };
}

export async function pushPreferencesToBackend(
  accessToken: string,
  prefs: Preferences
): Promise<Preferences> {
  const res = await fetch(`${API_URL}/api/preferences`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      favoriteGenres: prefs.favoriteGenres,
      yearMin: prefs.yearMin,
      yearMax: prefs.yearMax,
      minRating: prefs.minRating,
      maxDuration: prefs.maxDuration ?? undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const body = await res.json();
  const p = body.preferences;
  return {
    favoriteGenres: p.favoriteGenres,
    yearMin: p.yearMin,
    yearMax: p.yearMax,
    minRating: p.minRating,
    maxDuration: p.maxDuration ?? null,
    savedAt: p.updatedAt,
  };
}
