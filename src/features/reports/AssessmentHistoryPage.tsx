import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useProjectStore } from '@/state/projectStore'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SearchBox, SectionTabs, OutcomeBadge, EmptyState } from '@/features/portal/portalUi'
import type { AssessmentRecord } from '@/db/schema'

type SortKey = 'date' | 'ref'

export function AssessmentHistoryPage() {
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)
  const sites = useProjectStore((s) => s.sites)
  const projectsLoaded = useProjectStore((s) => s.loaded)
  const loadProjectAll = useProjectStore((s) => s.loadAll)
  const users = useSecurityStore((s) => s.users)
  const usersLoaded = useSecurityStore((s) => s.loaded)
  const loadSecurityAll = useSecurityStore((s) => s.loadAll)

  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  useEffect(() => {
    void loadAssessments()
    if (!projectsLoaded) void loadProjectAll()
    if (!usersLoaded) void loadSecurityAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  const sitesById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])

  function assessorFor(a: AssessmentRecord) {
    const site = sitesById.get(a.farmSiteId)
    return users.find((u) => u.assessorType === a.assessorType && (!site || u.country === site.country)) ?? users.find((u) => u.assessorType === a.assessorType)
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = assessments.map((a) => {
      const site = sitesById.get(a.farmSiteId)
      const assessor = assessorFor(a)
      return { assessment: a, site, assessor }
    })
    if (q) {
      list = list.filter(
        ({ site, assessor }) =>
          site?.farmName.toLowerCase().includes(q) ||
          site?.groupName.toLowerCase().includes(q) ||
          site?.projectName.toLowerCase().includes(q) ||
          assessor?.displayName.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      const v = sortKey === 'date' ? a.assessment.updatedAt - b.assessment.updatedAt : a.assessment.id.localeCompare(b.assessment.id)
      return v * sortDir
    })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assessorFor closes over stable users/sitesById
  }, [assessments, sitesById, query, sortKey, sortDir, users])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(key)
      setSortDir(-1)
    }
  }

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Assessment history"
        subtitle={`${assessments.length} assessment${assessments.length === 1 ? '' : 's'} across every project`}
        actions={<SearchBox value={query} onChange={setQuery} placeholder="Search site, group, assessor" width={280} />}
      />
      <SectionTabs
        items={[
          { to: '/reports/assessment-history', label: 'Assessment history' },
          { to: '/reports/internal-group-report', label: 'Internal group report' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon="history" title="No assessments found" />
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 980 }}>
            <thead>
              <tr style={{ background: 'var(--gray-100)' }}>
                <Th onClick={() => toggleSort('ref')} active={sortKey === 'ref'} dir={sortDir}>Ref</Th>
                <Th onClick={() => toggleSort('date')} active={sortKey === 'date'} dir={sortDir}>Assessment date</Th>
                <Th>Type</Th>
                <Th>User</Th>
                <Th>Assessor type</Th>
                <Th>Project</Th>
                <Th>Group</Th>
                <Th>Site</Th>
                <Th>Outcome</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ assessment, site, assessor }, i) => (
                <tr key={assessment.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--gray-100)' }}>
                  <td style={cellStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{assessment.id.slice(0, 8)}</span>
                  </td>
                  <td style={cellStyle}>{new Date(assessment.updatedAt).toLocaleDateString()}</td>
                  <td style={cellStyle}>Shrimp: Farm Standard v2.4</td>
                  <td style={cellStyle}>{assessor?.displayName ?? '—'}</td>
                  <td style={cellStyle}>{assessment.assessorType}</td>
                  <td style={cellStyle}>{site?.projectName ?? '—'}</td>
                  <td style={cellStyle}>{site?.groupName ?? '—'}</td>
                  <td style={cellStyle}>{site?.farmName ?? '—'}</td>
                  <td style={cellStyle}>
                    <OutcomeBadge outcome={assessment.outcome} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const cellStyle: React.CSSProperties = { padding: '9px 14px', whiteSpace: 'nowrap' }

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  dir?: 1 | -1
}) {
  return (
    <th
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: active ? 'var(--ocean)' : 'var(--text-muted)',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
      {active && (
        <Icon name={dir === 1 ? 'chevron-up' : 'chevron-down'} size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
      )}
    </th>
  )
}
