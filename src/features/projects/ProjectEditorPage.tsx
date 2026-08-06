import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Icon, Badge } from '@/design-system/components'
import { useProjectStore } from '@/state/projectStore'
import { newId } from '@/lib/id'

export function ProjectEditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const isNew = projectId === 'new'
  const projects = useProjectStore((s) => s.projects)
  const siteGroups = useProjectStore((s) => s.siteGroups)
  const sites = useProjectStore((s) => s.sites)
  const loaded = useProjectStore((s) => s.loaded)
  const loadAll = useProjectStore((s) => s.loadAll)
  const createProject = useProjectStore((s) => s.createProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const existing = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId])
  const groups = useMemo(() => siteGroups.filter((g) => g.projectId === projectId), [siteGroups, projectId])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentProjectId, setParentProjectId] = useState('')
  const [totalEstimatedAnnualProduction, setTotalEstimatedAnnualProduction] = useState(0)
  const [totalEstimatedSites, setTotalEstimatedSites] = useState(0)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setDescription(existing.description)
    setParentProjectId(existing.parentProjectId ?? '')
    setTotalEstimatedAnnualProduction(existing.totalEstimatedAnnualProduction)
    setTotalEstimatedSites(existing.totalEstimatedSites)
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Project not found.</div>
  }

  async function handleSave() {
    const payload = {
      name,
      description,
      parentProjectId: parentProjectId || null,
      totalEstimatedAnnualProduction,
      totalEstimatedSites,
    }
    if (isNew) {
      const id = newId()
      await createProject({ id, ...payload })
      navigate(`/projects/${id}`)
    } else if (projectId) {
      await updateProject(projectId, payload)
    }
  }

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 760 }}>
      <button
        type="button"
        onClick={() => navigate('/projects')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to projects
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 18px' }}>
        {isNew ? 'New project' : name || 'Edit project'}
      </h1>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Project name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="Parent project"
            value={parentProjectId}
            onChange={(e) => setParentProjectId(e.target.value)}
            options={[{ value: '', label: 'None' }, ...projects.filter((p) => p.id !== projectId).map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Input label="Total estimated annual production" type="number" value={totalEstimatedAnnualProduction} onChange={(e) => setTotalEstimatedAnnualProduction(Number(e.target.value))} />
          <Input label="Total estimated sites" type="number" value={totalEstimatedSites} onChange={(e) => setTotalEstimatedSites(Number(e.target.value))} />
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          {!isNew && (
            <Button variant="danger" onClick={() => { void deleteProject(projectId!); navigate('/projects') }}>
              Delete project
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
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>Groups</div>
            <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={() => navigate(`/projects/${projectId}/groups/new`)}>
              Manage groups
            </Button>
          </div>
          {groups.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No groups yet.</div>
          ) : (
            groups.map((g) => {
              const siteCount = sites.filter((s) => s.groupId === g.id).length
              return (
                <div
                  key={g.id}
                  onClick={() => navigate(`/projects/${projectId}/groups/${g.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderTop: '1px solid var(--gray-100)', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{g.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{g.groupPhase} · {siteCount} sites</div>
                  </div>
                  <Badge tone={g.groupGoal === 'Green' ? 'success' : 'warning'}>{g.groupGoal}</Badge>
                  <Icon name="chevron-right" size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              )
            })
          )}
        </Card>
      )}
    </div>
  )
}
