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

/** The completion column (progress bar) and the disposition column (this
 * function) are deliberately separate axes: completion tracks how many
 * questions are answered, disposition tracks what will happen to the record
 * next. Collapsing them used to produce contradictory-looking text — a
 * "Ready to sync" heading over an "On this tablet" line for the same row.
 * Now there's exactly one place that names the record's disposition. */
function disposition(record: AssessmentRecord, online: boolean) {
  if (record.status === 'synced') {
    return { label: 'Synced', icon: 'check-circle-2', color: 'var(--success)' }
  }
  if (record.status === 'pending-upload') {
    return online
      ? { label: 'Uploading', icon: 'upload-cloud', color: 'var(--ocean)' }
      : { label: 'Waiting for wifi', icon: 'cloud-off', color: 'var(--text-muted)' }
  }
  if (record.status === 'ready-to-sync') {
    return { label: 'Ready to finalise', icon: 'cloud-off', color: 'var(--text-muted)' }
  }
  return { label: 'On this tablet', icon: 'cloud-off', color: 'var(--text-muted)' }
}

export function AssessmentRow({ record, site }: { record: AssessmentRecord; site?: SiteRecord }) {
  const navigate = useNavigate()
  const online = useUiStore((s) => s.connectionMode !== 'offline')
  const sync = disposition(record, online)
  const complete = record.progressPct >= 100
  const started = new Date(record.createdAt)
  const startedLabel = `${started.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}, ${started.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`

  return (
    <div
      onClick={() => navigate(`/assessments/${record.id}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 190px 132px',
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
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          {[site?.region, site?.groupName ?? record.groupId, `Started ${startedLabel}`].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {complete ? 'Complete' : 'In progress'}
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
