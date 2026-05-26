'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { SavedMovie, useFavorites } from '../../lib/FavoritesContext';
import RatingStars from '../components/RatingStars';

// (Link is used in the sign-in nudge below; clicking a saved movie's poster
//  also navigates to its details page.)

type SortKey = 'recent' | 'rating' | 'title';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading } = useFavorites();
  const [sort, setSort] = useState<SortKey>('recent');
  const [filter, setFilter] = useState<'all' | 'rated' | 'unrated'>('all');

  const items = useMemo(() => {
    let list = [...favorites];
    if (filter === 'rated') list = list.filter((f) => f.userRating != null);
    if (filter === 'unrated') list = list.filter((f) => f.userRating == null);

    if (sort === 'recent') {
      list.sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.userRating ?? -1) - (a.userRating ?? -1));
    } else if (sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [favorites, sort, filter]);

  if (authLoading) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Sign in to see your favorites</h1>
        <p style={{ color: '#94a3b8' }}>
          Favorites are tied to your account, so they follow you across devices.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link href="/auth/sign-in" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>
          </Link>
          <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #475569',
                padding: '0.85rem 1.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Create an account
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Your Favorites</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          {favorites.length === 0
            ? 'No saved movies yet. Tap the heart on any movie to save it.'
            : `${favorites.length} saved movie${favorites.length === 1 ? '' : 's'}.`}
        </p>
      </header>

      {favorites.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
            alignItems: 'center',
          }}
        >
          <Select
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'recent', label: 'Recently saved' },
              { value: 'rating', label: 'My rating' },
              { value: 'title', label: 'Title (A–Z)' },
            ]}
          />
          <Select
            label="Show"
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'rated', label: 'Rated' },
              { value: 'unrated', label: 'Unrated' },
            ]}
          />
        </div>
      )}

      {loading && favorites.length === 0 && (
        <p style={{ color: '#94a3b8' }}>Loading your favorites…</p>
      )}

      {favorites.length > 0 && items.length === 0 && (
        <p style={{ color: '#94a3b8' }}>No favorites match the current filter.</p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {items.map((fav) => (
          <FavoriteRow key={fav.itemId} fav={fav} />
        ))}
      </div>
    </main>
  );
}

function FavoriteRow({ fav }: { fav: SavedMovie }) {
  const { updateMovie, removeMovie } = useFavorites();
  const [expanded, setExpanded] = useState(Boolean(fav.userReview));
  const [draftReview, setDraftReview] = useState(fav.userReview ?? '');
  const [savingReview, setSavingReview] = useState(false);

  async function saveReview() {
    setSavingReview(true);
    try {
      await updateMovie(fav.itemId, { userReview: draftReview });
    } finally {
      setSavingReview(false);
    }
  }

  return (
    <article
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem' }}>
        <Link
          href={`/movie/${fav.itemId}`}
          style={{
            width: 80,
            minWidth: 80,
            aspectRatio: '2 / 3',
            background: '#0f172a',
            borderRadius: '0.4rem',
            overflow: 'hidden',
            display: 'block',
          }}
        >
          {fav.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fav.posterUrl}
              alt={fav.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </Link>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.3 }}>
            {fav.title}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0.5rem' }}>
            Saved {new Date(fav.savedAt).toLocaleDateString()}
            {fav.score != null && ` · ${Math.round(fav.score)}% match`}
          </p>
          <div style={{ marginTop: 'auto' }}>
            <RatingStars
              value={fav.userRating}
              onChange={(rating) => updateMovie(fav.itemId, { userRating: rating })}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '0 0.875rem 0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {expanded ? (
          <>
            <textarea
              value={draftReview}
              onChange={(e) => setDraftReview(e.target.value)}
              placeholder="Add your notes about this movie…"
              rows={3}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#f1f5f9',
                borderRadius: '0.4rem',
                padding: '0.5rem 0.65rem',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <SmallButton
                onClick={() => {
                  setDraftReview(fav.userReview ?? '');
                  setExpanded(false);
                }}
              >
                Cancel
              </SmallButton>
              <SmallButton
                primary
                disabled={savingReview || draftReview === (fav.userReview ?? '')}
                onClick={async () => {
                  await saveReview();
                  setExpanded(false);
                }}
              >
                {savingReview ? 'Saving…' : 'Save note'}
              </SmallButton>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {fav.userReview ? (
              <p
                style={{
                  color: '#cbd5e1',
                  fontSize: '0.85rem',
                  margin: 0,
                  flex: 1,
                  cursor: 'pointer',
                }}
                onClick={() => setExpanded(true)}
              >
                "{fav.userReview}"
              </p>
            ) : (
              <SmallButton onClick={() => setExpanded(true)}>+ Add note</SmallButton>
            )}
            <SmallButton danger onClick={() => removeMovie(fav.itemId)}>
              Remove
            </SmallButton>
          </div>
        )}
      </div>
    </article>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          color: '#f1f5f9',
          padding: '0.4rem 0.6rem',
          borderRadius: '0.4rem',
          fontSize: '0.85rem',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallButton({
  children,
  onClick,
  primary,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  let bg = 'transparent';
  let color = '#cbd5e1';
  let border = '#334155';
  if (primary) {
    bg = '#3b82f6';
    color = '#fff';
    border = '#3b82f6';
  } else if (danger) {
    color = '#fca5a5';
    border = '#7f1d1d';
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        padding: '0.4rem 0.75rem',
        borderRadius: '0.4rem',
        fontSize: '0.8rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
