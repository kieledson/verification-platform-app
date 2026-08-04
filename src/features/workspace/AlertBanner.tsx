import { Icon } from '@/design-system/components'

/** Advisory-only notification banner (README "Alerts"): 43 questions in the
 * standard carry a `NotificationType = Alert`. Never blocks submission and
 * never shown as a validation error — purely informational, rendered full
 * width beneath the question row that fired it. */
export function AlertBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        margin: '2px 0 8px',
        padding: '8px 12px',
        background: 'var(--highlight, #FCE9A6)',
        border: '1px solid #E8CF7A',
        borderRadius: 8,
      }}
    >
      <Icon name="alert-triangle" size={14} style={{ color: 'var(--sand, #634F1D)', marginTop: 1, flex: 'none' }} />
      <div style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--sand-deep, #3B2C15)' }}>{text}</div>
    </div>
  )
}
