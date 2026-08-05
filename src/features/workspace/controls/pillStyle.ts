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

/** Shared chip styling for single/multi-select answer options, per the
 * Assessment Workspace v2 handoff §C: 44px tall pills, `min-width: 92px`
 * for short (<=4 char) labels like Yes/No/N/A so they align down the dock.
 * Selected = ocean fill + white text + shadow; unselected = white + border. */
export function pillStyle(selected: boolean, labelLength = 0): React.CSSProperties {
  return {
    minWidth: labelLength <= 4 ? 92 : 'auto',
    height: 44,
    padding: '0 18px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontSize: 14,
    fontWeight: selected ? 700 : 600,
    border: selected ? '1px solid var(--ocean)' : '1px solid var(--border)',
    background: selected ? 'var(--ocean)' : '#fff',
    color: selected ? '#fff' : 'var(--text-body)',
    boxShadow: selected ? '0 4px 12px rgba(1,44,76,0.22)' : 'none',
    cursor: 'pointer',
    transition: 'all 130ms ease',
  }
}
