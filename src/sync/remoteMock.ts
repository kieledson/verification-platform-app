import { remoteDb, type AssessmentRecord, type AnswerRecord, type AttachmentRecord } from '@/db/schema'
import { simulatedLatency, simulatedNetwork } from '@/sync/simulatedNetwork'

/** "Uploading" = copying rows into the remote-mock database after
 * artificial latency. Swappable for a real backend later by replacing only
 * this module's bodies — callers never talk to "the server" directly. */

export async function uploadAssessmentMeta(record: AssessmentRecord): Promise<void> {
  if (!simulatedNetwork.isOnline()) throw new Error('offline')
  await simulatedLatency()
  if (!simulatedNetwork.isOnline()) throw new Error('connection dropped mid-upload')
  await remoteDb.assessments.put(record)
}

export async function uploadAnswersBatch(rows: AnswerRecord[]): Promise<void> {
  if (!simulatedNetwork.isOnline()) throw new Error('offline')
  await simulatedLatency()
  if (!simulatedNetwork.isOnline()) throw new Error('connection dropped mid-upload')
  await remoteDb.answers.bulkPut(rows)
}

export async function uploadAttachment(record: AttachmentRecord): Promise<void> {
  if (!simulatedNetwork.canSyncPhotos()) throw new Error('photos deferred until wifi')
  await simulatedLatency()
  if (!simulatedNetwork.canSyncPhotos()) throw new Error('connection dropped mid-upload')
  await remoteDb.attachments.put(record)
}
