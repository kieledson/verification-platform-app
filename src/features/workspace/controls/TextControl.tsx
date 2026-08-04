import { Input } from '@/design-system/components'

/** Plain single-line text. The build brief calls for an in-field unit
 * suffix driven by `question.args`, but no unit convention exists anywhere
 * in the actual generated standard data (`args` only ever carries things
 * like `MODAL:3`, `SELECTONLY`, `MULTILINE` — never a unit token) — so this
 * intentionally stays plain text/number rather than guessing at a format
 * that isn't present in the real data. */
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
      style={{ width: 340, height: 34, borderRadius: 8, background: 'var(--gray-100)', border: '1px solid transparent' }}
    />
  )
}
