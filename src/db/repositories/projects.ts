import { db, type ProjectRecord } from '@/db/schema'

export async function createProject(
  input: Omit<ProjectRecord, 'createdAt' | 'updatedAt'>,
): Promise<ProjectRecord> {
  const now = Date.now()
  const record: ProjectRecord = { ...input, createdAt: now, updatedAt: now }
  await db.projects.add(record)
  return record
}

export function listProjects(): Promise<ProjectRecord[]> {
  return db.projects.toArray()
}

export function getProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id)
}

export async function updateProject(id: string, patch: Partial<Omit<ProjectRecord, 'id'>>): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id)
}
