import { useEffect } from 'react'
import { usePinLockStore } from '@/state/pinLockStore'
import * as pinLockRepo from '@/db/repositories/pinLock'

const CHECK_INTERVAL_MS = 15_000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/** Polls for auto-lock on an interval and records activity on user input —
 * the PIN lock is a device-level gate, independent of any session concept,
 * so this has nothing to do with server auth. */
export function usePinLockTimer(): void {
  const refresh = usePinLockStore((s) => s.refresh)

  useEffect(() => {
    const interval = setInterval(async () => {
      const locked = await pinLockRepo.checkAutoLock()
      if (locked) void refresh()
    }, CHECK_INTERVAL_MS)

    const onActivity = () => void pinLockRepo.recordActivity()
    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, onActivity, { passive: true })

    void refresh()

    return () => {
      clearInterval(interval)
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, onActivity)
    }
  }, [refresh])
}
