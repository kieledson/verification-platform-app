import { Icon } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'

export function OfflineBanner() {
  const connectionMode = useUiStore((s) => s.connectionMode)
  if (connectionMode !== 'offline') return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        margin: '0 0 16px',
        background: 'var(--highlight, #FCE9A6)',
        border: '1px solid #E8CF7A',
        borderRadius: 10,
      }}
    >
      <Icon name="cloud-off" size={16} style={{ color: 'var(--sand, #B08900)', marginTop: 2 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sand-deep, #6B4E00)' }}>
          You're offline
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--sand-deep, #6B4E00)' }}>
          Assessments stay on this tablet and upload automatically the next time you have wifi.
        </div>
      </div>
    </div>
  )
}
