import { create } from 'zustand'
import * as pinLockRepo from '@/db/repositories/pinLock'

interface PinLockState {
  hasPin: boolean
  isLocked: boolean
  error: string | null
  refresh: () => Promise<void>
  createPin: (pin: string) => Promise<void>
  attemptUnlock: (pin: string) => Promise<boolean>
  lock: () => Promise<void>
  recordActivity: () => Promise<void>
}

export const usePinLockStore = create<PinLockState>((set) => ({
  hasPin: false,
  isLocked: false,
  error: null,

  refresh: async () => {
    const state = await pinLockRepo.getPinLockState()
    set({ hasPin: !!state, isLocked: !!state?.lockedAt })
  },

  createPin: async (pin) => {
    await pinLockRepo.setPin(pin)
    set({ hasPin: true, isLocked: false, error: null })
  },

  attemptUnlock: async (pin) => {
    const ok = await pinLockRepo.verifyPin(pin)
    if (ok) {
      set({ isLocked: false, error: null })
    } else {
      set({ error: 'Incorrect PIN' })
    }
    return ok
  },

  lock: async () => {
    await pinLockRepo.lockNow()
    set({ isLocked: true })
  },

  recordActivity: async () => {
    await pinLockRepo.recordActivity()
  },
}))
