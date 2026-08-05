import { Textarea } from '@/design-system/components'

export function NarrativeControl({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <Textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder={placeholder ?? 'Type your answer'}
      style={{
        width: 380,
        borderRadius: 10,
        background: '#fff',
        border: '1px solid var(--border)',
        padding: '11px 14px',
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'var(--text-body)',
        resize: 'vertical',
      }}
    />
  )
}
