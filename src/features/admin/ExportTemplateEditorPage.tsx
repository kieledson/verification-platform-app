import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Checkbox, Icon } from '@/design-system/components'
import { useAdminStore } from '@/state/adminStore'
import { useProjectStore } from '@/state/projectStore'
import { useAssessmentStore } from '@/state/assessmentStore'
import { buildActivityPreviewRows, buildSitePreviewRows } from '@/features/admin/exportPreview'
import { newId } from '@/lib/id'
import type { ExportEntity, ExportFormat, ExportTemplateField, ExportTemplateFilter } from '@/db/schema'

const ENTITIES: { value: ExportEntity; label: string }[] = [
  { value: 'ActivityExt', label: 'Assessment Header' },
  { value: 'ActivityCheckExt', label: 'Assessment Details' },
  { value: 'SiteExt', label: 'Sites' },
]
const FORMATS: ExportFormat[] = ['xlsx', 'csv', 'txt']

export function ExportTemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const isNew = templateId === 'new'
  const templates = useAdminStore((s) => s.exportTemplates)
  const loaded = useAdminStore((s) => s.loaded)
  const loadAll = useAdminStore((s) => s.loadAll)
  const createExportTemplate = useAdminStore((s) => s.createExportTemplate)
  const updateExportTemplate = useAdminStore((s) => s.updateExportTemplate)
  const deleteExportTemplate = useAdminStore((s) => s.deleteExportTemplate)

  const sites = useProjectStore((s) => s.sites)
  const projectLoaded = useProjectStore((s) => s.loaded)
  const loadProjectAll = useProjectStore((s) => s.loadAll)
  const assessments = useAssessmentStore((s) => s.assessments)
  const loadAssessments = useAssessmentStore((s) => s.loadAssessments)

  useEffect(() => {
    if (!loaded) void loadAll()
    if (!projectLoaded) void loadProjectAll()
    void loadAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  const existing = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId])

  const [name, setName] = useState('')
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [headerRow, setHeaderRow] = useState(true)
  const [entity, setEntity] = useState<ExportEntity>('ActivityExt')
  const [owner, setOwner] = useState('Programme Team')
  const [archived, setArchived] = useState(false)
  const [fields, setFields] = useState<ExportTemplateField[]>([])
  const [filters, setFilters] = useState<ExportTemplateFilter[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setFormat(existing.format)
    setHeaderRow(existing.headerRow)
    setEntity(existing.entity)
    setOwner(existing.owner)
    setArchived(existing.archived)
    setFields(existing.fields)
    setFilters(existing.filters)
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Template not found.</div>
  }

  function addField() {
    setFields((f) => [...f, { order: f.length + 1, fieldKey: '', format: 'B', header: '' }])
  }
  function updateField(i: number, patch: Partial<ExportTemplateField>) {
    setFields((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i))
  }

  function addFilter() {
    setFilters((f) => [...f, { andOr: 'AND', criteria: '', operator: 'Is equal to', value: '', mandatory: false, editable: true }])
  }
  function updateFilter(i: number, patch: Partial<ExportTemplateFilter>) {
    setFilters((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }
  function removeFilter(i: number) {
    setFilters((f) => f.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    const payload = { name, format, headerRow, entity, owner, archived, fields, filters }
    if (isNew) {
      await createExportTemplate({ id: newId(), ...payload })
    } else if (templateId) {
      await updateExportTemplate(templateId, payload)
    }
    navigate('/admin/export-templates')
  }

  const sitesById = new Map(sites.map((s) => [s.id, s]))
  const previewRows =
    entity === 'ActivityExt'
      ? buildActivityPreviewRows({ ...(existing ?? { id: '', createdAt: 0, updatedAt: 0 }), name, format, headerRow, entity, owner, archived, fields, filters }, assessments, sitesById)
      : entity === 'SiteExt'
        ? buildSitePreviewRows({ ...(existing ?? { id: '', createdAt: 0, updatedAt: 0 }), name, format, headerRow, entity, owner, archived, fields, filters }, sites)
        : []

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 900 }}>
      <button
        type="button"
        onClick={() => navigate('/admin/export-templates')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to templates
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 18px' }}>
        {isNew ? 'New export template' : name || 'Edit template'}
      </h1>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Template name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          <Select label="Export format" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} options={FORMATS.map((f) => f.toUpperCase())} />
          <Select
            label="Entity"
            value={entity}
            onChange={(e) => setEntity(e.target.value as ExportEntity)}
            options={ENTITIES.map((e) => ({ value: e.value, label: e.label }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <Checkbox label="Header row" checked={headerRow} onChange={(e) => setHeaderRow(e.target.checked)} />
          <Checkbox label="Archived" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
        </div>
      </Card>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>Fields</div>
          <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={addField}>
            Add field
          </Button>
        </div>
        {fields.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No fields yet.</div>}
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 90px 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</div>
            <Input value={f.fieldKey} placeholder="Field key" onChange={(e) => updateField(i, { fieldKey: e.target.value })} />
            <Input value={f.header} placeholder="Column header" onChange={(e) => updateField(i, { header: e.target.value })} />
            <Select value={f.format} onChange={(e) => updateField(i, { format: e.target.value })} options={['B', 'N', 'D']} />
            <button type="button" onClick={() => removeField(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
              <Icon name="trash-2" size={15} />
            </button>
          </div>
        ))}
      </Card>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>Filters</div>
          <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={addFilter}>
            Add filter
          </Button>
        </div>
        {filters.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No filters — export runs unfiltered.</div>}
        {filters.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr auto auto 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Select value={f.andOr} onChange={(e) => updateFilter(i, { andOr: e.target.value as 'AND' | 'OR' })} options={['AND', 'OR']} />
            <Input value={f.criteria} placeholder="Criteria (field)" onChange={(e) => updateFilter(i, { criteria: e.target.value })} />
            <Input value={f.operator} placeholder="Operator" onChange={(e) => updateFilter(i, { operator: e.target.value })} />
            <Input value={f.value} placeholder="Value" onChange={(e) => updateFilter(i, { value: e.target.value })} disabled={!f.editable && !isNew && f.mandatory} />
            <Checkbox label="Mandatory" checked={f.mandatory} onChange={(e) => updateFilter(i, { mandatory: e.target.checked })} />
            <Checkbox label="Editable" checked={f.editable} onChange={(e) => updateFilter(i, { editable: e.target.checked })} />
            <button type="button" onClick={() => removeFilter(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
              <Icon name="trash-2" size={15} />
            </button>
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'Hide preview' : 'Preview'}
          </Button>
          {!isNew && (
            <Button variant="danger" onClick={() => { void deleteExportTemplate(templateId!); navigate('/admin/export-templates') }}>
              Delete
            </Button>
          )}
        </div>
        <Button variant="primary" onClick={() => void handleSave()} disabled={!name}>
          Save template
        </Button>
      </div>

      {showPreview && (
        <Card padding="md" style={{ marginTop: 16, overflowX: 'auto' }}>
          {entity === 'ActivityCheckExt' ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12 }}>
              Assessment Details previews a specific assessment's answers, not a template-level sample — open an assessment's review screen to see this data.
            </div>
          ) : previewRows.length === 0 || fields.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12 }}>Add at least one field to preview real data.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  {fields.map((f) => (
                    <th key={f.fieldKey} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--border)', color: 'var(--ocean-deep)' }}>
                      {headerRow ? f.header || f.fieldKey : f.fieldKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--gray-100)' }}>
                    {fields.map((f) => (
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
      )}
    </div>
  )
}
