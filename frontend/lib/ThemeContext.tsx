'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Accent = 'blue' | 'purple' | 'red' | 'green';

export const ACCENT_OPTIONS: { id: Accent; label: string; color: string }[] = [
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'red', label: 'Red', color: '#ef4444' },
  { id: 'green', label: 'Green', color: '#10b981' },
];

const STORAGE_KEY = 'movie-recommender-accent';
const DEFAULT_ACCENT: Accent = 'blue';

type Ctx = {
  accent: Accent;
  setAccent: (a: Accent) => void;
};

const ThemeContext = createContext<Ctx | undefined>(undefined);

function isAccent(s: string | null): s is Accent {
  return s === 'blue' || s === 'purple' || s === 'red' || s === 'green';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);

  // Hydrate from localStorage on mount (after SSR to avoid hydration mismatch)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAccent(stored)) {
      setAccentState(stored);
      document.documentElement.dataset.accent = stored;
    } else {
      document.documentElement.dataset.accent = DEFAULT_ACCENT;
    }
  }, []);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, a);
      document.documentElement.dataset.accent = a;
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ accent, setAccent }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
