import { useEffect, useState, type MouseEvent, type CSSProperties } from 'react'
import { Icon } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import * as sitesRepo from '@/db/repositories/sites'
import type { SiteRecord } from '@/db/schema'

const OFFLINE_NOTE =
  'You need to be online to get location. The coordinates shown were captured 08:14 today — ' +
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

function useSite(farmSiteId: string): SiteRecord | undefined {
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

/** The compact, always-visible answer-column control for the SITE_DETAILS
 * question — farm name/site id/coordinates as a trigger, plus the
 * "Map & details" / "Hide map" toggle. The full map itself (`SiteMap` below)
 * is rendered full-width beneath the question row, only when expanded. */
export function SiteDetailsTrigger({
  farmSiteId,
  expanded,
  onToggle,
}: {
  farmSiteId: string
  expanded: boolean
  onToggle: () => void
}) {
  const site = useSite(farmSiteId)
  const coordFormat = useAssessmentStore((s) => s.coordFormat)
  const pin = useAssessmentStore((s) => s.pin)
  const gps = site?.gps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, width: 340 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          textAlign: 'right',
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--ocean-deep)' }}>
            {site?.farmName ?? farmSiteId}
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
            {site?.referenceCode ?? ''}
            {gps ? ` · ${formatCoords(gps.lat, gps.lng, coordFormat)}` : pin ? ' · pin placed' : ''}
          </span>
        </span>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
      </button>
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontSize: 11.5,
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {expanded ? 'Hide map' : 'Map & details'}
      </button>
    </div>
  )
}

/** The SITE_DETAILS expanded view: satellite basemap, pin, coordinate
 * readout, farm record row, Get location / Move pin controls and the
 * DD/DMS format toggle. Rendered full-width beneath the question row. */
export function SiteMap({ farmSiteId }: { farmSiteId: string }) {
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
    <div style={{ width: '100%', marginTop: 8 }}>
      <div
        onClick={handleMapClick}
        style={{
          position: 'relative',
          width: '100%',
          height: 218,
          borderRadius: 10,
          overflow: 'hidden',
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
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
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
          }}
        >
          <span
            style={{
              background: '#fff',
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 2,
              boxShadow: '0 1px 2px rgba(1,44,76,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {site?.referenceCode ?? ''}
          </span>
          <Icon
            name="map-pin"
            size={28}
            style={{ color: 'var(--rating-good)', filter: 'drop-shadow(0 2px 3px rgba(1,44,76,0.35))' }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            background: 'rgba(1,44,76,0.82)',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800 }}>
            {gps ? formatCoords(gps.lat, gps.lng, coordFormat) : 'No coordinates recorded yet'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            Accurate to within {accuracy} m · captured {formatCapturedAt(capturedAt)}
          </div>
        </div>
      </div>

      {!online && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--sand-deep)', lineHeight: 1.45 }}>{OFFLINE_NOTE}</div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '12px 2px',
          borderBottom: '1px solid var(--gray-100)',
          marginTop: 8,
        }}
      >
        <FarmField label="Farm owner" value={site?.farmName} />
        <FarmField label="Group" value={site?.groupName} />
        <FarmField label="Project" value={site?.projectName} />
        <FarmField label="Region" value={site?.region} />
        <FarmField label="Country" value={site?.country} />
        <FarmField label="Address" value={site?.address} grow />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => void handleGetLocation()} style={mapButtonStyle(true)} disabled={!online}>
            <Icon name="locate-fixed" size={13} /> Get location
          </button>
          <button
            type="button"
            onClick={() => setPlacingPin(!placingPin)}
            style={mapButtonStyle(false, placingPin)}
          >
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
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-body)' }}>{value ?? '—'}</div>
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
