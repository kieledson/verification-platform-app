import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '@/app/TopBar'
import { PinLockScreen } from '@/features/pin-lock/PinLockScreen'
import { usePinLockStore } from '@/state/pinLockStore'
import { usePinLockTimer } from '@/features/pin-lock/usePinLockTimer'
import { seedIfEmpty } from '@/db/seed'

export function AppShell() {
  const isLocked = usePinLockStore((s) => s.isLocked)
  const refresh = usePinLockStore((s) => s.refresh)
  usePinLockTimer()

  useEffect(() => {
    void seedIfEmpty()
    void refresh()
  }, [refresh])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar eyebrow="FIELD ASSESSMENT" />
      <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-warm, #FBFAE8)' }}>
        <Outlet />
      </div>
      {isLocked && <PinLockScreen onUnlocked={() => void refresh()} />}
    </div>
  )
}
