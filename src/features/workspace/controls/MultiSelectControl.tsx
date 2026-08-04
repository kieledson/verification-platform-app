import { localize } from '@/standard/localize'
import type { AnswerOption } from '@/standard/schema/types'
import { pillStyle } from './pillStyle'

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

  function toggle(optionValue: string) {
    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
      {options.map((opt) => {
        const selected = selectedValues.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            style={pillStyle(selected)}
            aria-pressed={selected}
            onClick={() => toggle(opt.value)}
          >
            {localize(opt.label)}
          </button>
        )
      })}
    </div>
  )
}
