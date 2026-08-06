import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/design-system/components'
import { useSecurityStore } from '@/state/securityStore'
import * as rolesRepo from '@/db/repositories/roles'
import { PERMISSION_MATRIX, PERMISSION_GROUPS } from '@/security/permissionMatrix'
import { SearchBox } from '@/features/portal/portalUi'
import type { PermissionScope } from '@/db/schema'

const SCOPES: PermissionScope[] = ['None', 'Filtered[PGS]', 'Filtered[CTRY]', 'Global']

const SCOPE_COLOR: Record<PermissionScope, string> = {
  None: 'var(--text-muted)',
  'Filtered[PGS]': 'var(--ocean)',
  'Filtered[CTRY]': 'var(--sand)',
  Global: 'var(--success)',
}

export function RolePermissionsPage() {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const roles = useSecurityStore((s) => s.roles)
  const loaded = useSecurityStore((s) => s.loaded)
  const loadAll = useSecurityStore((s) => s.loadAll)
  const [scopeByCode, setScopeByCode] = useState<Record<string, PermissionScope>>({})
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  useEffect(() => {
    if (!roleId) return
    void rolesRepo.listPermissionsForRole(roleId).then((rows) => {
      setScopeByCode(Object.fromEntries(rows.map((r) => [r.claimCode, r.scope])))
    })
  }, [roleId])

  const role = roles.find((r) => r.id === roleId)

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byGroup = new Map<string, typeof PERMISSION_MATRIX>()
    for (const group of PERMISSION_GROUPS) byGroup.set(group, [])
    for (const perm of PERMISSION_MATRIX) {
      if (q && !perm.claimCode.toLowerCase().includes(q) && !perm.description.toLowerCase().includes(q)) continue
      byGroup.get(perm.group)?.push(perm)
    }
    return [...byGroup.entries()].filter(([, perms]) => perms.length > 0)
  }, [query])

  async function setScope(claimCode: string, scope: PermissionScope) {
    if (!roleId) return
    setScopeByCode((cur) => ({ ...cur, [claimCode]: scope }))
    await rolesRepo.setPermissionScope(roleId, claimCode, scope)
  }

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <button
        type="button"
        onClick={() => navigate('/security/roles')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to roles
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: 0 }}>
            {role?.name ?? 'Role'} permissions
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {PERMISSION_MATRIX.length} claims across {PERMISSION_GROUPS.length} groups. Each claim's grant is a scope, not a boolean.
          </div>
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="Search claims" />
      </div>

      {grouped.map(([group, perms]) => (
        <div key={group} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ocean)', marginBottom: 8 }}>
            {group} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({perms.length})</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(1,44,76,0.05)' }}>
            {perms.map((perm, i) => {
              const scope = scopeByCode[perm.claimCode] ?? perm.admin
              return (
                <div
                  key={perm.claimCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{perm.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{perm.claimCode}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
                    {SCOPES.map((s) => {
                      const active = scope === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void setScope(perm.claimCode, s)}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: 999,
                            border: `1px solid ${active ? SCOPE_COLOR[s] : 'var(--border)'}`,
                            background: active ? SCOPE_COLOR[s] : '#fff',
                            color: active ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
