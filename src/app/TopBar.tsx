import { Logo, Icon, Avatar, IconButton } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import { usePinLockStore } from '@/state/pinLockStore'
import type { ConnectionMode } from '@/sync/simulatedNetwork'

const CONNECTION_ICON: Record<ConnectionMode, string> = {
  offline: 'cloud-off',
  cellular: 'signal',
  wifi: 'wifi',
}

/** Plain white top bar for the assessment-list screen only — the workspace
 * and review screens render their own dark chrome (`AssessmentChrome.tsx`,
 * per the Assessment Workspace v2 handoff), so this no longer carries a
 * farm-identity pill or save status; see `AppShell.tsx` for which route
 * gets which header. A single connection control doubles as a dev/demo
 * lever: it shows the current simulated state (icon + label, grey when
 * offline) and is itself the `<select>` that changes it. */
export function TopBar({ eyebrow }: { eyebrow: string }) {
  const connectionMode = useUiStore((s) => s.connectionMode)
  const setConnectionMode = useUiStore((s) => s.setConnectionMode)
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
        {/* Shows the current simulated connection (icon + label, grey when
            offline) and doubles as the demo control that changes it. The
            dashed ring is the only visual cue that this is a demo lever
            rather than a real network indicator. */}
        <div
          title="Demo control — simulates the device's network state"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 999,
            outline: '1px dashed var(--border-strong)',
            outlineOffset: 3,
          }}
        >
          <Icon
            name={CONNECTION_ICON[connectionMode]}
            size={13}
            style={{
              position: 'absolute',
              left: 12,
              color: connectionMode === 'offline' ? 'var(--sand-deep)' : '#fff',
              pointerEvents: 'none',
            }}
          />
          <select
            aria-label="Connection status (demo: change to simulate wifi, cellular, or offline)"
            value={connectionMode}
            onChange={(e) => setConnectionMode(e.target.value as ConnectionMode)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              border: 'none',
              borderRadius: 999,
              padding: '5px 12px 5px 32px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              background: connectionMode === 'offline' ? 'var(--highlight)' : 'var(--ocean)',
              color: connectionMode === 'offline' ? 'var(--sand-deep)' : '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="wifi">Wifi</option>
            <option value="cellular">Cellular</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <IconButton label="Lock the device" onClick={() => void lock()}>
          <Icon name="lock" size={18} />
        </IconButton>

        <Avatar name="Linh Pham" size={32} />
      </div>
    </header>
  )
}
