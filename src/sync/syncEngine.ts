import { db } from '@/db/schema'
import { simulatedNetwork } from '@/sync/simulatedNetwork'
import { uploadAssessmentMeta, uploadAnswersBatch } from '@/sync/remoteMock'
import * as assessmentsRepo from '@/db/repositories/assessments'
import * as answersRepo from '@/db/repositories/answers'
import * as syncQueueRepo from '@/db/repositories/syncQueue'

/**
 * Per-assessment sync state machine:
 *
 *   draft --(all mandatory Qs effectively answered)--> ready-to-sync
 *   ready-to-sync --(assessor taps Finalise)--> pending-upload
 *   pending-upload --(online, queue drains)--> synced
 *   pending-upload --(offline / failure)--> pending-upload, retried with a
 *                                            surfaced attempt count
 *
 * Conflict resolution is out of scope: single writer per assessment, single
 * device, no real concurrency in this pass.
 */

export async function markReadyToSync(assessmentId: string): Promise<void> {
  const record = await assessmentsRepo.getAssessment(assessmentId)
  if (!record || record.status !== 'draft') return
  await assessmentsRepo.setAssessmentStatus(assessmentId, 'ready-to-sync')
}

/** Called when the assessor taps "Finalise assessment". */
export async function finaliseAssessment(assessmentId: string): Promise<void> {
  const record = await assessmentsRepo.getAssessment(assessmentId)
  if (!record) return
  await assessmentsRepo.setAssessmentStatus(assessmentId, 'pending-upload')

  await syncQueueRepo.enqueue(assessmentId, 'assessment-meta', { assessmentId })
  await syncQueueRepo.enqueue(assessmentId, 'answers-batch', { assessmentId })

  void processQueue()
}

/** Drains all pending/failed sync-queue entries. Safe to call repeatedly
 * (e.g. on an interval, or whenever connectivity flips back online) —
 * entries already `done` are skipped. */
export async function processQueue(): Promise<void> {
  if (!simulatedNetwork.isOnline()) return

  const entries = await syncQueueRepo.pendingEntries()
  for (const entry of entries) {
    await syncQueueRepo.markInFlight(entry.id)
    try {
      if (entry.kind === 'assessment-meta') {
        const record = await assessmentsRepo.getAssessment(entry.assessmentId)
        if (!record) throw new Error('assessment record missing')
        await uploadAssessmentMeta(record)
      } else {
        const rows = await answersRepo.loadAnswerRecords(entry.assessmentId)
        await uploadAnswersBatch(rows)
      }
      await syncQueueRepo.markDone(entry.id)
    } catch (err) {
      await syncQueueRepo.markFailed(entry.id, err instanceof Error ? err.message : String(err))
    }
  }

  await settleAssessmentsWithClearedQueues()
}

async function settleAssessmentsWithClearedQueues(): Promise<void> {
  const pendingUpload = await db.assessments.where('status').equals('pending-upload').toArray()
  for (const record of pendingUpload) {
    const remaining = await syncQueueRepo.entriesForAssessment(record.id)
    const allDone = remaining.length > 0 && remaining.every((e) => e.state === 'done')
    if (allDone) {
      await assessmentsRepo.setAssessmentStatus(record.id, 'synced')
    } else {
      const failedCount = remaining.filter((e) => e.state === 'failed').length
      if (failedCount > 0) {
        await db.assessments.update(record.id, { syncAttempts: record.syncAttempts + 1 })
      }
    }
  }
}

/** Re-attempt sync whenever the simulated connection flips back online. */
simulatedNetwork.subscribe((mode) => {
  if (mode !== 'offline') void processQueue()
})
