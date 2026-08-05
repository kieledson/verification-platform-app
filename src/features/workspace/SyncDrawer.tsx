import { useEffect, useState } from 'react'
import { Icon } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import { formatBytes } from '@/lib/formatBytes'
import { relativeTime } from '@/lib/relativeTime'
import * as photoQueueRepo from '@/sync/photoQueue'
import * as sitesRepo from '@/db/repositories/sites'
import type { PhotoQueueEntry } from '@/db/schema'

interface SyncRow {
  key: string
  icon: string
  iconColor: string
  name: string
  detail: string
}

/** Opened from the header's sync pill. Real data throughout — the photo
 * queue and "previously finalised assessment" rows read the actual Dexie
 * tables/assessment list rather than the handoff's illustrative numbers. */
export function SyncDrawer({
  assessmentId,
  farmName,
  answeredCount,
  online,
}: {
  assessmentId: string
  farmName: string
  answeredCount: number
  online: boolean
}) {
  const assessments = useAssessmentStore((s) => s.assessments)
  const setConnectionMode = useUiStore((s) => s.setConnectionMode)
  const [photoEntries, setPhotoEntries] = useState<PhotoQueueEntry[]>([])
  const [otherFinalisedName, setOtherFinalisedName] = useState<string | null>(null)

  useEffect(() => {
    void photoQueueRepo.loadPhotoQueueForAssessment(assessmentId).then(setPhotoEntries)
  }, [assessmentId])

  const queuedPhotos = photoEntries.filter((p) => p.state === 'queued' || p.state === 'deferred-wifi')
  const queuedBytes = queuedPhotos.reduce((n, p) => n + p.sizeBytes, 0)

  const otherFinalised = assessments
    .filter((a) => a.id !== assessmentId && a.status === 'synced')
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]

  useEffect(() => {
    if (!otherFinalised) {
      setOtherFinalisedName(null)
      return
    }
    void sitesRepo.getSite(otherFinalised.farmSiteId).then((site) => setOtherFinalisedName(site?.farmName ?? null))
  }, [otherFinalised])

  const rows: SyncRow[] = [
    {
      key: 'this',
      icon: online ? 'upload-cloud' : 'hard-drive',
      iconColor: online ? 'var(--ocean)' : 'var(--text-muted)',
      name: `This assessment · ${farmName}`,
      detail: online
        ? `Answers upload as you go · ${answeredCount} saved`
        : 'Saving to this tablet · uploads when you have wifi',
    },
    {
      key: 'photos',
      icon: 'image',
      iconColor: 'var(--sand)',
      name: 'Photos',
      detail:
        queuedPhotos.length === 0
          ? 'No photos queued'
          : `${queuedPhotos.length} queued for wifi · ${formatBytes(queuedBytes)}`,
    },
  ]
  if (otherFinalised && otherFinalisedName) {
    rows.push({
      key: 'finalised',
      icon: 'check-circle-2',
      iconColor: 'var(--success)',
      name: otherFinalisedName,
      detail: `Finalised and uploaded ${relativeTime(otherFinalised.updatedAt, Date.now())}`,
    })
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 38,
        width: 330,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 14px 32px rgba(1,44,76,0.22)',
        padding: '14px 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        zIndex: 20,
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ocean)' }}>
        Sync status
      </span>
      {rows.map((r) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
          <Icon name={r.icon} size={15} style={{ color: r.iconColor, marginTop: 1, flex: 'none' }} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)' }}>{r.name}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.detail}</span>
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--gray-100)',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photos wait for wifi to save data.</span>
        {/* Dev/demo-only — same simulated connection lever as the rest of
            the app, surfaced here per the handoff's sync drawer footer. */}
        <button
          type="button"
          onClick={() => setConnectionMode(online ? 'offline' : 'wifi')}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '4px 11px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-body)',
            cursor: 'pointer',
          }}
        >
          {online ? 'Simulate offline' : 'Simulate online'}
        </button>
      </div>
    </div>
  )
}
