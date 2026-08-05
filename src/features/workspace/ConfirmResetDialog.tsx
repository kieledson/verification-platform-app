import { Icon } from '@/design-system/components'

/** Fires when changing (not first-answering) a single-select whose change
 * would hide dependants that already hold answers — per the Assessment
 * Workspace v2 handoff §D, with the exact reset count computed by
 * `assessmentStore.previewResetCount`. */
export function ConfirmResetDialog({
  questionText,
  count,
  onConfirm,
  onCancel,
}: {
  questionText: string
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(1,44,76,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm answer change"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 430,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 24px rgba(1,44,76,0.18)',
          padding: '22px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'var(--rating-good-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <Icon name="alert-triangle" size={17} style={{ color: 'var(--sand)' }} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--text-strong)' }}>
            This change resets other answers
          </span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)', margin: 0 }}>
          There are dependent questions based on the answer to &ldquo;{questionText}&rdquo;. Changing it will reset{' '}
          {count} {count === 1 ? 'answer' : 'answers'} you have already recorded. Do you wish to continue?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 38,
              padding: '0 18px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-body)',
              cursor: 'pointer',
            }}
          >
            Keep my answer
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: 38,
              padding: '0 18px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--ocean)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Change it anyway
          </button>
        </div>
      </div>
    </div>
  )
}
