import { db } from '@/db/schema'

/** The generated standard ships inside the app bundle already; this cache
 * exists so a future version bump doesn't require re-shipping the whole app
 * to devices that already have the current version cached. */
export async function cacheStandard(versionKey: string, json: unknown): Promise<void> {
  await db.standardCache.put({ versionKey, json, cachedAt: Date.now() })
}

export async function getCachedStandard(versionKey: string): Promise<unknown | undefined> {
  const row = await db.standardCache.get(versionKey)
  return row?.json
}
