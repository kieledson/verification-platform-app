import { useEffect, useMemo, useState } from 'react'
import { Badge, Select } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useProjectStore } from '@/state/projectStore'
import { PageHeader, SectionTabs, GroupGoalBadge } from '@/features/portal/portalUi'
import type { SiteGroupRecord } from '@/db/schema'

type SampledAssessorType = keyof SiteGroupRecord['sampleSizes']

const ASSESSOR_TYPES: SampledAssessorType[] = ['Company', 'Collaborator', 'SGS']

interface AssessorRow {
  assessorType: SampledAssessorType
  sampleSize: number
  submitted: number
  batch: number
  status: 'Open' | 'Closed'
  result: 'Not Started' | 'In Progress' | 'Green'
}

/**
 * Rolls up real assessment rows into the group/assessor-type states decoded
 * in Document 4 §5.1: submitted=0 -> Open/Not Started; 0<submitted<sample ->
 * Open/In Progress; submitted>=sample -> Closed/Green. "Submitted" means an
 * assessment reached `pending-upload` or `synced`. What actually closes a
 * batch and opens the next is explicitly undecoded (Document 4 §11 Q2), so
 * this only models the single-batch case every seeded group stays in.
 */
export function InternalGroupReportPage() {
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)
  const projects = useProjectStore((s) => s.projects)
  const siteGroups = useProjectStore((s) => s.siteGroups)
  const projectsLoaded = useProjectStore((s) => s.loaded)
  const loadProjectAll = useProjectStore((s) => s.loadAll)
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    void loadAssessments()
    if (!projectsLoaded) void loadProjectAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id)
  }, [projectId, projects])

  const groupsForProject = useMemo(() => siteGroups.filter((g) => g.projectId === projectId), [siteGroups, projectId])

  const groupRows = useMemo(() => {
    return groupsForProject.map((group) => {
      const groupAssessments = assessments.filter((a) => a.groupId === group.id)
      const rows: AssessorRow[] = ASSESSOR_TYPES.map((type) => {
        const matching = groupAssessments.filter(
          (a) => a.assessorType === type && (a.status === 'pending-upload' || a.status === 'synced'),
        )
        const submitted = matching.length
        const sampleSize = group.sampleSizes[type]
        const batch = matching.reduce((max, a) => Math.max(max, a.batch), 1)
        const status: AssessorRow['status'] = submitted >= sampleSize && sampleSize > 0 ? 'Closed' : 'Open'
        const result: AssessorRow['result'] = submitted === 0 ? 'Not Started' : status === 'Closed' ? 'Green' : 'In Progress'
        return { assessorType: type, sampleSize, submitted, batch, status, result }
      })
      const groupStatus = rows.every((r) => r.status === 'Closed' && r.result === 'Green') ? 'Green' : 'In Progress'
      return { group, rows, groupStatus }
    })
  }, [groupsForProject, assessments])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader title="Internal group report" subtitle="The cohort-level progress and outcome roll-up, per project." />
      <SectionTabs
        items={[
          { to: '/reports/assessment-history', label: 'Assessment history' },
          { to: '/reports/internal-group-report', label: 'Internal group report' },
        ]}
      />

      <div style={{ marginBottom: 18, maxWidth: 340 }}>
        <Select label="Select project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </div>

      {groupRows.map(({ group, rows, groupStatus }) => (
        <div key={group.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 18px',
              background: 'var(--ocean)',
              color: '#fff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{group.name}</div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>{group.groupPhase}</div>
            <GroupGoalBadge goal={group.groupGoal} />
            <Badge tone={groupStatus === 'Green' ? 'success' : 'info'}>{groupStatus}</Badge>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--gray-100)' }}>
                <th style={thStyle}>Assessor type</th>
                <th style={thStyle}>Sample size</th>
                <th style={thStyle}>Assessments submitted</th>
                <th style={thStyle}>Batch</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.assessorType}>
                  <td style={tdStyle}>{r.assessorType}</td>
                  <td style={tdStyle}>{r.sampleSize}</td>
                  <td style={tdStyle}>{r.submitted}</td>
                  <td style={tdStyle}>{r.batch}</td>
                  <td style={tdStyle}>
                    <Badge tone={r.status === 'Closed' ? 'success' : 'neutral'}>{r.status}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <Badge tone={r.result === 'Green' ? 'success' : r.result === 'In Progress' ? 'info' : 'neutral'}>{r.result}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '9px 18px',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const tdStyle: React.CSSProperties = { padding: '9px 18px' }
