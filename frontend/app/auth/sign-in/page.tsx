'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';

export default function SignInPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }
    // The auth state listener will redirect via the effect above.
  }

  return (
    <main style={{ maxWidth: 440, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome back</h1>
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '1.5rem' }}>
        Sign in to sync your preferences and saved movies.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Email</span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            style={{
              background: '#7f1d1d',
              color: '#fecaca',
              border: '1px solid #991b1b',
              padding: '0.75rem 0.9rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ color: '#94a3b8', marginTop: '1.5rem', fontSize: '0.9rem' }}>
        New here?{' '}
        <Link href="/auth/sign-up" style={{ color: '#60a5fa' }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#f1f5f9',
  padding: '0.65rem 0.85rem',
  borderRadius: '0.5rem',
  fontSize: '0.95rem',
  outline: 'none',
};
