import { NavLink } from 'react-router-dom'
import { Logo, Icon, Avatar, IconButton } from '@/design-system/components'
import { usePinLockStore } from '@/state/pinLockStore'
import { ConnectionPill } from '@/app/ConnectionPill'

/** The five top-level destinations, styled like the real Portal's four
 * menus (Document 4 §2) plus "Your assessments" as the Field-App-side peer
 * tab — per the "top-level nav alongside Your Assessments" decision, one
 * shell instead of a separate Portal mode. */
const NAV_ITEMS = [
  { to: '/assessments', label: 'Your assessments', icon: 'clipboard-list' },
  { to: '/security', label: 'Security', icon: 'shield' },
  { to: '/admin', label: 'Admin', icon: 'settings' },
  { to: '/projects', label: 'Project', icon: 'folder-kanban' },
  { to: '/reports', label: 'Reports', icon: 'bar-chart-3' },
] as const

/** Plain white top bar shared by every screen except the workspace/review
 * (which render their own dark chrome, `AssessmentChrome.tsx`) — see
 * `AppShell.tsx` for the exact route split. The connection pill is shared
 * with that dark chrome (`ConnectionPill.tsx`) so the two look and behave
 * identically. */
export function TopBar() {
  const lock = usePinLockStore((s) => s.lock)

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        gap: 16,
        background: 'var(--white, #fff)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <Logo variant="mark-color" height={30} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Verification Platform
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/assessments'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                height: '100%',
                padding: '0 12px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? 'var(--ocean)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--ocean)' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              })}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        <ConnectionPill />

        <IconButton label="Lock the device" onClick={() => void lock()}>
          <Icon name="lock" size={18} />
        </IconButton>

        <Avatar name="Linh Pham" size={32} />
      </div>
    </header>
  )
}
