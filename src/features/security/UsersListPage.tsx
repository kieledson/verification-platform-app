import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon, Avatar, DataTable, type DataTableColumn } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SectionTabs, EmptyState } from '@/features/portal/portalUi'
import type { UserRecord } from '@/db/schema'

const STATUS_ACCENT: Record<string, string> = {
  Active: 'var(--success)',
  Deactivated: 'var(--border-strong)',
}

export function UsersListPage() {
  const navigate = useNavigate()
  const users = useSecurityStore((s) => s.users)
  const roles = useSecurityStore((s) => s.roles)
  const loaded = useSecurityStore((s) => s.loaded)
  const loadAll = useSecurityStore((s) => s.loadAll)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id
  const roleNames = (u: UserRecord) => u.roleIds.map(roleName)

  const columns: DataTableColumn<UserRecord>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '2fr',
        sortValue: (u) => u.displayName,
        filter: { type: 'text', placeholder: 'Filter name…' },
        filterValue: (u) => u.displayName,
        render: (u) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Avatar name={u.displayName} size={32} />
            <span style={{ fontWeight: 700, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {u.displayName}
            </span>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        width: '1.7fr',
        sortValue: (u) => u.email,
        filter: { type: 'text', placeholder: 'Filter email…' },
        filterValue: (u) => u.email,
        render: (u) => <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</span>,
      },
      {
        key: 'org',
        header: 'Organisation',
        width: '1.4fr',
        sortValue: (u) => u.organisationName,
        filter: { type: 'text', placeholder: 'Filter org…' },
        filterValue: (u) => u.organisationName,
        render: (u) => <span style={{ fontSize: 13 }}>{u.organisationName}</span>,
      },
      {
        key: 'location',
        header: 'Location',
        width: '130px',
        sortValue: (u) => u.country,
        filter: { type: 'select' },
        filterValue: (u) => u.country,
        render: (u) => <span style={{ fontSize: 13 }}>{u.country}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        width: '1.2fr',
        sortValue: (u) => roleNames(u)[0] ?? '',
        filter: { type: 'select' },
        filterValue: (u) => roleNames(u)[0] ?? '',
        render: (u) => (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {u.roleIds.map((id) => (
              <Badge key={id} tone="brand">
                {roleName(id)}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '120px',
        align: 'right',
        sortValue: (u) => u.status,
        filter: { type: 'select' },
        filterValue: (u) => u.status,
        render: (u) => <Badge tone={u.status === 'Active' ? 'success' : 'neutral'}>{u.status}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roleName reads `roles`, which is already a dep
    [roles],
  )

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Users"
        subtitle={`${users.length} user${users.length === 1 ? '' : 's'} across every project`}
        actions={
          <Button variant="primary" iconLeft={<Icon name="user-plus" size={15} />} onClick={() => navigate('/security/users/new')}>
            Invite new user
          </Button>
        }
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
        rows={users}
        getRowId={(u) => u.id}
        accentColor={(u) => STATUS_ACCENT[u.status]}
        onRowClick={(u) => navigate(`/security/users/${u.id}`)}
        emptyState={<EmptyState icon="users" title="No users found" subtitle="Try a different filter." />}
      />
    </div>
  )
}
