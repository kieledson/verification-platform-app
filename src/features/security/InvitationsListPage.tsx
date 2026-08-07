import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Icon, DataTable, type DataTableColumn } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SearchBox, SectionTabs, EmptyState } from '@/features/portal/portalUi'
import type { InvitationRecord } from '@/db/schema'

const STATUS_ACCENT: Record<string, string> = {
  Pending: 'var(--ocean-light)',
  Accepted: 'var(--success)',
  Expired: 'var(--border-strong)',
}
const STATUS_TONE: Record<string, 'info' | 'success' | 'neutral'> = {
  Pending: 'info',
  Accepted: 'success',
  Expired: 'neutral',
}

export function InvitationsListPage() {
  const invitations = useSecurityStore((s) => s.invitations)
  const loaded = useSecurityStore((s) => s.loaded)
  const loadAll = useSecurityStore((s) => s.loadAll)
  const resendInvitation = useSecurityStore((s) => s.resendInvitation)
  const [resent, setResent] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return invitations
    return invitations.filter((inv) =>
      [inv.displayName, inv.email, inv.invitedBy, inv.status].some((f) => f.toLowerCase().includes(q)),
    )
  }, [invitations, query])

  const columns: DataTableColumn<InvitationRecord>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '1.6fr',
        sortValue: (inv) => inv.displayName,
        render: (inv) => <span style={{ fontWeight: 700, fontSize: 14 }}>{inv.displayName}</span>,
      },
      {
        key: 'email',
        header: 'Email',
        width: '1.7fr',
        sortValue: (inv) => inv.email,
        render: (inv) => <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.email}</span>,
      },
      {
        key: 'invitedBy',
        header: 'Invited by',
        width: '1.3fr',
        sortValue: (inv) => inv.invitedBy,
        render: (inv) => <span style={{ fontSize: 13 }}>{inv.invitedBy}</span>,
      },
      {
        key: 'date',
        header: 'Date',
        width: '130px',
        sortValue: (inv) => inv.date,
        render: (inv) => (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(inv.date).toLocaleDateString()}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '110px',
        sortValue: (inv) => inv.status,
        render: (inv) => <Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge>,
      },
      {
        key: 'actions',
        header: '',
        width: '110px',
        align: 'right',
        render: (inv) => (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Icon name="rotate-cw" size={13} />}
            onClick={(e) => {
              e.stopPropagation()
              void resendInvitation(inv.id)
              setResent(inv.id)
            }}
          >
            {resent === inv.id ? 'Resent' : 'Resend'}
          </Button>
        ),
      },
    ],
    [resent, resendInvitation],
  )

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Invitations"
        subtitle={`${invitations.length} invitation${invitations.length === 1 ? '' : 's'}`}
        actions={<SearchBox value={query} onChange={setQuery} placeholder="Search invitations" />}
      />
      <SectionTabs
        items={[
          { to: '/security/users', label: 'Users' },
          { to: '/security/invitations', label: 'Invitations' },
          { to: '/security/roles', label: 'Roles' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={(inv) => inv.id}
        accentColor={(inv) => STATUS_ACCENT[inv.status]}
        emptyState={<EmptyState icon="mail" title="No invitations found" subtitle={query ? 'Try a different search.' : undefined} />}
      />
    </div>
  )
}
