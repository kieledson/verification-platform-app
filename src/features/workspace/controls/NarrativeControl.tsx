import { Textarea } from '@/design-system/components'

export function NarrativeControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (next: string) => void
}) {
  return (
    <Textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder="Type your answer"
      style={{
        width: 340,
        borderRadius: 8,
        background: 'var(--gray-100)',
        border: '1px solid transparent',
        resize: 'vertical',
      }}
    />
  )
}
