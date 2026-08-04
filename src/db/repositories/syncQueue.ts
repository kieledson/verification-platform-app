import { db, type SyncQueueEntry, type SyncQueueKind } from '@/db/schema'
import { newId } from '@/lib/id'

export async function enqueue(
  assessmentId: string,
  kind: SyncQueueKind,
  payload: unknown,
): Promise<SyncQueueEntry> {
  const entry: SyncQueueEntry = {
    id: newId(),
    assessmentId,
    kind,
    payload,
    state: 'pending',
    attempts: 0,
    createdAt: Date.now(),
  }
  await db.syncQueue.add(entry)
  return entry
}

export function pendingEntries(): Promise<SyncQueueEntry[]> {
  return db.syncQueue.where('state').anyOf('pending', 'failed').toArray()
}

export function entriesForAssessment(assessmentId: string): Promise<SyncQueueEntry[]> {
  return db.syncQueue.where('assessmentId').equals(assessmentId).toArray()
}

export async function markInFlight(id: string): Promise<void> {
  await db.syncQueue.update(id, { state: 'in-flight' })
}

export async function markDone(id: string): Promise<void> {
  await db.syncQueue.update(id, { state: 'done' })
}

export async function markFailed(id: string, error: string): Promise<void> {
  const entry = await db.syncQueue.get(id)
  await db.syncQueue.update(id, {
    state: 'failed',
    lastError: error,
    attempts: (entry?.attempts ?? 0) + 1,
  })
}
