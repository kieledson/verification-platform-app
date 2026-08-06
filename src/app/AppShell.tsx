import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from '@/app/TopBar'
import { PinLockScreen } from '@/features/pin-lock/PinLockScreen'
import { LaunchScreen } from '@/features/launch/LaunchScreen'
import { usePinLockStore } from '@/state/pinLockStore'
import { usePinLockTimer } from '@/features/pin-lock/usePinLockTimer'
import { seedIfEmpty } from '@/db/seed'
import { seedDemoAssessmentsIfEmpty } from '@/db/demoAssessments'

export function AppShell() {
  const isLocked = usePinLockStore((s) => s.isLocked)
  const refresh = usePinLockStore((s) => s.refresh)
  const [ready, setReady] = useState(false)
  // Shown once per cold start (AppShell only mounts on a fresh page load,
  // never on client-side route navigation) over whatever's underneath —
  // the assessment list or the PIN screen, whichever `isLocked` calls for.
  const [showLaunch, setShowLaunch] = useState(true)
  usePinLockTimer()
  const location = useLocation()
  // The workspace and review screens render their own dark chrome
  // (`AssessmentChrome.tsx`) in place of the plain white top bar — only the
  // bare assessment list uses this one.
  const showPlainTopBar = location.pathname === '/assessments'

  useEffect(() => {
    async function boot() {
      // Sites must exist before demo assessments reference them, and
      // nothing that reads from Dexie (the assessment list's first load)
      // should run until seeding has actually finished writing — otherwise
      // the list can render empty and never re-fetch.
      await seedIfEmpty()
      await seedDemoAssessmentsIfEmpty()
      await refresh()
      setReady(true)
    }
    void boot()
  }, [refresh])

  return (
    // Caps the whole app at the design's native 1194x834 tablet-landscape
    // frame (README: "1194×834 tablet frame, iPad landscape") and centers
    // it both ways, with a neutral backdrop outside that frame — otherwise
    // a wide/tall desktop browser stretches everything edge-to-edge, which
    // reads as "zoomed in" compared to the tablet-scale mockups. `height`
    // still shrinks below 834 on a shorter viewport (maxHeight only ever
    // caps, never forces overflow).
    <div
      style={{
        height: '100%',
        background: 'var(--gray-200, #D8D8D8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1194,
          height: '100%',
          maxHeight: 834,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          border: '10px solid var(--ocean-deep, #012C4C)',
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(1,44,76,0.18)',
        }}
      >
        {showPlainTopBar && <TopBar eyebrow="FIELD ASSESSMENT" />}
        <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-warm, #FBFAE8)', display: 'flex', flexDirection: 'column' }}>
          {ready ? <Outlet /> : null}
        </div>
        {isLocked && <PinLockScreen onUnlocked={() => void refresh()} />}
        {showLaunch && <LaunchScreen onDone={() => setShowLaunch(false)} />}
      </div>
    </div>
  )
}
