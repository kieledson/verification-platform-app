import { Input } from '@/design-system/components'

export function DateTimeControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (next: string) => void
}) {
  return (
    <Input
      type="datetime-local"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
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
