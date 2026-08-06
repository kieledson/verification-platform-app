import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon, Avatar } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SearchBox, SectionTabs, RecordCard, EmptyState } from '@/features/portal/portalUi'

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
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      [u.displayName, u.email, u.organisationName, u.country].some((f) => f.toLowerCase().includes(q)),
    )
  }, [users, query])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader
        title="Users"
        subtitle={`${users.length} user${users.length === 1 ? '' : 's'} across every project`}
        actions={
          <>
            <SearchBox value={query} onChange={setQuery} placeholder="Search users" />
            <Button variant="primary" iconLeft={<Icon name="user-plus" size={15} />} onClick={() => navigate('/security/users/new')}>
              Invite new user
            </Button>
          </>
        }
      />
      <SectionTabs
        items={[
          { to: '/security/users', label: 'Users' },
          { to: '/security/invitations', label: 'Invitations' },
          { to: '/security/roles', label: 'Roles' },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="users" title="No users found" subtitle={query ? 'Try a different search.' : 'No users yet.'} />
      ) : (
        filtered.map((u) => (
          <RecordCard key={u.id} accentColor={STATUS_ACCENT[u.status]} onClick={() => navigate(`/security/users/${u.id}`)}>
            <Avatar name={u.displayName} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{u.displayName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {u.email} · {u.organisationName} · {u.country}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
              {u.roleIds.map((id) => (
                <Badge key={id} tone="brand">
                  {roleName(id)}
                </Badge>
              ))}
            </div>
            <div style={{ width: 110, flex: 'none', textAlign: 'right' }}>
              <Badge tone={u.status === 'Active' ? 'success' : 'neutral'}>{u.status}</Badge>
            </div>
          </RecordCard>
        ))
      )}
    </div>
  )
}
