import { db, type UserRecord } from '@/db/schema'

export async function createUser(
  input: Omit<UserRecord, 'createdAt' | 'updatedAt'>,
): Promise<UserRecord> {
  const now = Date.now()
  const record: UserRecord = { ...input, createdAt: now, updatedAt: now }
  await db.users.add(record)
  return record
}

export function listUsers(): Promise<UserRecord[]> {
  return db.users.toArray()
}

export function getUser(id: string): Promise<UserRecord | undefined> {
  return db.users.get(id)
}

export async function updateUser(id: string, patch: Partial<Omit<UserRecord, 'id'>>): Promise<void> {
  await db.users.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteUser(id: string): Promise<void> {
  await db.users.delete(id)
}

/** Users are deactivated, never deleted (Document 2 §6.2). */
export async function setUserStatus(id: string, status: UserRecord['status']): Promise<void> {
  await updateUser(id, { status })
}
