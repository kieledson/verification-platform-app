import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Icon } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SectionTabs, RecordCard } from '@/features/portal/portalUi'

export function RolesListPage() {
  const navigate = useNavigate()
  const roles = useSecurityStore((s) => s.roles)
  const users = useSecurityStore((s) => s.users)
  const loaded = useSecurityStore((s) => s.loaded)
  const loadAll = useSecurityStore((s) => s.loadAll)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader title="Roles" subtitle="Roles are data, not code — each claim's grant is a scope, not a boolean." />
      <SectionTabs
        items={[
          { to: '/security/users', label: 'Users' },
          { to: '/security/invitations', label: 'Invitations' },
          { to: '/security/roles', label: 'Roles' },
        ]}
      />

      {roles.map((r) => {
        const memberCount = users.filter((u) => u.roleIds.includes(r.id)).length
        return (
          <RecordCard key={r.id} accentColor="var(--ocean)" onClick={() => navigate(`/security/roles/${r.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.description}</div>
            </div>
            <Badge tone="neutral">
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </Badge>
            <Icon name="chevron-right" size={16} style={{ color: 'var(--text-muted)' }} />
          </RecordCard>
        )
      })}
    </div>
  )
}
