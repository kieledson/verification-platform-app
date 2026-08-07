import { useEffect, useState } from 'react'
import { Icon } from '@/design-system/components'
import { OutcomeBadge } from '@/features/portal/portalUi'
import { formatBytes } from '@/lib/formatBytes'
import { loadSectionProgress, type SectionProgress } from '@/features/assessment-list/assessmentSnapshot'
import type { AssessmentRecord } from '@/db/schema'

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{value}</div>
    </div>
  )
}

/** Read-only progress/status snapshot shown when a row in "Your assessments"
 * is expanded — overall record metadata plus a per-section completion
 * breakdown, loaded on demand for just this assessment (see
 * `assessmentSnapshot.ts`). Doesn't touch the workspace's active-assessment
 * state, so expanding a row can't disturb whatever's actually open there. */
export function AssessmentSnapshotPanel({ record }: { record: AssessmentRecord }) {
  const [sections, setSections] = useState<SectionProgress[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadSectionProgress(record.id).then((s) => {
      if (!cancelled) setSections(s)
    })
    return () => {
      cancelled = true
    }
  }, [record.id])

  const created = new Date(record.createdAt)
  const updated = new Date(record.updatedAt)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outcome</div>
          <div style={{ marginTop: 3 }}>
            <OutcomeBadge outcome={record.outcome} />
          </div>
        </div>
        <Meta label="Standard version" value={record.standardVersion} />
        <Meta label="Assessor type" value={record.assessorType} />
        <Meta label="Batch" value={String(record.batch)} />
        <Meta label="On device" value={formatBytes(record.byteSize)} />
        <Meta label="Created" value={created.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
        <Meta label="Last updated" value={updated.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
        {record.syncAttempts > 0 && <Meta label="Sync attempts" value={String(record.syncAttempts)} />}
        {record.lastSyncError && <Meta label="Last sync error" value={record.lastSyncError} />}
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
          Section progress
        </div>
        {!sections ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {sections.map((s, i) => {
              const complete = s.total > 0 && s.done === s.total
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 10px',
                  }}
                >
                  <span
                    style={{
                      flex: 'none',
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      background: complete ? 'var(--success)' : 'var(--gray-100)',
                      color: complete ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {complete ? <Icon name="check" size={11} /> : i + 1}
                  </span>
                  <span style={{ fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: complete ? 'var(--success)' : 'var(--text-muted)', flex: 'none' }}>
                    {s.done}/{s.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
