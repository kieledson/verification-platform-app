import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Select } from '@/design-system/components'
import { useAdminStore } from '@/state/adminStore'
import { useProjectStore } from '@/state/projectStore'
import { useAssessmentStore } from '@/state/assessmentStore'
import { buildActivityPreviewRows, buildSitePreviewRows } from '@/features/admin/exportPreview'
import { PageHeader, SectionTabs } from '@/features/portal/portalUi'

export function DataExportPage() {
  const templates = useAdminStore((s) => s.exportTemplates)
  const loaded = useAdminStore((s) => s.loaded)
  const loadAll = useAdminStore((s) => s.loadAll)
  const sites = useProjectStore((s) => s.sites)
  const projectLoaded = useProjectStore((s) => s.loaded)
  const loadProjectAll = useProjectStore((s) => s.loadAll)
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)

  const [templateId, setTemplateId] = useState('')
  const [filterValues, setFilterValues] = useState<Record<number, string>>({})
  const [previewed, setPreviewed] = useState(false)

  useEffect(() => {
    if (!loaded) void loadAll()
    if (!projectLoaded) void loadProjectAll()
    void loadAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  useEffect(() => {
    if (!templateId && templates.length > 0) setTemplateId(templates[0].id)
  }, [templateId, templates])

  const template = templates.find((t) => t.id === templateId)

  const sitesById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])
  const previewRows = useMemo(() => {
    if (!template || !previewed) return []
    if (template.entity === 'ActivityExt') return buildActivityPreviewRows(template, assessments, sitesById)
    if (template.entity === 'SiteExt') return buildSitePreviewRows(template, sites)
    return []
  }, [template, previewed, assessments, sites, sitesById])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader title="Data export" subtitle="Run a saved export template, optionally overriding its editable filters." />
      <SectionTabs
        items={[
          { to: '/admin/export-templates', label: 'Export templates' },
          { to: '/admin/data-export', label: 'Data export' },
        ]}
      />

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <Select
          label="Export template"
          required
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value)
            setPreviewed(false)
            setFilterValues({})
          }}
          options={templates.map((t) => ({ value: t.id, label: t.name }))}
        />

        {template && template.filters.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>Filters</div>
            {template.filters.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 6 }}>
                <span style={{ width: 40, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{f.andOr}</span>
                <span style={{ flex: 1 }}>
                  {f.criteria} <span style={{ color: 'var(--text-muted)' }}>{f.operator}</span>
                </span>
                <input
                  value={filterValues[i] ?? f.value}
                  disabled={!f.editable}
                  onChange={(e) => setFilterValues((v) => ({ ...v, [i]: e.target.value }))}
                  style={{
                    width: 200,
                    height: 32,
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: 8,
                    padding: '0 10px',
                    fontSize: 13,
                    background: f.editable ? '#fff' : 'var(--gray-100)',
                  }}
                />
                {f.mandatory && <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>Required</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <Button variant="secondary" onClick={() => setPreviewed(true)} disabled={!template}>
            Preview
          </Button>
          <Button variant="primary" disabled={!template}>
            Export
          </Button>
        </div>
      </Card>

      <Card padding="md" style={{ overflowX: 'auto' }}>
        {!previewed ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12 }}>
            Export preview — press Preview to see the first rows.
          </div>
        ) : template?.entity === 'ActivityCheckExt' ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12 }}>
            Assessment Details previews per-assessment — open an assessment's review screen to see this data.
          </div>
        ) : previewRows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12 }}>No rows match.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {template?.fields.map((f) => (
                  <th key={f.fieldKey} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--border)', color: 'var(--ocean-deep)' }}>
                    {f.header || f.fieldKey}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--gray-100)' }}>
                  {template?.fields.map((f) => (
                    <td key={f.fieldKey} style={{ padding: '6px 10px' }}>
                      {row[f.header || f.fieldKey]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
