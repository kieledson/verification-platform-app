import { db, type SiteRecord } from '@/db/schema'

export function listSites(): Promise<SiteRecord[]> {
  return db.sites.toArray()
}

export function listSitesForGroup(groupId: string): Promise<SiteRecord[]> {
  return db.sites.where('groupId').equals(groupId).toArray()
}

export async function createSite(site: SiteRecord): Promise<SiteRecord> {
  await db.sites.add(site)
  return site
}

export async function updateSite(id: string, patch: Partial<Omit<SiteRecord, 'id'>>): Promise<void> {
  await db.sites.update(id, patch)
}

export async function deleteSite(id: string): Promise<void> {
  await db.sites.delete(id)
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
