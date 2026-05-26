'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { ACCENT_OPTIONS, useTheme } from '../../lib/ThemeContext';
import SearchBox from './SearchBox';

export default function TopNav() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--color-bg-elevated)',
        background: 'var(--color-bg-deep)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <Link
          href="/"
          style={{
            color: 'var(--color-text)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.05rem',
            flexShrink: 0,
          }}
        >
          🎬 <span className="brand-text">Movie Recommender</span>
        </Link>

        {/* Desktop nav */}
        <div className="desktop-nav">
          <SearchBox />
          <NavLink href="/">Home</NavLink>
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/recommendations">For You</NavLink>
          <NavLink href="/favorites">Favorites</NavLink>

          <ThemePicker />

          <div
            style={{
              width: 1,
              height: 20,
              background: 'var(--color-border)',
            }}
          />

          {loading ? (
            <span style={{ color: 'var(--color-text-subtle)', fontSize: '0.85rem' }}>…</span>
          ) : user ? (
            <>
              <span
                className="nav-email"
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  maxWidth: 130,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.email ?? ''}
              >
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                style={ghostBtn}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink href="/auth/sign-in">Sign in</NavLink>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}>
                <button style={primaryBtn}>Sign up</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="mobile-toggle"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.6rem',
            cursor: 'pointer',
            fontSize: '1.1rem',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="mobile-drawer"
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '0.75rem var(--page-padding-x) 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <SearchBox />
          <MobileLink href="/" onClick={() => setMobileOpen(false)}>
            Home
          </MobileLink>
          <MobileLink href="/browse" onClick={() => setMobileOpen(false)}>
            Browse
          </MobileLink>
          <MobileLink href="/recommendations" onClick={() => setMobileOpen(false)}>
            For You
          </MobileLink>
          <MobileLink href="/favorites" onClick={() => setMobileOpen(false)}>
            Favorites
          </MobileLink>
          <ThemePicker />
          {!loading && user && (
            <button onClick={() => signOut()} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>
              Sign out · {user.email}
            </button>
          )}
          {!loading && !user && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/auth/sign-in" style={{ textDecoration: 'none', flex: 1 }}>
                <button style={{ ...ghostBtn, width: '100%' }}>Sign in</button>
              </Link>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none', flex: 1 }}>
                <button style={{ ...primaryBtn, width: '100%' }}>Sign up</button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        color: 'var(--color-text)',
        textDecoration: 'none',
        fontSize: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--color-bg-elevated)',
      }}
    >
      {children}
    </Link>
  );
}

function ThemePicker() {
  const { accent, setAccent } = useTheme();
  return (
    <div
      style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}
      role="radiogroup"
      aria-label="Accent color"
    >
      {ACCENT_OPTIONS.map((opt) => {
        const isActive = accent === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setAccent(opt.id)}
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label} accent`}
            title={opt.label}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: opt.color,
              border: isActive
                ? '2px solid var(--color-text)'
                : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              boxShadow: isActive ? `0 0 0 1px ${opt.color}55` : 'none',
              transition: 'transform 0.15s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  padding: '0.4rem 0.95rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  padding: '0.4rem 0.95rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
};
