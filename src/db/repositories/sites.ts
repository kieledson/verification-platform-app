import { db, type SiteRecord } from '@/db/schema'

export function listSites(): Promise<SiteRecord[]> {
  return db.sites.toArray()
}

export function getSite(id: string): Promise<SiteRecord | undefined> {
  return db.sites.get(id)
}

export async function upsertSites(sites: SiteRecord[]): Promise<void> {
  await db.sites.bulkPut(sites)
}

export async function updateSiteGps(
  id: string,
  gps: SiteRecord['gps'],
): Promise<void> {
  await db.sites.update(id, { gps })
}
