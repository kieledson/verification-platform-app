import { db, type AssessmentRecord, type AssessmentStatus } from '@/db/schema'

export async function createAssessment(
  input: Omit<
    AssessmentRecord,
    | 'status'
    | 'progressPct'
    | 'byteSize'
    | 'createdAt'
    | 'updatedAt'
    | 'lastSavedAt'
    | 'syncAttempts'
    | 'outcome'
    | 'batch'
  >,
): Promise<AssessmentRecord> {
  const now = Date.now()
  const record: AssessmentRecord = {
    ...input,
    status: 'draft',
    progressPct: 0,
    byteSize: 0,
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now,
    syncAttempts: 0,
    outcome: null,
    batch: 1,
  }
  await db.assessments.add(record)
  return record
}

export function listAssessments(): Promise<AssessmentRecord[]> {
  return db.assessments.orderBy('updatedAt').reverse().toArray()
}

export function getAssessment(id: string): Promise<AssessmentRecord | undefined> {
  return db.assessments.get(id)
}

export async function updateAssessment(
  id: string,
  patch: Partial<Omit<AssessmentRecord, 'id'>>,
): Promise<void> {
  await db.assessments.update(id, { ...patch, updatedAt: Date.now() })
}

export async function setAssessmentStatus(id: string, status: AssessmentStatus): Promise<void> {
  await updateAssessment(id, { status })
}

export async function touchLastSaved(id: string): Promise<void> {
  await db.assessments.update(id, { lastSavedAt: Date.now(), updatedAt: Date.now() })
}

export async function recomputeByteSize(id: string): Promise<number> {
  const answers = await db.answers.where('assessmentId').equals(id).toArray()
  const attachments = await db.attachments.where('assessmentId').equals(id).toArray()
  const answersBytes = answers.reduce((n, a) => n + JSON.stringify(a.value).length, 0)
  const attachmentBytes = attachments.reduce((n, a) => n + a.sizeBytes, 0)
  const total = answersBytes + attachmentBytes
  await db.assessments.update(id, { byteSize: total })
  return total
}
