import { Input } from '@/design-system/components'

export function NumberControl({
  value,
  onChange,
}: {
  value: number | string | undefined
  /** Emits `''` (rather than `NaN`) when the field is cleared — a stored
   * `number` is always treated as "answered" by the effectively-answered
   * check regardless of its value (see `isEffectivelyAnswered` in
   * `resolveVisibility.ts`), so `NaN` would wrongly read as answered. An
   * empty string correctly reads as unanswered. */
  onChange: (next: number | string) => void
}) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      placeholder="Type your answer"
      style={{ width: 340, height: 34, borderRadius: 8, background: 'var(--gray-100)', border: '1px solid transparent' }}
    />
  )
}
