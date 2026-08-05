import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { AnswerOption } from '@/standard/schema/types'
import { pillStyle, sortOptionsForDisplay } from './pillStyle'

export function SingleSelectControl({
  options,
  value,
  onChange,
}: {
  options: AnswerOption[]
  value: string | undefined
  /** Called with the option value, or `''` when the user clicks the
   * already-selected pill again (deselect — no forced radio). */
  onChange: (next: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
      {sortOptionsForDisplay(options).map((opt) => {
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
