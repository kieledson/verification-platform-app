import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { SectionCompletionList, overallCompleteness } from '@/features/review-finalise/SectionCompletionList'
import { EvidenceCard } from '@/features/review-finalise/EvidenceCard'
import { SignatureCapture } from '@/features/review-finalise/SignatureCapture'
import { FinaliseCard } from '@/features/review-finalise/FinaliseCard'
import { useAssessmentStore } from '@/state/assessmentStore'

export function ReviewPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const activeAssessmentId = useAssessmentStore((s) => s.activeAssessmentId)
  const openAssessment = useAssessmentStore((s) => s.openAssessment)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)

  useEffect(() => {
    if (assessmentId && assessmentId !== activeAssessmentId) void openAssessment(assessmentId)
  }, [assessmentId, activeAssessmentId, openAssessment])

  if (!assessmentId) return null

  const { complete } = overallCompleteness(answers, visibility)

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 4px' }}>
        Before you finalise
      </h1>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Shrimp: Farm Standard v2.4 · Company assessment
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <SectionCompletionList assessmentId={assessmentId} />

        <div>
          <EvidenceCard assessmentId={assessmentId} />
          <SignatureCapture />
          <FinaliseCard assessmentId={assessmentId} allAnswered={complete} />
        </div>
      </div>
    </div>
  )
}
