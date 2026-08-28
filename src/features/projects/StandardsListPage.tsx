import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon, Input, DataTable, type DataTableColumn } from '@/design-system/components'
import { useStandardsStore } from '@/state/standardsStore'
import { PageHeader, SearchBox, SectionTabs, EmptyState } from '@/features/portal/portalUi'
import type { StandardRecord } from '@/db/schema'

const STATUS_TONE: Record<StandardRecord['status'], 'success' | 'neutral' | 'info'> = {
  Published: 'success',
  Draft: 'info',
  Archived: 'neutral',
}

/** Clone is a real deep-copy write (not just local form state), so it asks
 * for the new name/version up front rather than opening a whole editor
 * first — same overlay-modal convention as `NewAssessmentDialog`. */
function CloneDialog({
  source,
  onCancel,
  onConfirm,
}: {
  source: StandardRecord
  onCancel: () => void
  onConfirm: (name: string, version: string) => void
}) {
  const [name, setName] = useState(`${source.name} (copy)`)
  const [version, setVersion] = useState(`${source.version}-draft`)

  return (
    <div
      onClick={onCancel}
      style={{ position: 'absolute', inset: 0, background: 'rgba(1,44,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 12px 32px rgba(1,44,76,0.14)' }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px', fontSize: 20 }}>
          Clone “{source.name}”
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="New standard name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onConfirm(name, version)} disabled={!name || !version}>
            Clone into a new draft
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StandardsListPage() {
  const navigate = useNavigate()
  const standards = useStandardsStore((s) => s.standards)
  const loaded = useStandardsStore((s) => s.loaded)
  const loadAll = useStandardsStore((s) => s.loadAll)
  const cloneStandard = useStandardsStore((s) => s.cloneStandard)
  const [query, setQuery] = useState('')
  const [cloning, setCloning] = useState<StandardRecord | null>(null)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return standards.filter((s) => !q || s.name.toLowerCase().includes(q) || s.version.toLowerCase().includes(q))
  }, [standards, query])

  const columns: DataTableColumn<StandardRecord>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '2fr',
        sortValue: (s) => s.name,
        render: (s) => (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Version {s.version}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '110px',
        sortValue: (s) => s.status,
        render: (s) => <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>,
      },
      {
        key: 'active',
        header: 'Active',
        width: '90px',
        render: (s) => (s.isActive ? <Icon name="check-circle-2" size={16} style={{ color: 'var(--success)' }} /> : null),
      },
      {
        key: 'sections',
        header: 'Sections',
        width: '90px',
        sortValue: (s) => s.sections.length,
        render: (s) => s.sections.length,
      },
      {
        key: 'questions',
        header: 'Questions',
        width: '100px',
        sortValue: (s) => s.questions.length,
        render: (s) => s.questions.length,
      },
      {
        key: 'actions',
        header: '',
        width: '90px',
        align: 'right',
        render: (s) => (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Icon name="copy" size={13} />}
            onClick={(e) => {
              e.stopPropagation()
              setCloning(s)
            }}
          >
            Clone
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div style={{ padding: '22px 26px 30px', position: 'relative' }}>
      <PageHeader
        title="Standards"
        subtitle={`${standards.length} standard${standards.length === 1 ? '' : 's'} — Published standards are read-only; clone one to make revisions.`}
        actions={
          <>
            <SearchBox value={query} onChange={setQuery} placeholder="Search standards" />
            <Button variant="primary" iconLeft={<Icon name="plus" size={15} />} onClick={() => navigate('/standard/new')}>
              New standard
            </Button>
          </>
        }
      />
      <SectionTabs items={[{ to: '/projects', label: 'Projects' }, { to: '/standard', label: 'Standards' }]} />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={(s) => s.id}
        onRowClick={(s) => navigate(`/standard/${s.id}`)}
        emptyState={<EmptyState icon="book-marked" title="No standards found" />}
      />

      {cloning && (
        <CloneDialog
          source={cloning}
          onCancel={() => setCloning(null)}
          onConfirm={async (name, version) => {
            const clone = await cloneStandard(cloning.id, name, version)
            setCloning(null)
            navigate(`/standard/${clone.id}`)
          }}
        />
      )}
    </div>
  )
}
