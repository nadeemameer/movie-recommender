'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { useFavorites, MovieToSave } from '../../lib/FavoritesContext';

export default function SaveButton({ movie }: { movie: MovieToSave }) {
  const { user } = useAuth();
  const { isFavorite, saveMovie, removeMovie } = useFavorites();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const saved = isFavorite(movie.id);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    setBusy(true);
    try {
      if (saved) {
        await removeMovie(movie.id);
      } else {
        await saveMovie(movie);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={user ? (saved ? 'Remove from favorites' : 'Save to favorites') : 'Sign in to save'}
      aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        border: `1px solid ${saved ? '#ef4444' : '#334155'}`,
        color: saved ? '#ef4444' : '#94a3b8',
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: busy ? 'wait' : 'pointer',
        fontSize: '1rem',
        opacity: busy ? 0.6 : 1,
        transition: 'transform 0.1s ease',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.9)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {saved ? '♥' : '♡'}
    </button>
  );
}
