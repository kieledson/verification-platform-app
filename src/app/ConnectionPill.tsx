import { Icon } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import type { ConnectionMode } from '@/sync/simulatedNetwork'

const CONNECTION_ICON: Record<ConnectionMode, string> = {
  offline: 'cloud-off',
  cellular: 'signal',
  wifi: 'wifi',
}

/** Shared connection-status pill — identical in the assessment list's plain
 * header and the assessment workspace/review's dark chrome (`dark` only
 * swaps the colour set for contrast against each background). Shows the
 * current simulated state (icon + label, distinguishing Wifi from Cellular)
 * and doubles as the `<select>` that changes it — one element, not a
 * status pill plus a separate hidden control. */
export function ConnectionPill({ dark = false }: { dark?: boolean }) {
  const connectionMode = useUiStore((s) => s.connectionMode)
  const setConnectionMode = useUiStore((s) => s.setConnectionMode)
  const offline = connectionMode === 'offline'

  const background = dark ? 'rgba(255,255,255,0.06)' : offline ? 'var(--highlight)' : 'var(--ocean)'
  const border = dark
    ? `1px solid ${offline ? 'rgba(246,160,85,0.55)' : 'rgba(95,179,239,0.5)'}`
    : 'none'
  const color = dark
    ? offline
      ? 'var(--seastar-light)'
      : 'var(--ocean-light)'
    : offline
      ? 'var(--sand-deep)'
      : '#fff'

  return (
    <div
      title="Demo control — simulates the device's network state"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 999,
        outline: dark ? undefined : '1px dashed var(--border-strong)',
        outlineOffset: dark ? undefined : 3,
      }}
    >
      <Icon
        name={CONNECTION_ICON[connectionMode]}
        size={13}
        style={{ position: 'absolute', left: 12, color, pointerEvents: 'none' }}
      />
      <select
        aria-label="Connection status (demo: change to simulate wifi, cellular, or offline)"
        value={connectionMode}
        onChange={(e) => setConnectionMode(e.target.value as ConnectionMode)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          height: 30,
          border,
          borderRadius: 999,
          padding: '0 12px 0 32px',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'inherit',
          background,
          color,
          cursor: 'pointer',
        }}
      >
        <option value="wifi">Wifi</option>
        <option value="cellular">Cellular</option>
        <option value="offline">Offline</option>
      </select>
    </div>
  )
}
