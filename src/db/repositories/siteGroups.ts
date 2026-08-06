import { db, type SiteGroupRecord } from '@/db/schema'

export async function createSiteGroup(
  input: Omit<SiteGroupRecord, 'createdAt' | 'updatedAt'>,
): Promise<SiteGroupRecord> {
  const now = Date.now()
  const record: SiteGroupRecord = { ...input, createdAt: now, updatedAt: now }
  await db.siteGroups.add(record)
  return record
}

export function listSiteGroups(): Promise<SiteGroupRecord[]> {
  return db.siteGroups.toArray()
}

export function listSiteGroupsForProject(projectId: string): Promise<SiteGroupRecord[]> {
  return db.siteGroups.where('projectId').equals(projectId).toArray()
}

export function getSiteGroup(id: string): Promise<SiteGroupRecord | undefined> {
  return db.siteGroups.get(id)
}

export async function updateSiteGroup(id: string, patch: Partial<Omit<SiteGroupRecord, 'id'>>): Promise<void> {
  await db.siteGroups.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteSiteGroup(id: string): Promise<void> {
  await db.siteGroups.delete(id)
}
