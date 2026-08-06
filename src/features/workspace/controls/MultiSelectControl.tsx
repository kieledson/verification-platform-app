import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { AnswerOption } from '@/standard/schema/types'
import { pillStyle, sortOptionsForDisplay } from './pillStyle'

/** Above this many options, wrapping pill chips eat too much vertical
 * space in the fixed dock — same threshold as `SingleSelectControl`. A
 * native `<select multiple>` isn't a good fit here (clunky listbox,
 * non-obvious ctrl/cmd-click), so this opens a checklist popover from a
 * single-line trigger button instead. */
const DROPDOWN_THRESHOLD = 4

export function MultiSelectControl({
  options,
  value,
  onChange,
}: {
  options: AnswerOption[]
  value: string[] | undefined
  onChange: (next: string[]) => void
}) {
  const selectedValues = value ?? []
  const ordered = sortOptionsForDisplay(options)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  function toggle(optionValue: string) {
    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    onChange(next)
  }

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  if (ordered.length > DROPDOWN_THRESHOLD) {
    const summary =
      selectedValues.length === 0
        ? 'Select options'
        : ordered
            .filter((o) => selectedValues.includes(o.value))
            .map((o) => localize(o.label))
            .join(', ')

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
            color: selectedValues.length === 0 ? 'var(--text-muted)' : 'var(--text-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {summary}
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
              const selected = selectedValues.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
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
                  <span
                    style={{
                      flex: 'none',
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: selected ? 'none' : '1.5px solid var(--border-strong)',
                      background: selected ? 'var(--ocean-deep)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && <Icon name="check" size={12} style={{ color: '#fff' }} />}
                  </span>
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
        const selected = selectedValues.includes(opt.value)
        const label = localize(opt.label)
        return (
          <button
            key={opt.value}
            type="button"
            style={pillStyle(selected, label.length)}
            aria-pressed={selected}
            onClick={() => toggle(opt.value)}
          >
            {selected && <Icon name="check" size={13} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
