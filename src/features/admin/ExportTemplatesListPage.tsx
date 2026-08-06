import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon } from '@/design-system/components'
import { useAdminStore } from '@/state/adminStore'
import { PageHeader, SearchBox, SectionTabs, RecordCard, EmptyState } from '@/features/portal/portalUi'

const ENTITY_LABEL: Record<string, string> = {
  ActivityExt: 'Assessment Header',
  ActivityCheckExt: 'Assessment Details',
  SiteExt: 'Sites',
}

export function ExportTemplatesListPage() {
  const navigate = useNavigate()
  const templates = useAdminStore((s) => s.exportTemplates)
  const loaded = useAdminStore((s) => s.loaded)
  const loadAll = useAdminStore((s) => s.loadAll)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q))
  }, [templates, query])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Export templates"
        subtitle={`${templates.length} template${templates.length === 1 ? '' : 's'} · each field's position, format and header are configurable`}
        actions={
          <>
            <SearchBox value={query} onChange={setQuery} placeholder="Search templates" />
            <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => navigate('/admin/export-templates/new')}>
              New template
            </Button>
          </>
        }
      />
      <SectionTabs
        items={[
          { to: '/admin/export-templates', label: 'Export templates' },
          { to: '/admin/data-export', label: 'Data export' },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="file-spreadsheet" title="No templates found" />
      ) : (
        filtered.map((t) => (
          <RecordCard key={t.id} accentColor="var(--ocean-light)" onClick={() => navigate(`/admin/export-templates/${t.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {ENTITY_LABEL[t.entity]} · {t.fields.length} fields · owned by {t.owner}
              </div>
            </div>
            <Badge tone="neutral">{t.format.toUpperCase()}</Badge>
            <Icon name="chevron-right" size={16} style={{ color: 'var(--text-muted)' }} />
          </RecordCard>
        ))
      )}
    </div>
  )
}
