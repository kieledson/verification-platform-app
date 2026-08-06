import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon } from '@/design-system/components'
import { useProjectStore } from '@/state/projectStore'
import { PageHeader, SearchBox, SectionTabs, RecordCard, EmptyState } from '@/features/portal/portalUi'

export function ProjectsListPage() {
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const siteGroups = useProjectStore((s) => s.siteGroups)
  const sites = useProjectStore((s) => s.sites)
  const loaded = useProjectStore((s) => s.loaded)
  const loadAll = useProjectStore((s) => s.loadAll)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => !q || p.name.toLowerCase().includes(q))
  }, [projects, query])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'} · ${siteGroups.length} groups · ${sites.length} sites`}
        actions={
          <>
            <SearchBox value={query} onChange={setQuery} placeholder="Search projects" />
            <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => navigate('/projects/new')}>
              New project
            </Button>
          </>
        }
      />
      <SectionTabs items={[{ to: '/projects', label: 'Projects' }, { to: '/standard', label: 'Standards' }]} />

      {filtered.length === 0 ? (
        <EmptyState icon="folder-kanban" title="No projects found" />
      ) : (
        filtered.map((p) => {
          const groups = siteGroups.filter((g) => g.projectId === p.id)
          const siteCount = sites.filter((s) => groups.some((g) => g.id === s.groupId)).length
          return (
            <RecordCard key={p.id} accentColor="var(--ocean)" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.description}</div>
              </div>
              <Badge tone="neutral">
                {groups.length} group{groups.length === 1 ? '' : 's'}
              </Badge>
              <Badge tone="neutral">
                {siteCount} site{siteCount === 1 ? '' : 's'}
              </Badge>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-muted)' }} />
            </RecordCard>
          )
        })
      )}
    </div>
  )
}
