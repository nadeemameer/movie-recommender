'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';

export default function SignUpPage() {
  const { signUp, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (user) {
    return (
      <AuthShell title="You're already signed in">
        <p style={{ color: '#94a3b8' }}>
          Signed in as <strong>{user.email}</strong>.
        </p>
        <Link href="/" style={{ color: '#60a5fa' }}>
          Go to home →
        </Link>
      </AuthShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setInfo(
      'Check your inbox for a confirmation email. After confirming, sign in to continue. ' +
        '(If your Supabase project has email confirmation disabled, you can sign in right away.)'
    );
  }

  return (
    <AuthShell title="Create your account">
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '1.5rem' }}>
        Save your preferences across devices and rate movies to improve your recommendations.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField label="Email">
          <Input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </FormField>

        <FormField label="Password">
          <Input
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </FormField>

        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="info">{info}</Alert>}

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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ color: '#94a3b8', marginTop: '1.5rem', fontSize: '0.9rem' }}>
        Already have an account?{' '}
        <Link href="/auth/sign-in" style={{ color: '#60a5fa' }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

// ---------- shared bits (kept in this file for simplicity) ----------

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 440, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{title}</h1>
      {children}
    </main>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        background: '#0f172a',
        border: '1px solid #334155',
        color: '#f1f5f9',
        padding: '0.65rem 0.85rem',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        outline: 'none',
      }}
    />
  );
}

function Alert({
  tone,
  children,
}: {
  tone: 'error' | 'info';
  children: React.ReactNode;
}) {
  const styles =
    tone === 'error'
      ? { background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b' }
      : { background: '#1e3a8a', color: '#dbeafe', border: '1px solid #2563eb' };
  return (
    <div
      style={{
        ...styles,
        padding: '0.75rem 0.9rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </div>
  );
}
