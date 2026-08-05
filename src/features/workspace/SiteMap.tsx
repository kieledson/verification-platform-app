import { useEffect, useState, type MouseEvent, type CSSProperties } from 'react'
import { Icon } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import * as sitesRepo from '@/db/repositories/sites'
import type { SiteRecord } from '@/db/schema'

const OFFLINE_NOTE = 'You need to be online to get location. The coordinates shown were captured 08:14 today — ' +
  'check them against the farm record before you finalise.'

function toDMS(value: number, positive: string, negative: string): string {
  const hemisphere = value >= 0 ? positive : negative
  const abs = Math.abs(value)
  const degrees = Math.floor(abs)
  const minutesFloat = (abs - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = (minutesFloat - minutes) * 60
  return `${degrees}°${minutes}'${seconds.toFixed(1)}"${hemisphere}`
}

function formatCoords(lat: number, lng: number, format: 'dd' | 'dms'): string {
  if (format === 'dd') return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  return `${toDMS(lat, 'N', 'S')} ${toDMS(lng, 'E', 'W')}`
}

function formatCapturedAt(capturedAt: number): string {
  const date = new Date(capturedAt)
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const isToday = new Date().toDateString() === date.toDateString()
  return isToday ? `${time} today` : `${time} on ${date.toLocaleDateString()}`
}

export function useSite(farmSiteId: string): SiteRecord | undefined {
  const [site, setSite] = useState<SiteRecord | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    void sitesRepo.getSite(farmSiteId).then((s) => {
      if (!cancelled) setSite(s)
    })
    return () => {
      cancelled = true
    }
  }, [farmSiteId])
  return site
}

/** The SITE_DETAILS control: a 300×148 satellite strip (pin, coordinate
 * plate) beside the farm record fields, per the Assessment Workspace v2
 * handoff §C — always visible when this question is current, no separate
 * expand/collapse trigger. Get location / Move pin / DD-DMS toggle aren't
 * shown in the handoff's own illustrative markup, but nothing in its
 * explicit change list retires them, so the real interactivity from the
 * original spec is kept, just restyled to the new compact layout. */
export function SiteDetailsPanel({ farmSiteId }: { farmSiteId: string }) {
  const site = useSite(farmSiteId)
  const online = useUiStore((s) => s.connectionMode !== 'offline')
  const pin = useAssessmentStore((s) => s.pin)
  const gpsReading = useAssessmentStore((s) => s.gps)
  const coordFormat = useAssessmentStore((s) => s.coordFormat)
  const placingPin = useAssessmentStore((s) => s.placingPin)
  const setCoordFormat = useAssessmentStore((s) => s.setCoordFormat)
  const setPlacingPin = useAssessmentStore((s) => s.setPlacingPin)
  const setPin = useAssessmentStore((s) => s.setPin)
  const setGps = useAssessmentStore((s) => s.setGps)

  const pinPos = pin ?? { x: 58, y: 46 }
  const gps = site?.gps

  async function handleGetLocation() {
    if (!online || !site) return
    const baseLat = gps?.lat ?? 9.74168
    const baseLng = gps?.lng ?? 106.34544
    const nextLat = baseLat + (Math.random() - 0.5) * 0.0006
    const nextLng = baseLng + (Math.random() - 0.5) * 0.0006
    const accuracy = Math.round(5 + Math.random() * 8)
    const capturedAt = Date.now()
    setGps({ accuracy, capturedAt })
    setPin({
      x: Math.min(92, Math.max(8, pinPos.x + (Math.random() - 0.5) * 6)),
      y: Math.min(88, Math.max(12, pinPos.y + (Math.random() - 0.5) * 6)),
    })
    await sitesRepo.updateSiteGps(site.id, { lat: nextLat, lng: nextLng, accuracy, capturedAt })
  }

  function handleMapClick(e: MouseEvent<HTMLDivElement>) {
    if (!placingPin) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPin({ x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) })
  }

  const accuracy = gpsReading?.accuracy ?? gps?.accuracy ?? 8
  const capturedAt = gpsReading?.capturedAt ?? gps?.capturedAt ?? Date.now()

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        <div
          onClick={handleMapClick}
          style={{
            width: 300,
            height: 148,
            flex: 'none',
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: 'url(/assets/farm-satellite.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: placingPin ? 'crosshair' : 'default',
          }}
        >
          {placingPin && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(252,233,166,0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 10,
              }}
            >
              <span
                style={{
                  background: 'var(--highlight)',
                  color: 'var(--sand-deep)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 999,
                }}
              >
                Tap the map
              </span>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              left: `${pinPos.x}%`,
              top: `${pinPos.y}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span
              style={{
                background: '#fff',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: 9.5,
                fontWeight: 800,
                color: 'var(--ocean-deep)',
                boxShadow: '0 2px 6px rgba(1,44,76,0.28)',
                whiteSpace: 'nowrap',
              }}
            >
              {site?.referenceCode ?? ''}
            </span>
            <Icon
              name="map-pin"
              size={22}
              style={{ color: 'var(--rating-good)', filter: 'drop-shadow(0 2px 4px rgba(1,44,76,0.5))' }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              background: 'rgba(1,44,76,0.82)',
              borderRadius: 6,
              padding: '5px 9px',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#fff' }}>
              {gps ? formatCoords(gps.lat, gps.lng, coordFormat) : 'No coordinates recorded yet'}
            </div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)' }}>
              Accurate to within {accuracy} m · captured {formatCapturedAt(capturedAt)}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignContent: 'center' }}>
          <FarmField label="Farm owner" value={site?.farmName} />
          <FarmField label="Group" value={site?.groupName} />
          <FarmField label="Project" value={site?.projectName} />
          <FarmField label="Region" value={site?.region} />
          <FarmField label="Country" value={site?.country} />
          <FarmField label="Address" value={site?.address} grow />
          {!online && (
            <span style={{ width: '100%', fontSize: 11, color: 'var(--sand-deep)', lineHeight: 1.45 }}>
              {OFFLINE_NOTE}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => void handleGetLocation()} style={mapButtonStyle(true)} disabled={!online}>
            <Icon name="locate-fixed" size={13} /> Get location
          </button>
          <button type="button" onClick={() => setPlacingPin(!placingPin)} style={mapButtonStyle(false, placingPin)}>
            <Icon name="move" size={13} /> {placingPin ? 'Tap the map' : 'Move pin'}
          </button>
        </div>

        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 999, padding: 2 }}>
          {(['dd', 'dms'] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setCoordFormat(format)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '4px 14px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                background: coordFormat === format ? 'var(--ocean)' : 'transparent',
                color: coordFormat === format ? '#fff' : 'var(--text-muted)',
              }}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FarmField({ label, value, grow }: { label: string; value: string | undefined; grow?: boolean }) {
  return (
    <div style={{ flex: grow ? 1 : 'none', minWidth: grow ? 120 : 90 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)' }}>{value ?? '—'}</div>
    </div>
  )
}

function mapButtonStyle(primary: boolean, active = false): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    borderRadius: 999,
    border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? 'var(--ocean)' : active ? 'var(--highlight)' : '#fff',
    color: primary ? '#fff' : active ? 'var(--sand-deep)' : 'var(--text-body)',
    cursor: 'pointer',
  }
}
