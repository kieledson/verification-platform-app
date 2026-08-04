import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '@/app/TopBar'
import { PinLockScreen } from '@/features/pin-lock/PinLockScreen'
import { usePinLockStore } from '@/state/pinLockStore'
import { usePinLockTimer } from '@/features/pin-lock/usePinLockTimer'
import { seedIfEmpty } from '@/db/seed'
import { seedDemoAssessmentsIfEmpty } from '@/db/demoAssessments'

export function AppShell() {
  const isLocked = usePinLockStore((s) => s.isLocked)
  const refresh = usePinLockStore((s) => s.refresh)
  const [ready, setReady] = useState(false)
  usePinLockTimer()

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar eyebrow="FIELD ASSESSMENT" />
      <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-warm, #FBFAE8)' }}>
        {ready ? <Outlet /> : null}
      </div>
      {isLocked && <PinLockScreen onUnlocked={() => void refresh()} />}
    </div>
  )
}
