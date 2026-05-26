'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import {
  CURRENT_YEAR,
  DEFAULT_PREFERENCES,
  Preferences,
  loadPreferences,
  pushPreferencesToBackend,
  savePreferences,
} from '../../lib/preferences';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Genre = { id: number; name: string };

const STEPS = ['Genres', 'Filters', 'Review'] as const;
type StepIndex = 0 | 1 | 2;

export default function QuestionnairePage() {
  const { session } = useAuth();
  const [step, setStep] = useState<StepIndex>(0);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [genres, setGenres] = useState<Genre[] | null>(null);
  const [genresError, setGenresError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Prefill from localStorage on mount
  useEffect(() => {
    const existing = loadPreferences();
    if (existing) setPrefs(existing);
  }, []);

  // Load genres from backend on mount
  useEffect(() => {
    fetch(`${API_URL}/api/movies/genres`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setGenres(data.genres ?? []))
      .catch((err) => setGenresError(err.message));
  }, []);

  const canAdvance = useMemo(() => {
    if (step === 0) return prefs.favoriteGenres.length > 0;
    if (step === 1) return prefs.yearMin <= prefs.yearMax;
    return true;
  }, [step, prefs]);

  async function handleSubmit() {
    setSubmitting(true);
    setSaveError(null);
    savePreferences(prefs);

    if (session?.access_token) {
      try {
        const saved = await pushPreferencesToBackend(session.access_token, prefs);
        savePreferences(saved);
      } catch (err) {
        setSaveError(
          'Saved locally, but couldn\'t sync to your account: ' + (err as Error).message
        );
      }
    }

    setSubmitting(false);
    setSaved(true);
  }

  if (saved) {
    return (
      <SavedScreen
        prefs={prefs}
        genres={genres ?? []}
        syncedToCloud={Boolean(session)}
        warning={saveError}
        onEdit={() => {
          setSaved(false);
          setSaveError(null);
        }}
      />
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to home
        </Link>
        <h1 style={{ fontSize: '2rem', margin: '1rem 0 0.5rem' }}>
          Tell us what you like
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          A few quick questions so we can recommend movies you'll actually want to watch.
        </p>
      </header>

      <ProgressBar current={step} steps={STEPS} />

      <section
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          padding: '1.75rem',
          marginTop: '1.5rem',
        }}
      >
        {step === 0 && (
          <GenreStep
            genres={genres}
            error={genresError}
            selected={prefs.favoriteGenres}
            onChange={(favoriteGenres) => setPrefs({ ...prefs, favoriteGenres })}
          />
        )}

        {step === 1 && <FilterStep prefs={prefs} onChange={setPrefs} />}

        {step === 2 && <ReviewStep prefs={prefs} genres={genres ?? []} />}
      </section>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1.5rem',
        }}
      >
        <Button
          variant="secondary"
          onClick={() => setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s))}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < 2 ? (
          <Button
            onClick={() => setStep((s) => ((s + 1) as StepIndex))}
            disabled={!canAdvance}
          >
            Next →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save preferences'}
          </Button>
        )}
      </nav>
    </main>
  );
}

// --------------------- Steps ---------------------

function GenreStep({
  genres,
  error,
  selected,
  onChange,
}: {
  genres: Genre[] | null;
  error: string | null;
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Which genres do you love?</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Pick at least one. The more you pick, the broader your recommendations.
      </p>

      {error && <p style={{ color: '#f87171' }}>Couldn't load genres: {error}</p>}
      {!error && !genres && <p style={{ color: '#94a3b8' }}>Loading genres…</p>}

      {genres && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          {genres.map((g) => {
            const active = selected.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${active ? '#3b82f6' : '#334155'}`,
                  background: active ? '#1e3a8a' : '#0f172a',
                  color: active ? '#dbeafe' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                }}
              >
                {active ? '✓ ' : ''}
                {g.name}
              </button>
            );
          })}
        </div>
      )}

      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1rem' }}>
        {selected.length} selected
      </p>
    </div>
  );
}

function FilterStep({
  prefs,
  onChange,
}: {
  prefs: Preferences;
  onChange: (next: Preferences) => void;
}) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Set your filters</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Narrow things down so you only see movies that match your taste.
      </p>

      <Field label={`Release year — ${prefs.yearMin} to ${prefs.yearMax}`}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <NumberInput
            value={prefs.yearMin}
            min={1900}
            max={prefs.yearMax}
            onChange={(yearMin) => onChange({ ...prefs, yearMin })}
          />
          <span style={{ color: '#64748b' }}>→</span>
          <NumberInput
            value={prefs.yearMax}
            min={prefs.yearMin}
            max={CURRENT_YEAR}
            onChange={(yearMax) => onChange({ ...prefs, yearMax })}
          />
        </div>
      </Field>

      <Field label={`Minimum rating — ${prefs.minRating.toFixed(1)} / 10`}>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={prefs.minRating}
          onChange={(e) => onChange({ ...prefs, minRating: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
      </Field>

      <Field
        label={
          prefs.maxDuration
            ? `Max runtime — ${prefs.maxDuration} minutes`
            : 'Max runtime — no limit'
        }
      >
        <input
          type="range"
          min={60}
          max={240}
          step={5}
          value={prefs.maxDuration ?? 240}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange({ ...prefs, maxDuration: v >= 240 ? null : v });
          }}
          style={{ width: '100%' }}
        />
        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
          Slide all the way to the right to remove the limit.
        </p>
      </Field>
    </div>
  );
}

function ReviewStep({
  prefs,
  genres,
}: {
  prefs: Preferences;
  genres: Genre[];
}) {
  const selectedGenreNames = prefs.favoriteGenres
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Review your preferences</h2>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Looks good? Save and we'll use these to generate your recommendations.
      </p>

      <ReviewRow label="Favorite genres">
        {selectedGenreNames || <em style={{ color: '#94a3b8' }}>none</em>}
      </ReviewRow>
      <ReviewRow label="Release year range">
        {prefs.yearMin} – {prefs.yearMax}
      </ReviewRow>
      <ReviewRow label="Minimum rating">
        {prefs.minRating.toFixed(1)} / 10
      </ReviewRow>
      <ReviewRow label="Max runtime">
        {prefs.maxDuration ? `${prefs.maxDuration} minutes` : 'no limit'}
      </ReviewRow>
    </div>
  );
}

function SavedScreen({
  prefs,
  genres,
  syncedToCloud,
  warning,
  onEdit,
}: {
  prefs: Preferences;
  genres: Genre[];
  syncedToCloud: boolean;
  warning: string | null;
  onEdit: () => void;
}) {
  const selectedGenreNames = prefs.favoriteGenres
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✓</div>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>Preferences saved!</h1>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
        {syncedToCloud
          ? 'Synced to your account — your preferences follow you across devices.'
          : "Stored locally. Sign in to sync them to your account."}
      </p>
      {warning && (
        <div
          style={{
            background: '#78350f',
            color: '#fde68a',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            margin: '1rem 0',
            fontSize: '0.85rem',
          }}
        >
          {warning}
        </div>
      )}

      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          margin: '2rem 0',
          textAlign: 'left',
        }}
      >
        <p style={{ color: '#cbd5e1', margin: 0 }}>
          <strong>Genres:</strong> {selectedGenreNames || 'none'}
        </p>
        <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0' }}>
          <strong>Year range:</strong> {prefs.yearMin}–{prefs.yearMax}
        </p>
        <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0' }}>
          <strong>Minimum rating:</strong> {prefs.minRating.toFixed(1)}
        </p>
        <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0' }}>
          <strong>Max runtime:</strong>{' '}
          {prefs.maxDuration ? `${prefs.maxDuration} min` : 'no limit'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onEdit}>
          Edit preferences
        </Button>
        <Link href="/recommendations" style={{ textDecoration: 'none' }}>
          <Button>See my recommendations →</Button>
        </Link>
      </div>
    </main>
  );
}

// --------------------- Reusable UI ---------------------

function ProgressBar({ current, steps }: { current: number; steps: readonly string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: done ? '#22c55e' : active ? '#3b82f6' : '#334155',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              style={{
                color: active ? '#f1f5f9' : '#94a3b8',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
              }}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: 2,
                  background: done ? '#22c55e' : '#334155',
                  flex: 1,
                  marginLeft: '0.25rem',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n)) onChange(n);
      }}
      style={{
        background: '#0f172a',
        border: '1px solid #334155',
        color: '#f1f5f9',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.4rem',
        width: 100,
        fontSize: '0.9rem',
      }}
    />
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid #334155',
        gap: '1rem',
      }}
    >
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#f1f5f9', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const base = {
    padding: '0.6rem 1.25rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: '1px solid',
  };
  const styles =
    variant === 'primary'
      ? { ...base, background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' }
      : { ...base, background: 'transparent', borderColor: '#334155', color: '#cbd5e1' };

  return (
    <button onClick={onClick} disabled={disabled} style={styles}>
      {children}
    </button>
  );
}
