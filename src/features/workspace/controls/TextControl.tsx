import { Input } from '@/design-system/components'

/** Plain single-line text. `question.args` carries no unit convention
 * anywhere in the real data (only `MODAL:3`/`SELECTONLY`/`MULTILINE`
 * tokens), and no TEXT question's own wording implies one the way several
 * NUMBER questions do (see `inferUnit`) — so this stays plain. */
export function TextControl({
  value,
  onChange,
  onEnter,
  placeholder,
}: {
  value: string | undefined
  onChange: (next: string) => void
  /** Fires on Enter, matching the dock's "Enter advances" behaviour. */
  onEnter?: () => void
  placeholder?: string
}) {
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      placeholder={placeholder ?? 'Type your answer'}
      style={{
        width: 340,
        height: 48,
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 600,
        background: '#fff',
        border: '1px solid var(--border)',
      }}
    />
  )
}
