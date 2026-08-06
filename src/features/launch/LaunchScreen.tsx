import { useEffect, useRef, useState } from 'react'

type Phase = 'logo' | 'logoOut' | 'title' | 'enter' | 'done'

/** Scheduled timeline (ms) — the confirmed shipping "Normal speed" timing
 * from the Launch Screen handoff. Driven by a fixed schedule (not
 * animationend/update hooks) so it can't drift or get stuck. */
const T_LOGO_OUT = 2600
const T_TITLE = 3200
const T_ENTER = 7200
const EXIT_DELAY_MS = 300
const EXIT_FADE_MS = 900
const EXIT_TOTAL_MS = EXIT_DELAY_MS + EXIT_FADE_MS

const ZOOM_SECONDS = 9
const BAR_SECONDS = 8.5

/**
 * Animated title screen shown once per cold start, before the assessment
 * list (or PIN screen). Unmounts itself via `onDone` — never left as an
 * invisible overlay blocking input. Tap anywhere to skip straight to the
 * app; `prefers-reduced-motion` drops the photo zoom and the logo/title
 * scale-in for quick plain cross-fades instead.
 */
export function LaunchScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('logo')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function schedule() {
    clearTimers()
    timersRef.current = [
      setTimeout(() => setPhase('logoOut'), T_LOGO_OUT),
      setTimeout(() => setPhase('title'), T_TITLE),
      setTimeout(() => setPhase('enter'), T_ENTER),
      setTimeout(() => setPhase('done'), T_ENTER + EXIT_TOTAL_MS),
    ]
  }

  useEffect(() => {
    schedule()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot timeline, deliberately runs once
  }, [])

  useEffect(() => {
    if (phase === 'done') onDone()
  }, [phase, onDone])

  function skip() {
    if (phase === 'enter' || phase === 'done') return
    clearTimers()
    setPhase('enter')
    timersRef.current = [setTimeout(() => setPhase('done'), EXIT_TOTAL_MS)]
  }

  if (phase === 'done') return null

  const phaseLogo = phase === 'logo' || phase === 'logoOut'
  const phaseTitle = phase === 'title' || phase === 'enter'
  const logoAnim = reducedMotion
    ? phase === 'logoOut'
      ? 'vpFadeOut 300ms ease forwards'
      : 'vpFadeIn 300ms ease forwards'
    : phase === 'logoOut'
      ? 'vpLogoOut 1400ms ease forwards'
      : 'vpLogoIn 1100ms ease backwards'
  const titleAnim = reducedMotion ? 'vpFadeIn 300ms ease forwards' : 'vpTitleIn 1600ms ease forwards'

  return (
    <div
      role="presentation"
      onClick={skip}
      title="Tap to skip"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 100,
        background: 'var(--ocean-deep)',
        cursor: 'pointer',
        animation: phase === 'enter' ? `vpFadeOut ${EXIT_FADE_MS}ms ease ${EXIT_DELAY_MS}ms forwards` : undefined,
      }}
    >
      <img
        src="/assets/launch/farm-aerial.jpg"
        alt="Aerial view of shrimp farm ponds in the Mekong Delta"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transformOrigin: '50% 42%',
          animation: reducedMotion ? undefined : `vpZoom ${ZOOM_SECONDS}s cubic-bezier(0.16, 0.6, 0.45, 1) forwards`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(1,44,76,0.30) 0%, rgba(1,44,76,0.10) 40%, rgba(1,44,76,0.50) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 62% 55% at 50% 48%, rgba(1,44,76,0.52) 0%, rgba(1,44,76,0.28) 55%, rgba(1,44,76,0) 100%)',
        }}
      />

      {phaseLogo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/assets/launch/mba-kelp-mark.png"
            alt="Monterey Bay Aquarium kelp mark"
            style={{
              width: 430,
              height: 430,
              objectFit: 'contain',
              animation: logoAnim,
              filter: 'brightness(0) invert(1) drop-shadow(0 14px 44px rgba(1,44,76,0.55))',
            }}
          />
        </div>
      )}

      {phaseTitle && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 108,
              fontWeight: 600,
              lineHeight: 1.04,
              textAlign: 'center',
              color: '#fff',
              textShadow: '0 4px 28px rgba(1,44,76,0.6)',
              animation: titleAnim,
            }}
          >
            Verification
            <br />
            Platform
          </span>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 26,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.75)',
            animation: 'vpFadeIn 800ms ease 600ms backwards',
          }}
        >
          Loading your assessments…
        </span>
        <span
          style={{
            width: 220,
            height: 2,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.22)',
            overflow: 'hidden',
            display: 'block',
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              borderRadius: 999,
              background: 'var(--ocean-light)',
              animation: `vpBarIn ${BAR_SECONDS}s linear forwards`,
            }}
          />
        </span>
      </div>
    </div>
  )
}
