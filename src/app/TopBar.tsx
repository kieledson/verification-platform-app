import { Logo, Icon, Avatar, IconButton } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import { usePinLockStore } from '@/state/pinLockStore'
import type { ConnectionMode } from '@/sync/simulatedNetwork'

const CONNECTION_ICON: Record<ConnectionMode, string> = {
  offline: 'cloud-off',
  cellular: 'signal',
  wifi: 'wifi',
}

/** Top bar per the field-app design spec: 56px, white, 1px bottom border,
 * kelp mark + wordmark + eyebrow left; a single connection control, PIN-lock
 * button, avatar right. A real web app can't detect wifi vs. cellular, so
 * the connection control doubles as a dev/demo lever: it shows the current
 * simulated state (icon + label, grey when offline) and is itself the
 * `<select>` that changes it — one element, not a status pill plus a
 * separate hidden dropdown. */
export function TopBar({ eyebrow }: { eyebrow: string }) {
  const connectionMode = useUiStore((s) => s.connectionMode)
  const setConnectionMode = useUiStore((s) => s.setConnectionMode)
  const assessmentHeader = useUiStore((s) => s.assessmentHeader)
  const lock = usePinLockStore((s) => s.lock)

  return (
    <header
      style={{
        position: 'relative',
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

      {assessmentHeader && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 620,
            minWidth: 0,
          }}
        >
          <button
            type="button"
            onClick={assessmentHeader.onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--ocean-light)',
              background: 'var(--color-primary-subtle)',
              borderRadius: 999,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 12.5,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Icon name="chevron-left" size={14} style={{ color: 'var(--ocean-deep)', flex: 'none' }} />
            <span
              style={{
                fontWeight: 700,
                color: 'var(--ocean-deep)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {assessmentHeader.farmName}
            </span>
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {assessmentHeader.siteReference} · {assessmentHeader.assessorType} assessment
            </span>
          </button>

          {assessmentHeader.savedLabel && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
            >
              <Icon name="save" size={12} />
              {assessmentHeader.savedLabel}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        {/* Shows the current simulated connection (icon + label, grey when
            offline) and doubles as the demo control that changes it — see
            the note on ConnectionMode above. */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
