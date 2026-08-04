import { useEffect, useRef, useState } from 'react'
import { Logo, Icon, Avatar, IconButton } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import { usePinLockStore } from '@/state/pinLockStore'
import type { ConnectionMode } from '@/sync/simulatedNetwork'
import { relativeTime } from '@/lib/relativeTime'

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

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Pulses briefly on an actual new save (lastSavedAt changing), not on
  // every 30s tick of the display text — a ref (not state) tracks the
  // previously-seen timestamp precisely so ticking alone never re-triggers it.
  const [justSaved, setJustSaved] = useState(false)
  const prevSavedAtRef = useRef<number | null | undefined>(undefined)
  useEffect(() => {
    const current = assessmentHeader?.lastSavedAt ?? null
    const prev = prevSavedAtRef.current
    prevSavedAtRef.current = current
    if (prev !== undefined && prev !== null && current !== null && current !== prev) {
      setJustSaved(true)
      const timer = setTimeout(() => setJustSaved(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [assessmentHeader?.lastSavedAt])

  const savedText = !assessmentHeader
    ? null
    : assessmentHeader.lastSavedAt
      ? `Saved ${relativeTime(assessmentHeader.lastSavedAt, now)}`
      : 'Not yet saved'

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

          {savedText && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                color: justSaved ? 'var(--success)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                flex: 'none',
                transition: 'color 0.4s ease',
              }}
            >
              <Icon name={justSaved ? 'check' : 'save'} size={12} />
              {savedText}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        {/* Shows the current simulated connection (icon + label, grey when
            offline) and doubles as the demo control that changes it — see
            the note on ConnectionMode above. The dashed ring is the only
            visual cue that this is a demo lever rather than a real network
            indicator; kept faint so it doesn't compete with the pill itself. */}
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
