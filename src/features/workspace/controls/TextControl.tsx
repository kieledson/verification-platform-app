import { Input } from '@/design-system/components'

/** Plain single-line text. `question.args` carries no unit convention
 * anywhere in the real data (only `MODAL:3`/`SELECTONLY`/`MULTILINE`
 * tokens), and no TEXT question's own wording implies one the way several
 * NUMBER questions do (see `inferUnit`) — so this stays plain. */
export function TextControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (next: string) => void
}) {
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer"
      style={{
        width: 340,
        height: 34,
        borderRadius: 8,
        fontSize: 13.5,
        background: 'var(--gray-100)',
        border: '1px solid var(--border)',
      }}
    />
  )
}
