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
      style={{ width: 340, height: 34, borderRadius: 8, background: 'var(--gray-100)', border: '1px solid transparent' }}
    />
  )
}
