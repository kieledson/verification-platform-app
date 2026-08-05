import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { AnswerOption } from '@/standard/schema/types'
import { pillStyle, sortOptionsForDisplay } from './pillStyle'

/** Above this many options, a row of pills wraps into a "big stack of
 * buttons" — switch to a native dropdown instead. At or below it (the
 * common Yes/No or Yes/No/N-A shape), pills stay: they're faster to tap
 * and the selected state is visible without opening anything. */
const DROPDOWN_THRESHOLD = 3

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
          height: 34,
          borderRadius: 8,
          fontSize: 13.5,
          padding: '0 12px',
          background: 'var(--gray-100)',
          border: '1px solid var(--border)',
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
        return (
          <button
            key={opt.value}
            type="button"
            style={pillStyle(selected)}
            aria-pressed={selected}
            onClick={() => onChange(selected ? '' : opt.value)}
          >
            {selected && <Icon name="check" size={13} />}
            {localize(opt.label)}
          </button>
        )
      })}
    </div>
  )
}
