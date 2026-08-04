import { db, type AttachmentRecord } from '@/db/schema'
import { newId } from '@/lib/id'

export async function addAttachment(input: {
  assessmentId: string
  questionCode: string
  label: string
  blob: Blob
}): Promise<AttachmentRecord> {
  const record: AttachmentRecord = {
    id: newId(),
    assessmentId: input.assessmentId,
    questionCode: input.questionCode,
    label: input.label,
    sizeBytes: input.blob.size,
    blob: input.blob,
    capturedAt: Date.now(),
    syncState: 'local',
  }
  await db.attachments.add(record)
  return record
}

export function loadAttachmentsForAssessment(assessmentId: string): Promise<AttachmentRecord[]> {
  return db.attachments.where('assessmentId').equals(assessmentId).toArray()
}

export function loadAttachmentsForQuestion(
  assessmentId: string,
  questionCode: string,
): Promise<AttachmentRecord[]> {
  return db.attachments
    .where('assessmentId')
    .equals(assessmentId)
    .filter((a) => a.questionCode === questionCode)
    .toArray()
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.attachments.delete(id)
}

export async function setAttachmentSyncState(
  id: string,
  syncState: AttachmentRecord['syncState'],
): Promise<void> {
  await db.attachments.update(id, { syncState })
}
