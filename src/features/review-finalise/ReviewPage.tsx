import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SectionCompletionList, overallCompleteness } from '@/features/review-finalise/SectionCompletionList'
import { EvidenceCard } from '@/features/review-finalise/EvidenceCard'
import { SignatureCapture } from '@/features/review-finalise/SignatureCapture'
import { FinaliseCard } from '@/features/review-finalise/FinaliseCard'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import * as assessmentsRepo from '@/db/repositories/assessments'
import * as sitesRepo from '@/db/repositories/sites'
import type { AssessmentRecord, SiteRecord } from '@/db/schema'
import { relativeTime } from '@/lib/relativeTime'

export function ReviewPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const activeAssessmentId = useAssessmentStore((s) => s.activeAssessmentId)
  const openAssessment = useAssessmentStore((s) => s.openAssessment)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const lastSavedAt = useAssessmentStore((s) => s.lastSavedAt)
  const setAssessmentHeader = useUiStore((s) => s.setAssessmentHeader)

  const [assessment, setAssessment] = useState<AssessmentRecord | undefined>(undefined)
  const [site, setSite] = useState<SiteRecord | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

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

  // Same shared TopBar pill the workspace uses — see WorkspacePage.tsx.
  useEffect(() => {
    if (!site && !assessment) return
    setAssessmentHeader({
      farmName: site?.farmName ?? 'Assessment',
      siteReference: site?.referenceCode ?? '',
      assessorType: assessment?.assessorType ?? '',
      savedLabel: lastSavedAt ? `Saved ${relativeTime(lastSavedAt, now)}` : null,
      onBack: () => navigate(`/assessments/${assessmentId}`),
    })
    return () => setAssessmentHeader(null)
  }, [site, assessment, assessmentId, navigate, setAssessmentHeader, lastSavedAt, now])

  if (!assessmentId) return null

  const { complete } = overallCompleteness(answers, visibility)

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 20px' }}>
        Before you finalise
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <SectionCompletionList assessmentId={assessmentId} />

        <div>
          <EvidenceCard assessmentId={assessmentId} />
          <SignatureCapture assessmentId={assessmentId} />
          <FinaliseCard assessmentId={assessmentId} allAnswered={complete} />
        </div>
      </div>
    </div>
  )
}
