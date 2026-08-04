import { Input } from '@/design-system/components'
import { inferUnit } from '@/standard/inferUnit'

export function NumberControl({
  value,
  onChange,
  questionText,
}: {
  value: number | string | undefined
  /** Emits `''` (rather than `NaN`) when the field is cleared — a stored
   * `number` is always treated as "answered" by the effectively-answered
   * check regardless of its value (see `isEffectivelyAnswered` in
   * `resolveVisibility.ts`), so `NaN` would wrongly read as answered. An
   * empty string correctly reads as unanswered. */
  onChange: (next: number | string) => void
  /** Used only to infer a display unit (e.g. "ha", "mt") from the
   * question's own wording — see `inferUnit`. */
  questionText?: string
}) {
  const unit = questionText ? inferUnit(questionText) : null

  return (
    <div style={{ position: 'relative', width: 340 }}>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Type your answer"
        style={{
          width: 340,
          height: 34,
          borderRadius: 8,
          fontSize: 13.5,
          background: 'var(--gray-100)',
          border: '1px solid var(--border)',
          paddingRight: unit ? 14 + unit.length * 7.5 : undefined,
        }}
      />
      {unit && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: 12.5,
            color: 'var(--text-muted)',
          }}
        >
          {unit}
        </span>
      )}
    </div>
  )
}
