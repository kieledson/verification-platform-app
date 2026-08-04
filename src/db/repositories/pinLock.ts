import { db, type PinLockState } from '@/db/schema'

const DEVICE_KEY = 'device' as const
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000

async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getPinLockState(): Promise<PinLockState | undefined> {
  return db.pinLock.get(DEVICE_KEY)
}

export async function setPin(pin: string): Promise<void> {
  const pinHash = await hash(pin)
  const now = Date.now()
  const existing = await db.pinLock.get(DEVICE_KEY)
  await db.pinLock.put({
    id: DEVICE_KEY,
    pinHash,
    lockedAt: null,
    lastActivityAt: now,
    autoLockAfterMs: existing?.autoLockAfterMs ?? DEFAULT_AUTO_LOCK_MS,
  })
}

export async function lockNow(): Promise<void> {
  const existing = await db.pinLock.get(DEVICE_KEY)
  if (!existing) return
  await db.pinLock.update(DEVICE_KEY, { lockedAt: Date.now() })
}

export async function verifyPin(pin: string): Promise<boolean> {
  const existing = await db.pinLock.get(DEVICE_KEY)
  if (!existing) return false
  const candidate = await hash(pin)
  if (candidate !== existing.pinHash) return false
  await db.pinLock.update(DEVICE_KEY, { lockedAt: null, lastActivityAt: Date.now() })
  return true
}

export async function recordActivity(): Promise<void> {
  const existing = await db.pinLock.get(DEVICE_KEY)
  if (!existing || existing.lockedAt) return
  await db.pinLock.update(DEVICE_KEY, { lastActivityAt: Date.now() })
}

/** Called on an interval by the UI layer (usePinLockTimer) — locks the
 * device store independently of any web-session concept. */
export async function checkAutoLock(): Promise<boolean> {
  const existing = await db.pinLock.get(DEVICE_KEY)
  if (!existing || existing.lockedAt) return false
  const idleFor = Date.now() - existing.lastActivityAt
  if (idleFor >= existing.autoLockAfterMs) {
    await lockNow()
    return true
  }
  return false
}
