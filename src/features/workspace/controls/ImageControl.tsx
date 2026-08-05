import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '@/design-system/components'
import * as attachmentsRepo from '@/db/repositories/attachments'
import { enqueuePhoto } from '@/sync/photoQueue'
import type { AttachmentRecord } from '@/db/schema'

/** Small 44x32 thumbnails plus a dashed "Take photo"/"Add" button, per the
 * README's IMAGE control spec. The answer value is the array of attachment
 * ids (`AnswerMap` already types values as `string | string[] | number`, so
 * an attachment-id array fits without extending the schema). */
export function ImageControl({
  assessmentId,
  questionCode,
  value,
  onChange,
}: {
  assessmentId: string
  questionCode: string
  value: string[] | undefined
  onChange: (next: string[]) => void
}) {
  const attachmentIds = value ?? []
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    void attachmentsRepo.loadAttachmentsForQuestion(assessmentId, questionCode).then((rows) => {
      if (!cancelled) setAttachments(rows)
    })
    return () => {
      cancelled = true
    }
    // Re-load whenever the answer's attachment count changes (i.e. after we
    // add one below) so thumbnails stay in sync with the stored answer.
  }, [assessmentId, questionCode, attachmentIds.length])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const a of attachments) next[a.id] = URL.createObjectURL(a.blob)
    setUrls(next)
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url)
    }
  }, [attachments])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const record = await attachmentsRepo.addAttachment({
      assessmentId,
      questionCode,
      label: `Photo ${attachmentIds.length + 1}`,
      blob: file,
    })
    await enqueuePhoto(record.id, assessmentId, record.sizeBytes)
    setAttachments((prev) => [...prev, record])
    onChange([...attachmentIds, record.id])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
      {attachments.map((a) => (
        <div
          key={a.id}
          title={a.label}
          style={{
            width: 74,
            height: 54,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            flex: 'none',
          }}
        >
          {urls[a.id] && (
            <img src={urls[a.id]} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      ))}

      <label
        style={{
          width: 74,
          height: 54,
          borderRadius: 8,
          border: '1.5px dashed var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--ocean)',
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <Icon name="camera" size={16} />
        Photo
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => void handleFileChange(e)}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  )
}
