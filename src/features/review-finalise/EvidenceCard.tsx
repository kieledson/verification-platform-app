import { useEffect, useState } from 'react'
import { Card } from '@/design-system/components'
import { formatBytes } from '@/lib/formatBytes'
import * as attachmentsRepo from '@/db/repositories/attachments'
import type { AttachmentRecord } from '@/db/schema'

export function EvidenceCard({ assessmentId }: { assessmentId: string }) {
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([])
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    void attachmentsRepo.loadAttachmentsForAssessment(assessmentId).then(setAttachments)
  }, [assessmentId])

  const totalBytes = attachments.reduce((n, a) => n + a.sizeBytes, 0)

  return (
    <Card padding="md" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Evidence collected
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, margin: '8px 0' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>
            {attachments.length}
          </span>{' '}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>photos</span>
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>
            {formatBytes(totalBytes)}
          </span>{' '}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>on device</span>
        </div>
      </div>
      <button
        onClick={() => setShowGallery(true)}
        style={{ background: 'none', border: 'none', color: 'var(--color-primary, var(--ocean))', cursor: 'pointer', fontSize: 13, padding: 0 }}
      >
        View photo gallery
      </button>

      {showGallery && (
        <div
          onClick={() => setShowGallery(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(1,44,76,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 950,
          }}
        >
          <Card
            padding="lg"
            style={{ maxWidth: 640, maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Photo gallery</h3>
            {attachments.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No photos yet.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {attachments.map((a) => (
                <div key={a.id} style={{ textAlign: 'center' }}>
                  <img
                    src={URL.createObjectURL(a.blob)}
                    alt={a.label}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
