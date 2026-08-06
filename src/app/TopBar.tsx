import { Logo, Icon, Avatar, IconButton } from '@/design-system/components'
import { usePinLockStore } from '@/state/pinLockStore'
import { ConnectionPill } from '@/app/ConnectionPill'

/** Plain white top bar for the assessment-list screen only — the workspace
 * and review screens render their own dark chrome (`AssessmentChrome.tsx`,
 * per the Assessment Workspace v2 handoff), so this no longer carries a
 * farm-identity pill or save status; see `AppShell.tsx` for which route
 * gets which header. The connection pill is shared with that dark chrome
 * (`ConnectionPill.tsx`) so the two look and behave identically. */
export function TopBar({ eyebrow }: { eyebrow: string }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        <Logo variant="mark-color" height={30} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
            Verification Platform
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {eyebrow}
          </div>
        </div>
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
