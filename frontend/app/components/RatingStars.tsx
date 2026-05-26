'use client';

import { useState } from 'react';

export default function RatingStars({
  value,
  onChange,
  size = 'md',
  readOnly = false,
}: {
  value: number | null;
  onChange?: (rating: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  const fontSize = size === 'sm' ? '0.95rem' : size === 'lg' ? '1.5rem' : '1.15rem';

  return (
    <div
      style={{ display: 'inline-flex', gap: '0.15rem' }}
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onClick={(e) => {
              e.preventDefault();
              if (readOnly || !onChange) return;
              onChange(value === n ? null : n);
            }}
            title={readOnly ? `${value ?? 0} / 5` : `Rate ${n}`}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.1rem',
              cursor: readOnly ? 'default' : 'pointer',
              color: active ? '#fbbf24' : '#475569',
              fontSize,
              lineHeight: 1,
            }}
          >
            {active ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}
