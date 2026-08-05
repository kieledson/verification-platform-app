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
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 1px 2px rgba(1,44,76,0.05)',
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ocean)' }}>
        Evidence collected
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text-strong)' }}>
          {attachments.length}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          photos · {formatBytes(totalBytes)} on this tablet
        </span>
      </div>
      <button
        onClick={() => setShowGallery(true)}
        style={{ background: 'none', border: 'none', color: 'var(--ocean)', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0, textAlign: 'left' }}
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
    </div>
  )
}
