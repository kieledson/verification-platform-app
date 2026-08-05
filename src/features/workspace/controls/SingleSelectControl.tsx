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

  if (ordered.length > DROPDOWN_THRESHOLD) {
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 340,
          height: 48,
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          padding: '0 15px',
          background: '#fff',
          border: '1px solid var(--border)',
          color: 'var(--text-body)',
          cursor: 'pointer',
        }}
      >
        <option value="" disabled>
          Select an option
        </option>
        {ordered.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {localize(opt.label)}
          </option>
        ))}
      </select>
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
