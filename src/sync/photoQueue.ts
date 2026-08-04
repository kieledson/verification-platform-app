import { db, type PhotoQueueEntry } from '@/db/schema'
import { newId } from '@/lib/id'
import { simulatedNetwork } from '@/sync/simulatedNetwork'
import { uploadAttachment } from '@/sync/remoteMock'
import * as attachmentsRepo from '@/db/repositories/attachments'

/**
 * Photos are queued separately from answers and only drain on simulated
 * wifi — this is what "Photos stay on this tablet until you sync" means
 * concretely. An 8MB photo over a cellular-sim connection stays
 * `deferred-wifi` even while answer sync proceeds normally.
 */
export async function enqueuePhoto(attachmentId: string, assessmentId: string, sizeBytes: number): Promise<void> {
  const entry: PhotoQueueEntry = {
    id: newId(),
    attachmentId,
    assessmentId,
    sizeBytes,
    state: simulatedNetwork.canSyncPhotos() ? 'queued' : 'deferred-wifi',
    createdAt: Date.now(),
  }
  await db.photoQueue.add(entry)
  await attachmentsRepo.setAttachmentSyncState(attachmentId, 'queued')
  void processPhotoQueue()
}

export function loadPhotoQueueForAssessment(assessmentId: string): Promise<PhotoQueueEntry[]> {
  return db.photoQueue.where('assessmentId').equals(assessmentId).toArray()
}

export async function processPhotoQueue(): Promise<void> {
  if (!simulatedNetwork.canSyncPhotos()) {
    // Re-flag anything still pending as explicitly wifi-deferred so the UI
    // can say why it hasn't moved.
    const pending = await db.photoQueue.where('state').anyOf('queued', 'deferred-wifi').toArray()
    await Promise.all(
      pending
        .filter((p) => p.state !== 'deferred-wifi')
        .map((p) => db.photoQueue.update(p.id, { state: 'deferred-wifi' })),
    )
    return
  }

  const ready = await db.photoQueue.where('state').anyOf('queued', 'deferred-wifi').toArray()
  for (const entry of ready) {
    await db.photoQueue.update(entry.id, { state: 'uploading' })
    await attachmentsRepo.setAttachmentSyncState(entry.attachmentId, 'uploading')
    try {
      const attachment = await db.attachments.get(entry.attachmentId)
      if (!attachment) throw new Error('attachment missing')
      await uploadAttachment(attachment)
      await db.photoQueue.update(entry.id, { state: 'synced' })
      await attachmentsRepo.setAttachmentSyncState(entry.attachmentId, 'synced')
    } catch {
      await db.photoQueue.update(entry.id, { state: 'deferred-wifi' })
      await attachmentsRepo.setAttachmentSyncState(entry.attachmentId, 'queued')
    }
  }
}

simulatedNetwork.subscribe((mode) => {
  if (mode === 'wifi') void processPhotoQueue()
})
