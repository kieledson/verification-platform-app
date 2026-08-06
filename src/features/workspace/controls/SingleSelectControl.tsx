import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { AnswerOption } from '@/standard/schema/types'
import { pillStyle, sortOptionsForDisplay } from './pillStyle'

/** Above this many options, a wrapping row of pill chips eats too much
 * vertical space in the fixed dock (observed: an 8-option question pushed
 * to 4+ rows). At or below it — the common Yes/No or Yes/No/N-A shape, and
 * most real single-selects — chips stay: faster to tap, selected state
 * visible without opening anything. */
const DROPDOWN_THRESHOLD = 4

export function SingleSelectControl({
  options,
  value,
  onChange,
}: {
  options: AnswerOption[]
  value: string | undefined
  /** Called with the option value, or `''` when the user clicks the
   * already-selected pill again (deselect — no forced radio; pill mode
   * only, native selects have no equivalent deselect gesture). */
  onChange: (next: string) => void
}) {
  const ordered = sortOptionsForDisplay(options)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  if (ordered.length > DROPDOWN_THRESHOLD) {
    // A native <select>'s open list is rendered by the OS/browser — no
    // control over its corners, border or highlight colour, and no way to
    // make it open upward when the trigger sits near the bottom of the
    // fixed dock (it was overflowing past the tablet frame). This popover
    // is fully our own styling, opens above the trigger, and can match the
    // rest of the app.
    const selectedOption = ordered.find((o) => o.value === value)

    return (
      <div ref={wrapRef} style={{ position: 'relative', width: 340 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 340,
            height: 48,
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            padding: '0 15px',
            background: '#fff',
            border: '1px solid var(--border)',
            color: selectedOption ? 'var(--text-body)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {selectedOption ? localize(selectedOption.label) : 'Select an option'}
          </span>
          <Icon name={open ? 'chevron-down' : 'chevron-up'} size={16} style={{ flex: 'none', color: 'var(--text-muted)' }} />
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 6,
              width: 340,
              maxHeight: 260,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 8px 20px rgba(1,44,76,0.16)',
              zIndex: 20,
              padding: 6,
            }}
          >
            {ordered.map((opt) => {
              const selected = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(selected ? '' : opt.value)
                    setOpen(false)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 10px',
                    border: 'none',
                    borderRadius: 8,
                    background: selected ? 'var(--ocean-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13.5,
                    fontWeight: selected ? 700 : 500,
                    color: selected ? 'var(--ocean-deep)' : 'var(--text-body)',
                  }}
                >
                  {selected && <Icon name="check" size={13} style={{ flex: 'none', color: 'var(--ocean-deep)' }} />}
                  {localize(opt.label)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
      {ordered.map((opt) => {
        const selected = value === opt.value
        const label = localize(opt.label)
        return (
          <button
            key={opt.value}
            type="button"
            style={pillStyle(selected, label.length)}
            aria-pressed={selected}
            onClick={() => onChange(selected ? '' : opt.value)}
          >
            {selected && <Icon name="check" size={13} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
