import type * as React from 'react'

/** Shared pill styling for single/multi-select answer options — 32px tall,
 * 8px radius, `min-width: 78px` so short labels (Yes/No/N/A) align down the
 * page. Selected = ocean fill + white text; unselected = white + border. */
export function pillStyle(selected: boolean): React.CSSProperties {
  return {
    minWidth: 78,
    height: 32,
    padding: '0 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: selected ? '1px solid var(--ocean)' : '1px solid var(--border)',
    background: selected ? 'var(--ocean)' : '#fff',
    color: selected ? '#fff' : 'var(--text-body)',
    cursor: 'pointer',
    transition: 'background .15s ease, border-color .15s ease, color .15s ease',
    lineHeight: 1,
  }
}
