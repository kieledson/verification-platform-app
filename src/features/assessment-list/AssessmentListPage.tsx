import { useEffect, useMemo, useState } from 'react'
import { Button, Icon } from '@/design-system/components'
import { OfflineBanner } from '@/features/assessment-list/OfflineBanner'
import { AssessmentRow } from '@/features/assessment-list/AssessmentRow'
import { NewAssessmentDialog } from '@/features/assessment-list/NewAssessmentDialog'
import { useAssessmentStore } from '@/state/assessmentStore'
import * as sitesRepo from '@/db/repositories/sites'
import type { SiteRecord } from '@/db/schema'

export function AssessmentListPage() {
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)
  const [sites, setSites] = useState<SiteRecord[]>([])
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    void loadAssessments()
    void sitesRepo.listSites().then(setSites)
  }, [loadAssessments])

  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])

  const filtered = assessments.filter((a) => {
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

      {filtered.length === 0 && assessments.length === 0 && (
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

      {filtered.length === 0 && assessments.length > 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No assessments match "{query}".
        </div>
      )}

      {filtered.map((record) => (
        <AssessmentRow key={record.id} record={record} site={siteById.get(record.farmSiteId)} />
      ))}

      {showNew && <NewAssessmentDialog sites={sites} onClose={() => setShowNew(false)} />}
    </div>
  )
}
