'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type SavedMovie = {
  id: string;
  itemId: number;
  itemType: string;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  genreIds: number[];
  score: number | null;
  savedAt: string;
  userRating: number | null;
  userReview: string | null;
};

export type MovieToSave = {
  id: number;
  title: string;
  poster_path?: string | null;
  poster_url?: string | null;
  genre_ids?: number[];
  score?: number | null;
};

type FavoritesContextValue = {
  favorites: SavedMovie[];
  loading: boolean;
  isFavorite: (movieId: number) => boolean;
  saveMovie: (movie: MovieToSave) => Promise<void>;
  removeMovie: (movieId: number) => Promise<void>;
  updateMovie: (
    movieId: number,
    updates: { userRating?: number | null; userReview?: string }
  ) => Promise<void>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();
  const [favorites, setFavorites] = useState<SavedMovie[]>([]);
  const [loading, setLoading] = useState(false);

  async function authedFetch(path: string, init: RequestInit = {}) {
    if (!session?.access_token) throw new Error('Not signed in');
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setFavorites(body.favorites ?? []);
    } catch (err) {
      console.warn('Failed to load favorites:', (err as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  // Refresh when sign-in changes
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setFavorites([]);
    }
  }, [user, refresh]);

  const isFavorite = useCallback(
    (movieId: number) => favorites.some((f) => Number(f.itemId) === Number(movieId)),
    [favorites]
  );

  const saveMovie = useCallback(
    async (movie: MovieToSave) => {
      if (!session?.access_token) throw new Error('Not signed in');

      const optimistic: SavedMovie = {
        id: `optimistic-${movie.id}`,
        itemId: movie.id,
        itemType: 'movie',
        title: movie.title,
        posterPath: movie.poster_path ?? null,
        posterUrl: movie.poster_url ?? null,
        genreIds: movie.genre_ids ?? [],
        score: movie.score ?? null,
        savedAt: new Date().toISOString(),
        userRating: null,
        userReview: null,
      };
      setFavorites((prev) => [optimistic, ...prev.filter((f) => f.itemId !== movie.id)]);

      try {
        const res = await authedFetch('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({
            itemId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
            posterUrl: movie.poster_url,
            genreIds: movie.genre_ids,
            score: movie.score ?? undefined,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        setFavorites((prev) =>
          prev.map((f) => (f.itemId === movie.id ? body.favorite : f))
        );
      } catch (err) {
        // Roll back optimistic insert
        setFavorites((prev) => prev.filter((f) => f.itemId !== movie.id));
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.access_token]
  );

  const removeMovie = useCallback(
    async (movieId: number) => {
      if (!session?.access_token) throw new Error('Not signed in');

      const previous = favorites;
      setFavorites((prev) => prev.filter((f) => f.itemId !== movieId));

      try {
        const res = await authedFetch(`/api/favorites/${movieId}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        setFavorites(previous);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.access_token, favorites]
  );

  const updateMovie = useCallback(
    async (
      movieId: number,
      updates: { userRating?: number | null; userReview?: string }
    ) => {
      if (!session?.access_token) throw new Error('Not signed in');

      const previous = favorites;
      setFavorites((prev) =>
        prev.map((f) => (f.itemId === movieId ? { ...f, ...updates } : f))
      );

      try {
        const res = await authedFetch(`/api/favorites/${movieId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        setFavorites((prev) =>
          prev.map((f) => (f.itemId === movieId ? body.favorite : f))
        );
      } catch (err) {
        setFavorites(previous);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.access_token, favorites]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, isFavorite, saveMovie, removeMovie, updateMovie, refresh }),
    [favorites, loading, isFavorite, saveMovie, removeMovie, updateMovie, refresh]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}
