import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SectionCompletionList, overallCompleteness } from '@/features/review-finalise/SectionCompletionList'
import { EvidenceCard } from '@/features/review-finalise/EvidenceCard'
import { SignatureCapture } from '@/features/review-finalise/SignatureCapture'
import { FinaliseCard } from '@/features/review-finalise/FinaliseCard'
import { AssessmentChrome } from '@/features/workspace/AssessmentChrome'
import { flatVisibleQuestions } from '@/features/workspace/flatQuestions'
import { useAssessmentStore } from '@/state/assessmentStore'
import * as assessmentsRepo from '@/db/repositories/assessments'
import * as sitesRepo from '@/db/repositories/sites'
import type { AssessmentRecord, SiteRecord } from '@/db/schema'

export function ReviewPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const activeAssessmentId = useAssessmentStore((s) => s.activeAssessmentId)
  const openAssessment = useAssessmentStore((s) => s.openAssessment)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const setCurrentCode = useAssessmentStore((s) => s.setCurrentCode)

  const [assessment, setAssessment] = useState<AssessmentRecord | undefined>(undefined)
  const [site, setSite] = useState<SiteRecord | undefined>(undefined)

  useEffect(() => {
    if (assessmentId && assessmentId !== activeAssessmentId) void openAssessment(assessmentId)
  }, [assessmentId, activeAssessmentId, openAssessment])

  useEffect(() => {
    if (!assessmentId) return
    void assessmentsRepo.getAssessment(assessmentId).then(setAssessment)
  }, [assessmentId])

  useEffect(() => {
    if (!assessment) return
    void sitesRepo.getSite(assessment.farmSiteId).then(setSite)
  }, [assessment])

  if (!assessmentId) return null

  const { complete } = overallCompleteness(answers, visibility)

  function jumpToSection(sectionId: number) {
    const flat = flatVisibleQuestions(visibility)
    const first = flat.find((x) => x.sectionId === sectionId)
    if (first) setCurrentCode(first.question.code)
    navigate(`/assessments/${assessmentId}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AssessmentChrome
        mode="review"
        assessmentId={assessmentId}
        farmName={site?.farmName ?? 'Assessment'}
        siteReference={site?.referenceCode ?? ''}
        assessorType={assessment?.assessorType ?? ''}
        onBack={() => navigate('/assessments')}
        onToggleReview={() => navigate(`/assessments/${assessmentId}`)}
        onPickSection={jumpToSection}
      />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px 26px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ocean)' }}>
            Before you finalise
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-strong)' }}>
            Review this assessment
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 18, alignItems: 'start' }}>
          <SectionCompletionList assessmentId={assessmentId} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EvidenceCard assessmentId={assessmentId} />
            <SignatureCapture />
            <FinaliseCard assessmentId={assessmentId} allAnswered={complete} />
          </div>
        </div>
      </div>
    </div>
  )
}
