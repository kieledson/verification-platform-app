import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { toEngineAnswers } from '@/standard/answerMapping'
import type { Question, Section } from '@/standard/schema/types'
import { isQuestionEffectivelyAnswered, useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import { QuestionRow } from '@/features/workspace/QuestionRow'
import * as assessmentsRepo from '@/db/repositories/assessments'
import * as sitesRepo from '@/db/repositories/sites'
import type { AssessmentRecord, SiteRecord } from '@/db/schema'

const QUESTION_BY_ID = new Map<number, Question>(STANDARD.questions.map((q) => [q.id, q]))

function relativeTime(ts: number, now: number): string {
  const diffMin = Math.floor((now - ts) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 min ago'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr === 1) return '1 hour ago'
  if (diffHr < 24) return `${diffHr} hours ago`
  const diffDay = Math.floor(diffHr / 24)
  return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
}

export function WorkspacePage() {
  const { assessmentId, sectionId } = useParams<{ assessmentId: string; sectionId?: string }>()
  const navigate = useNavigate()

  const openAssessment = useAssessmentStore((s) => s.openAssessment)
  const activeAssessmentId = useAssessmentStore((s) => s.activeAssessmentId)
  const activeSectionId = useAssessmentStore((s) => s.activeSectionId)
  const setActiveSection = useAssessmentStore((s) => s.setActiveSection)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const lastSavedAt = useAssessmentStore((s) => s.lastSavedAt)
  const onlyUnanswered = useUiStore((s) => s.onlyUnanswered)
  const toggleOnlyUnanswered = useUiStore((s) => s.toggleOnlyUnanswered)
  const setAssessmentHeader = useUiStore((s) => s.setAssessmentHeader)

  const [assessment, setAssessment] = useState<AssessmentRecord | undefined>(undefined)
  const [site, setSite] = useState<SiteRecord | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())

  // Load (or switch to) the assessment named by the route, guarding against
  // re-running the (async, DB-hitting) open on every render.
  useEffect(() => {
    if (assessmentId && activeAssessmentId !== assessmentId) {
      void openAssessment(assessmentId)
    }
  }, [assessmentId, activeAssessmentId, openAssessment])

  useEffect(() => {
    if (!assessmentId) return
    void assessmentsRepo.getAssessment(assessmentId).then(setAssessment)
  }, [assessmentId])

  useEffect(() => {
    if (!assessment) return
    void sitesRepo.getSite(assessment.farmSiteId).then(setSite)
  }, [assessment])

  // Keep the URL's :sectionId (when present) and the store's activeSectionId
  // in sync, e.g. on a hard refresh landing directly on a section route.
  useEffect(() => {
    if (!sectionId) return
    const id = Number(sectionId)
    if (!Number.isNaN(id) && id !== activeSectionId) setActiveSection(id)
  }, [sectionId, activeSectionId, setActiveSection])

  // Refreshes the "Draft saved N min ago" footer text periodically.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Renders the farm-details pill in the shared TopBar itself (matching the
  // design's single 56px header bar) instead of a separate sub-header row.
  useEffect(() => {
    if (!site && !assessment) return
    setAssessmentHeader({
      farmName: site?.farmName ?? 'Assessment',
      siteReference: site?.referenceCode ?? '',
      standardLabel: `Shrimp: Farm Standard ${assessment?.standardVersion?.split('v')[1] ?? '2.4'}`,
      assessorType: assessment?.assessorType ?? '',
      onBack: () => navigate('/assessments'),
    })
    return () => setAssessmentHeader(null)
  }, [site, assessment, navigate, setAssessmentHeader])

  const engineAnswers = useMemo(() => toEngineAnswers(answers), [answers])

  const sectionStats = useMemo(
    () =>
      STANDARD.sections.map((section) => {
        const questions = section.questionIds.map((id) => QUESTION_BY_ID.get(id)).filter((q): q is Question => !!q)
        const mandatoryVisible = questions.filter((q) => q.isMandatory && visibility[q.code])
        const answeredCount = mandatoryVisible.filter((q) => isQuestionEffectivelyAnswered(q.code)).length
        return { section, total: mandatoryVisible.length, answered: answeredCount }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- answers feeds isQuestionEffectivelyAnswered indirectly via the store
    [visibility, answers],
  )

  const overall = useMemo(() => {
    const totals = sectionStats.reduce(
      (acc, s) => ({ answered: acc.answered + s.answered, total: acc.total + s.total }),
      { answered: 0, total: 0 },
    )
    const percent = totals.total === 0 ? 0 : Math.round((totals.answered / totals.total) * 100)
    return { ...totals, percent }
  }, [sectionStats])

  const activeSection: Section | undefined =
    STANDARD.sections.find((s) => s.id === activeSectionId) ?? STANDARD.sections[0]

  const sectionQuestions = useMemo(() => {
    if (!activeSection) return []
    return activeSection.questionIds
      .map((id) => QUESTION_BY_ID.get(id))
      .filter((q): q is Question => !!q && !!visibility[q.code])
  }, [activeSection, visibility])

  // Per the README: compute the "N questions apply" / "N of M still to
  // answer" counts from this UNFILTERED visible list — deriving them from
  // the already-onlyUnanswered-filtered list was a real bug in the original
  // design.
  const totalVisible = sectionQuestions.length
  const unansweredCount = sectionQuestions.filter((q) => !isQuestionEffectivelyAnswered(q.code)).length
  const countText = onlyUnanswered
    ? `${unansweredCount} of ${totalVisible} still to answer`
    : `${totalVisible} question${totalVisible === 1 ? '' : 's'} apply to this farm`

  function passesFilter(q: Question): boolean {
    return !onlyUnanswered || !isQuestionEffectivelyAnswered(q.code)
  }

  function handleSectionClick(section: Section) {
    setActiveSection(section.id)
    navigate(`/assessments/${assessmentId}/section/${section.id}`)
  }

  if (!assessmentId || activeAssessmentId !== assessmentId || !activeSection) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading assessment…</div>
  }

  const sectionIndex = STANDARD.sections.findIndex((s) => s.id === activeSection.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left rail */}
        <div
          style={{
            width: 288,
            flex: 'none',
            background: '#fff',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <div
            style={{
              height: 86,
              flex: 'none',
              borderBottom: '1px solid var(--border)',
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Assessment progress
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ocean-deep)' }}>{overall.percent}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'var(--gray-100)' }}>
              <div
                style={{
                  width: `${overall.percent}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'var(--ocean)',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {overall.answered} of {overall.total} questions answered for this farm
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {sectionStats.map(({ section, total, answered }, index) => {
              const active = section.id === activeSection.id
              const complete = total > 0 && answered === total
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section)}
                  style={{
                    flex: '1 1 0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 3,
                    padding: '4px 18px',
                    border: 'none',
                    borderLeft: active ? '3px solid var(--ocean)' : '3px solid transparent',
                    background: active ? 'var(--color-primary-subtle)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        flex: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9.5,
                        fontWeight: 700,
                        background: active ? 'var(--ocean)' : 'var(--gray-100)',
                        color: active ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: active ? 'var(--ocean-deep)' : 'var(--text-body)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {section.name}
                    </span>
                    {complete && (
                      <Icon name="check-circle-2" size={13} style={{ color: 'var(--success)', flex: 'none' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 999, background: 'var(--gray-100)' }}>
                      <div
                        style={{
                          width: total === 0 ? '0%' : `${Math.round((answered / total) * 100)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: complete ? 'var(--success)' : 'var(--ocean-light)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 'none', minWidth: 30, textAlign: 'right' }}>
                      {answered}/{total}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div
            style={{
              flex: 'none',
              padding: '10px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <Icon name="save" size={13} />
              Draft saved {lastSavedAt ? relativeTime(lastSavedAt, now) : 'not yet'}
            </div>
            <Button variant="primary" block onClick={() => navigate(`/assessments/${assessmentId}/review`)}>
              Review &amp; finalise
            </Button>
          </div>
        </div>

        {/* Right pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              height: 86,
              flex: 'none',
              background: 'var(--surface-warm)',
              borderBottom: '1px solid var(--border)',
              padding: '12px 26px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Section {sectionIndex + 1} of {STANDARD.sections.length}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, color: 'var(--text-strong)' }}>
                {activeSection.name}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={toggleOnlyUnanswered}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: onlyUnanswered ? 'none' : '1px solid var(--border)',
                  background: onlyUnanswered ? 'var(--ocean)' : '#fff',
                  color: onlyUnanswered ? '#fff' : 'var(--text-body)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Icon name="filter" size={14} />
                Only unanswered
              </button>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{countText}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-warm)', padding: '20px 26px 40px' }}>
            <div
              style={{
                maxWidth: 980,
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '4px 16px 8px',
              }}
            >
              {activeSection.subsections
                ? activeSection.subsections.map((sub) => {
                    const subQuestions = sub.questionIds
                      .map((id) => QUESTION_BY_ID.get(id))
                      .filter((q): q is Question => !!q && !!visibility[q.code] && passesFilter(q))
                    if (subQuestions.length === 0) return null
                    return (
                      <div key={sub.name}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-muted)',
                            padding: '10px 4px 4px',
                          }}
                        >
                          {sub.name}
                        </div>
                        {subQuestions.map((q) => (
                          <QuestionRow
                            key={q.id}
                            question={q}
                            assessmentId={assessmentId}
                            farmSiteId={assessment?.farmSiteId ?? ''}
                            engineAnswers={engineAnswers}
                          />
                        ))}
                      </div>
                    )
                  })
                : sectionQuestions.filter(passesFilter).map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      assessmentId={assessmentId}
                      farmSiteId={assessment?.farmSiteId ?? ''}
                      engineAnswers={engineAnswers}
                    />
                  ))}

              {totalVisible === 0 && (
                <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  No questions apply to this farm in this section.
                </div>
              )}
              {totalVisible > 0 && onlyUnanswered && unansweredCount === 0 && (
                <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  Every question in this section is answered.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
