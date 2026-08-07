import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Icon, DataTable, type DataTableColumn } from '@/design-system/components'
import { OfflineBanner } from '@/features/assessment-list/OfflineBanner'
import { NewAssessmentDialog } from '@/features/assessment-list/NewAssessmentDialog'
import { AssessmentSnapshotPanel } from '@/features/assessment-list/AssessmentSnapshotPanel'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import { formatBytes } from '@/lib/formatBytes'
import * as sitesRepo from '@/db/repositories/sites'
import type { AssessmentRecord, SiteRecord } from '@/db/schema'

const STATUS_ACCENT: Record<AssessmentRecord['status'], string> = {
  draft: 'var(--seastar-light, #F0A875)',
  'ready-to-sync': 'var(--ocean-light, #5FB3EF)',
  'pending-upload': 'var(--ocean-light, #5FB3EF)',
  synced: 'var(--success, #4C9F38)',
}

/** The completion axis (how many questions are answered) and the disposition
 * axis (what happens to the record next) are deliberately separate — see
 * the withdrawn `AssessmentRow.tsx`'s original note. Collapsing them used to
 * produce contradictory-looking text. */
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

export function AssessmentListPage() {
  const navigate = useNavigate()
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)
  const online = useUiStore((s) => s.connectionMode !== 'offline')
  const [sites, setSites] = useState<SiteRecord[]>([])
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    void loadAssessments()
    void sitesRepo.listSites().then(setSites)
  }, [loadAssessments])

  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])

  // Excludes the lightweight, header-only rows `seedReportAssessments.ts`
  // adds purely so Reports has real data to aggregate over — those were
  // never opened in the workspace and don't belong in this list.
  const fieldAssessments = assessments.filter((a) => !a.reportOnly)

  const columns: DataTableColumn<AssessmentRecord>[] = useMemo(
    () => [
      {
        key: 'farm',
        header: 'Farm / site',
        width: '1.9fr',
        sortValue: (r) => siteById.get(r.farmSiteId)?.farmName ?? r.farmSiteId,
        filter: { type: 'text', placeholder: 'Filter farm…' },
        filterValue: (r) => {
          const site = siteById.get(r.farmSiteId)
          return `${site?.farmName ?? r.farmSiteId} ${site?.referenceCode ?? ''}`
        },
        render: (r) => {
          const site = siteById.get(r.farmSiteId)
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {site?.farmName ?? r.farmSiteId}
              </span>
              <span
                style={{
                  flex: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'var(--gray-100)',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                {site?.referenceCode ?? r.farmSiteId}
              </span>
            </div>
          )
        },
      },
      {
        key: 'region',
        header: 'Region',
        width: '140px',
        sortValue: (r) => siteById.get(r.farmSiteId)?.region ?? '',
        filter: { type: 'select' },
        filterValue: (r) => siteById.get(r.farmSiteId)?.region ?? '',
        render: (r) => <span style={{ fontSize: 13 }}>{siteById.get(r.farmSiteId)?.region ?? '—'}</span>,
      },
      {
        key: 'group',
        header: 'Group',
        width: '150px',
        sortValue: (r) => siteById.get(r.farmSiteId)?.groupName ?? r.groupId,
        filter: { type: 'select' },
        filterValue: (r) => siteById.get(r.farmSiteId)?.groupName ?? r.groupId,
        render: (r) => <span style={{ fontSize: 13 }}>{siteById.get(r.farmSiteId)?.groupName ?? r.groupId}</span>,
      },
      {
        key: 'assessorType',
        header: 'Assessor type',
        width: '130px',
        sortValue: (r) => r.assessorType,
        filter: { type: 'select' },
        filterValue: (r) => r.assessorType,
        render: (r) => <span style={{ fontSize: 13 }}>{r.assessorType}</span>,
      },
      {
        key: 'started',
        header: 'Started',
        width: '140px',
        sortValue: (r) => r.createdAt,
        render: (r) => {
          const started = new Date(r.createdAt)
          return (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {started.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })},{' '}
              {started.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        },
      },
      {
        key: 'progress',
        header: 'Progress',
        width: '170px',
        sortValue: (r) => r.progressPct,
        render: (r) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 999 }}>
              <div
                style={{
                  width: `${r.progressPct}%`,
                  height: '100%',
                  background: STATUS_ACCENT[r.status],
                  borderRadius: 999,
                }}
              />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, flex: 'none' }}>{r.progressPct}%</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '170px',
        sortValue: (r) => disposition(r, online).label,
        filter: { type: 'select' },
        filterValue: (r) => disposition(r, online).label,
        render: (r) => {
          const sync = disposition(r, online)
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: sync.color, fontWeight: 600, fontSize: 12.5 }}>
                <Icon name={sync.icon} size={14} />
                {sync.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(r.byteSize)} on device</div>
            </div>
          )
        },
      },
    ],
    [siteById, online],
  )

  const [query, setQuery] = useState('')
  const filtered = fieldAssessments.filter((a) => {
    if (!query.trim()) return true
    const site = siteById.get(a.farmSiteId)
    const haystack = `${site?.farmName ?? ''} ${site?.referenceCode ?? ''} ${site?.groupName ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, margin: 0 }}>
            Your assessments
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Shrimp: Farm Standard v2.4 · Minh Phu Delta Programme
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: 260,
              height: 40,
              borderRadius: 999,
              border: '1px solid var(--border)',
              padding: '0 14px',
              background: '#fff',
            }}
          >
            <Icon name="search" size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search farms, IDs, groups"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }}
            />
          </div>
          <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => setShowNew(true)}>
            New assessment
          </Button>
        </div>
      </div>

      <OfflineBanner />

      {filtered.length === 0 && fieldAssessments.length === 0 && (
        <div style={{ padding: '64px 20px', textAlign: 'center' }}>
          <Icon name="clipboard-list" size={32} style={{ color: 'var(--border-strong)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, margin: '14px 0 6px' }}>
            No assessments yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Start your first farm assessment to see it appear here.
          </div>
          <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => setShowNew(true)}>
            New assessment
          </Button>
        </div>
      )}

      {filtered.length === 0 && fieldAssessments.length > 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No assessments match "{query}".
        </div>
      )}

      {filtered.length > 0 && (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(r) => r.id}
          accentColor={(r) => STATUS_ACCENT[r.status]}
          onRowClick={(r) => navigate(`/assessments/${r.id}`)}
          renderExpanded={(r) => <AssessmentSnapshotPanel record={r} />}
        />
      )}

      {showNew && <NewAssessmentDialog sites={sites} onClose={() => setShowNew(false)} />}
    </div>
  )
}
