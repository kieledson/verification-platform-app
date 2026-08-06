import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Icon } from '@/design-system/components'
import { useProjectStore } from '@/state/projectStore'
import { newId } from '@/lib/id'
import type { GroupGoal, GroupPhase, AssessorType } from '@/db/schema'

const GOALS: GroupGoal[] = ['Green', 'Yellow']
const PHASES: GroupPhase[] = ['Live', 'Pilot - Round 1', 'N/A']
const SAMPLE_TYPES: AssessorType[] = ['Company', 'Collaborator', 'SGS']

export function GroupEditorPage() {
  const { projectId, groupId } = useParams<{ projectId: string; groupId: string }>()
  const navigate = useNavigate()
  const isNew = groupId === 'new'
  const projects = useProjectStore((s) => s.projects)
  const siteGroups = useProjectStore((s) => s.siteGroups)
  const sites = useProjectStore((s) => s.sites)
  const loaded = useProjectStore((s) => s.loaded)
  const loadAll = useProjectStore((s) => s.loadAll)
  const createSiteGroup = useProjectStore((s) => s.createSiteGroup)
  const updateSiteGroup = useProjectStore((s) => s.updateSiteGroup)
  const deleteSiteGroup = useProjectStore((s) => s.deleteSiteGroup)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const project = projects.find((p) => p.id === projectId)
  const existing = useMemo(() => siteGroups.find((g) => g.id === groupId), [siteGroups, groupId])
  const groupSites = useMemo(() => sites.filter((s) => s.groupId === groupId), [sites, groupId])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [personResponsible, setPersonResponsible] = useState('')
  const [totalEstimatedAnnualProduction, setTotalEstimatedAnnualProduction] = useState(0)
  const [groupGoal, setGroupGoal] = useState<GroupGoal>('Green')
  const [groupPhase, setGroupPhase] = useState<GroupPhase>('Live')
  const [sampleSizes, setSampleSizes] = useState<Record<AssessorType, number>>({ None: 0, Company: 0, Collaborator: 0, SGS: 0 })

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setDescription(existing.description)
    setPersonResponsible(existing.personResponsible)
    setTotalEstimatedAnnualProduction(existing.totalEstimatedAnnualProduction)
    setGroupGoal(existing.groupGoal)
    setGroupPhase(existing.groupPhase)
    setSampleSizes({ None: 0, ...existing.sampleSizes })
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Group not found.</div>
  }

  async function handleSave() {
    if (!projectId) return
    const payload = {
      projectId,
      name,
      description,
      personResponsible,
      totalEstimatedAnnualProduction,
      groupGoal,
      groupPhase,
      sampleSizes: { Company: sampleSizes.Company, Collaborator: sampleSizes.Collaborator, SGS: sampleSizes.SGS },
    }
    if (isNew) {
      const id = newId()
      await createSiteGroup({ id, ...payload })
      navigate(`/projects/${projectId}/groups/${id}`)
    } else if (groupId) {
      await updateSiteGroup(groupId, payload)
    }
  }

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 760 }}>
      <button
        type="button"
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to {project?.name ?? 'project'}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 18px' }}>
        {isNew ? 'New group' : name || 'Edit group'}
      </h1>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Project" value={project?.name ?? ''} disabled />
          <Input label="Group name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Person responsible" value={personResponsible} onChange={(e) => setPersonResponsible(e.target.value)} />
          <Input label="Total estimated annual production" type="number" value={totalEstimatedAnnualProduction} onChange={(e) => setTotalEstimatedAnnualProduction(Number(e.target.value))} />
          <Select label="Group phase" value={groupPhase} onChange={(e) => setGroupPhase(e.target.value as GroupPhase)} options={PHASES} />
          <Select label="Group goal" value={groupGoal} onChange={(e) => setGroupGoal(e.target.value as GroupGoal)} options={GOALS} />
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ width: '100%', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>Assessor type × sample size</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {SAMPLE_TYPES.map((type) => (
              <Input
                key={type}
                label={type}
                type="number"
                value={sampleSizes[type]}
                onChange={(e) => setSampleSizes((s) => ({ ...s, [type]: Number(e.target.value) }))}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          {!isNew && (
            <Button variant="danger" onClick={() => { void deleteSiteGroup(groupId!); navigate(`/projects/${projectId}`) }}>
              Delete group
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={() => void handleSave()} disabled={!name}>
            Save
          </Button>
        </div>
      </Card>

      {!isNew && (
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>Sites</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" iconLeft={<Icon name="upload" size={13} />} disabled>
                Import sites
              </Button>
              <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={() => navigate(`/projects/${projectId}/groups/${groupId}/sites/new`)}>
                New site
              </Button>
            </div>
          </div>
          {groupSites.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No sites yet.</div>
          ) : (
            groupSites.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/projects/${projectId}/groups/${groupId}/sites/${s.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderTop: '1px solid var(--gray-100)', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.farmName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.referenceCode} · {s.country}</div>
                </div>
                <Icon name="chevron-right" size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  )
}
