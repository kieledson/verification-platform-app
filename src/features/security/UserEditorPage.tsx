import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Checkbox, Icon } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import { newId } from '@/lib/id'
import type { AssessorType, OrganisationType, UserStatus } from '@/db/schema'

const ASSESSOR_TYPES: AssessorType[] = ['None', 'Company', 'Collaborator', 'SGS']
const ORG_TYPES: OrganisationType[] = ['Industry', 'Government', 'Academic', 'NGO', 'Certification Body', 'System']
const STATUSES: UserStatus[] = ['Active', 'Deactivated']

export function UserEditorPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const isNew = userId === 'new'
  const users = useSecurityStore((s) => s.users)
  const roles = useSecurityStore((s) => s.roles)
  const loaded = useSecurityStore((s) => s.loaded)
  const loadAll = useSecurityStore((s) => s.loadAll)
  const createUser = useSecurityStore((s) => s.createUser)
  const updateUser = useSecurityStore((s) => s.updateUser)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const existing = useMemo(() => users.find((u) => u.id === userId), [users, userId])

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [assessorType, setAssessorType] = useState<AssessorType>('None')
  const [organisationName, setOrganisationName] = useState('')
  const [organisationType, setOrganisationType] = useState<OrganisationType>('Industry')
  const [country, setCountry] = useState('Vietnam')
  const [status, setStatus] = useState<UserStatus>('Active')

  useEffect(() => {
    if (!existing) return
    setDisplayName(existing.displayName)
    setEmail(existing.email)
    setRoleIds(existing.roleIds)
    setAssessorType(existing.assessorType)
    setOrganisationName(existing.organisationName)
    setOrganisationType(existing.organisationType)
    setCountry(existing.country)
    setStatus(existing.status)
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>User not found.</div>
  }

  function toggleRole(id: string) {
    setRoleIds((cur) => (cur.includes(id) ? cur.filter((r) => r !== id) : [...cur, id]))
  }

  async function handleSave() {
    if (isNew) {
      await createUser({ id: newId(), displayName, email, roleIds, assessorType, organisationName, organisationType, country, status })
    } else if (userId) {
      await updateUser(userId, { displayName, email, roleIds, assessorType, organisationName, organisationType, country, status })
    }
    navigate('/security/users')
  }

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 720 }}>
      <button
        type="button"
        onClick={() => navigate('/security/users')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to users
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 18px' }}>
        {isNew ? 'Invite new user' : displayName || 'Edit user'}
      </h1>

      <Card padding="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Display name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email address" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} hint="Doubles as the username" />
          <Select label="Assessor type" value={assessorType} onChange={(e) => setAssessorType(e.target.value as AssessorType)} options={ASSESSOR_TYPES} />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)} options={STATUSES} />
          <Input label="Organisation name" value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} />
          <Select label="Organisation type" value={organisationType} onChange={(e) => setOrganisationType(e.target.value as OrganisationType)} options={ORG_TYPES} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>User roles</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {roles.map((r) => (
              <Checkbox key={r.id} label={r.name} checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {!isNew && (
              <>
                <Button variant="secondary" onClick={() => setNotice('Password reset email sent (demo only).')}>
                  Reset password
                </Button>
                <Button variant="danger" onClick={() => { void updateUser(userId!, { status: 'Deactivated' }); setStatus('Deactivated') }}>
                  Lock user
                </Button>
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => void handleSave()} disabled={!displayName || !email}>
            {isNew ? 'Send invitation' : 'Save'}
          </Button>
        </div>
        {notice && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--success)' }}>{notice}</div>}
      </Card>
    </div>
  )
}
