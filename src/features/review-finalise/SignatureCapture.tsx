import { useNavigate } from 'react-router-dom'
import { Card } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { STANDARD } from '@/standard/data/standard'
import { signatureQuestions } from '@/features/review-finalise/SectionCompletionList'

/** Read-only preview of the two SIGNATURE questions. Signing itself happens
 * on the actual question row in the workspace (a real canvas pad — see
 * `workspace/controls/SignatureControl.tsx`), which stores a PNG data-URL
 * string as the answer; this card just renders that image if present, so
 * there's exactly one signing mechanism rather than two divergent ones. */
export function SignatureCapture({ assessmentId }: { assessmentId: string }) {
  const answers = useAssessmentStore((s) => s.answers)
  const navigate = useNavigate()
  const questions = signatureQuestions()

  const finalisationSection = STANDARD.sections.find((s) =>
    questions.some((q) => s.questionIds.includes(q.id)),
  )

  return (
    <Card padding="md">
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        Signatures
      </div>
      {questions.map((q) => {
        const value = answers[q.code]
        const isImage = typeof value === 'string' && value.startsWith('data:image')
        const signed = isImage || (typeof value === 'string' && value.trim().length > 0)

        return (
          <div key={q.code} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>{q.label}</div>
            <div
              style={{
                height: 76,
                border: signed ? '1px solid var(--border)' : '2px dashed var(--border-strong)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: signed ? 'default' : 'pointer',
                background: '#fff',
              }}
              onClick={() => {
                if (!signed && finalisationSection) {
                  navigate(`/assessments/${assessmentId}/section/${finalisationSection.id}`)
                }
              }}
            >
              {isImage ? (
                <img src={value} alt={`${q.label} signature`} style={{ height: '100%' }} />
              ) : signed ? (
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>
                  {value as string}
                </span>
              ) : (
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Not yet signed — tap to sign in the workspace
                </span>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
