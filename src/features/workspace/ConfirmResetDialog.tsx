import { Button, Icon } from '@/design-system/components'

/**
 * Production copy, verbatim (README "The dependency engine" §3): the design
 * bundle describes this dialog but does not implement it — this is the
 * add-on referenced there.
 */
const CONFIRM_TEXT =
  'There are dependent questions which are based on the answer to this question. ' +
  'By changing the answer to this question, all dependent items will be reset. ' +
  'Do you wish to continue?'

export function ConfirmResetDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(1,44,76,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm answer change"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          background: '#fff',
          borderRadius: 12,
          padding: '22px 24px',
          boxShadow: '0 14px 32px rgba(1,44,76,0.22)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <Icon name="alert-triangle" size={20} style={{ color: 'var(--seastar)', flex: 'none', marginTop: 2 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--text-body)' }}>{CONFIRM_TEXT}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
