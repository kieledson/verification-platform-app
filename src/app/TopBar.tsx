import { Logo, Icon, Avatar, Button } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import { usePinLockStore } from '@/state/pinLockStore'
import type { ConnectionMode } from '@/sync/simulatedNetwork'

const CONNECTION_LABEL: Record<ConnectionMode, string> = {
  offline: 'Offline',
  cellular: 'Cellular',
  wifi: 'Online',
}

const CONNECTION_ICON: Record<ConnectionMode, string> = {
  offline: 'cloud-off',
  cellular: 'signal',
  wifi: 'wifi',
}

/** Top bar per the field-app design spec: 56px, white, 1px bottom border,
 * kelp mark + wordmark + eyebrow left; connectivity pill, a connectivity
 * simulation control, PIN-lock button, avatar right. The connection
 * selector is a dev/demo-only addition beyond the design's single
 * online/offline toggle (see plan §4) — visually distinct from the rest. */
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
        background: 'var(--white, #fff)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: connectionMode === 'offline' ? 'var(--highlight)' : 'var(--ocean)',
            color: connectionMode === 'offline' ? 'var(--sand-deep)' : '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <Icon name={CONNECTION_ICON[connectionMode]} size={14} />
          {CONNECTION_LABEL[connectionMode]}
        </div>

        {/* Dev/demo-only — simulates wifi vs. cellular vs. offline so photo
            deferral behavior is actually demonstrable. Not a real product
            control. */}
        <select
          aria-label="Simulate connection (demo only)"
          value={connectionMode}
          onChange={(e) => setConnectionMode(e.target.value as ConnectionMode)}
          style={{
            fontSize: 11,
            border: '1px dashed var(--border-strong)',
            borderRadius: 6,
            padding: '2px 6px',
            color: 'var(--text-muted)',
            background: 'transparent',
          }}
        >
          <option value="wifi">sim: wifi</option>
          <option value="cellular">sim: cellular</option>
          <option value="offline">sim: offline</option>
        </select>

        <Button
          variant="ghost"
          size="sm"
          iconLeft={<Icon name="lock" size={14} />}
          onClick={() => void lock()}
        >
          Lock
        </Button>

        <Avatar name="Linh Pham" size={32} />
      </div>
    </header>
  )
}
