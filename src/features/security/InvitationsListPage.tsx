import { useEffect, useState } from 'react'
import { Badge, Button, Icon } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { PageHeader, SectionTabs, RecordCard, EmptyState } from '@/features/portal/portalUi'

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

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader title="Invitations" subtitle={`${invitations.length} invitation${invitations.length === 1 ? '' : 's'}`} />
      <SectionTabs
        items={[
          { to: '/security/users', label: 'Users' },
          { to: '/security/invitations', label: 'Invitations' },
          { to: '/security/roles', label: 'Roles' },
        ]}
      />

      {invitations.length === 0 ? (
        <EmptyState icon="mail" title="No invitations" />
      ) : (
        invitations.map((inv) => (
          <RecordCard key={inv.id} accentColor={STATUS_ACCENT[inv.status]}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{inv.displayName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {inv.email} · invited by {inv.invitedBy} · {new Date(inv.date).toLocaleDateString()}
              </div>
            </div>
            <Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Icon name="rotate-cw" size={13} />}
              onClick={() => {
                void resendInvitation(inv.id)
                setResent(inv.id)
              }}
            >
              {resent === inv.id ? 'Resent' : 'Resend'}
            </Button>
          </RecordCard>
        ))
      )}
    </div>
  )
}
