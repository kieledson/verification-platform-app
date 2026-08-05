import { Input } from '@/design-system/components'
import { inferUnit } from '@/standard/inferUnit'

const WIDTH = 220

export function NumberControl({
  value,
  onChange,
  onEnter,
  questionText,
}: {
  value: number | string | undefined
  /** Emits `''` (rather than `NaN`) when the field is cleared — a stored
   * `number` is always treated as "answered" by the effectively-answered
   * check regardless of its value (see `isEffectivelyAnswered` in
   * `resolveVisibility.ts`), so `NaN` would wrongly read as answered. An
   * empty string correctly reads as unanswered. */
  onChange: (next: number | string) => void
  /** Fires on Enter, matching the dock's "Enter advances" behaviour. */
  onEnter?: () => void
  /** Used only to infer a display unit (e.g. "ha", "mt") from the
   * question's own wording — see `inferUnit`. */
  questionText?: string
}) {
  const unit = questionText ? inferUnit(questionText) : null

  return (
    <div style={{ position: 'relative', width: WIDTH }}>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.()
        }}
        placeholder="Type your answer"
        style={{
          width: WIDTH,
          height: 48,
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          background: '#fff',
          border: '1px solid var(--border)',
          paddingRight: unit ? 15 + unit.length * 8 : undefined,
        }}
      />
      {unit && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 15,
            top: 0,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          {unit}
        </span>
      )}
    </div>
  )
}
