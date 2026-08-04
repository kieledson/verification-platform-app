import type * as React from 'react'
import type { AnswerOption } from '@/standard/schema/types'

/** Source data lists options in whatever order the questionnaire's table
 * rows happened to be authored in — some questions list `YES` before `NO`,
 * others the reverse, so the pills visually flip sides question to question.
 * Reorders only the common short/binary values to one canonical order;
 * anything else keeps its original relative order (stable sort). */
const CANONICAL_ORDER: Record<string, number> = { YES: 0, NO: 1, 'N/A': 2 }

export function sortOptionsForDisplay(options: AnswerOption[]): AnswerOption[] {
  return [...options].sort((a, b) => {
    const ra = CANONICAL_ORDER[a.value]
    const rb = CANONICAL_ORDER[b.value]
    if (ra !== undefined && rb !== undefined) return ra - rb
    if (ra !== undefined) return -1
    if (rb !== undefined) return 1
    return 0
  })
}

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
    fontWeight: 500,
    border: selected ? '1px solid var(--ocean)' : '1px solid var(--border)',
    background: selected ? 'var(--ocean)' : '#fff',
    color: selected ? '#fff' : 'var(--text-body)',
    cursor: 'pointer',
    transition: 'background .15s ease, border-color .15s ease, color .15s ease',
    lineHeight: 1,
  }
}
