import { useNavigate } from 'react-router-dom'
import { Icon } from '@/design-system/components'
import { formatBytes } from '@/lib/formatBytes'
import { useUiStore } from '@/state/uiStore'
import type { AssessmentRecord } from '@/db/schema'
import type { SiteRecord } from '@/db/schema'

const STATUS_ACCENT: Record<AssessmentRecord['status'], string> = {
  draft: 'var(--seastar-light, #F0A875)',
  'ready-to-sync': 'var(--ocean-light, #5FB3EF)',
  'pending-upload': 'var(--ocean-light, #5FB3EF)',
  synced: 'var(--success, #4C9F38)',
}

const STATUS_LABEL: Record<AssessmentRecord['status'], string> = {
  draft: 'In progress',
  'ready-to-sync': 'Ready to sync',
  'pending-upload': 'Ready to sync',
  synced: 'Submitted',
}

function syncState(record: AssessmentRecord, online: boolean) {
  if (record.status === 'synced') {
    return { label: 'Synced', icon: 'check-circle-2', color: 'var(--success)' }
  }
  if (!online) {
    return { label: 'On this tablet', icon: 'cloud-off', color: 'var(--text-muted)' }
  }
  if (record.status === 'pending-upload') {
    return { label: 'Uploading', icon: 'upload-cloud', color: 'var(--ocean)' }
  }
  return { label: 'On this tablet', icon: 'cloud-off', color: 'var(--text-muted)' }
}

export function AssessmentRow({ record, site }: { record: AssessmentRecord; site?: SiteRecord }) {
  const navigate = useNavigate()
  const online = useUiStore((s) => s.connectionMode !== 'offline')
  const sync = syncState(record, online)
  const started = new Date(record.createdAt)

  return (
    <div
      onClick={() => navigate(`/assessments/${record.id}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 168px 140px 190px 132px',
        gap: 18,
        alignItems: 'center',
        background: '#fff',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${STATUS_ACCENT[record.status]}`,
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 10,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(1,44,76,0.06)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15.5 }}>{site?.farmName ?? record.farmSiteId}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'var(--gray-100)',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {site?.referenceCode ?? record.farmSiteId}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{site?.region}</div>
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Group
        </div>
        <div>{site?.groupName ?? record.groupId}</div>
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Started
        </div>
        <div>
          {started.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })},{' '}
          {started.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {STATUS_LABEL[record.status]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 999 }}>
            <div
              style={{
                width: `${record.progressPct}%`,
                height: '100%',
                background: STATUS_ACCENT[record.status],
                borderRadius: 999,
              }}
            />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{record.progressPct}%</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: sync.color, fontWeight: 600, fontSize: 12.5 }}>
          <Icon name={sync.icon} size={14} />
          {sync.label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatBytes(record.byteSize)} on device</div>
      </div>
    </div>
  )
}
