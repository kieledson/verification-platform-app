import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { toEngineAnswers, resolveCode } from '@/standard/answerMapping'
import { evaluateBoolExpr } from '@/dependency-engine/expression/evaluate'
import { useAssessmentStore } from '@/state/assessmentStore'
import { flatVisibleQuestions, isAnswered, type FlatQuestionEntry } from '@/features/workspace/flatQuestions'
import { AssessmentChrome } from '@/features/workspace/AssessmentChrome'
import { AnswerLedger } from '@/features/workspace/AnswerLedger'
import { AnswerDock } from '@/features/workspace/AnswerDock'
import { ConfirmResetDialog } from '@/features/workspace/ConfirmResetDialog'
import { sortOptionsForDisplay } from '@/features/workspace/controls/pillStyle'
import { localize } from '@/standard/localize'
import { relativeTime } from '@/lib/relativeTime'
import * as assessmentsRepo from '@/db/repositories/assessments'
import * as sitesRepo from '@/db/repositories/sites'
import type { AssessmentRecord, SiteRecord } from '@/db/schema'
import type { Question } from '@/standard/schema/types'

interface PendingChange {
  question: Question
  value: string
  count: number
}

export function WorkspacePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()

  const openAssessment = useAssessmentStore((s) => s.openAssessment)
  const activeAssessmentId = useAssessmentStore((s) => s.activeAssessmentId)
  const currentCode = useAssessmentStore((s) => s.currentCode)
  const setCurrentCode = useAssessmentStore((s) => s.setCurrentCode)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const lastSavedAt = useAssessmentStore((s) => s.lastSavedAt)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const previewResetCount = useAssessmentStore((s) => s.previewResetCount)

  const [assessment, setAssessment] = useState<AssessmentRecord | undefined>(undefined)
  const [site, setSite] = useState<SiteRecord | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [flashCode, setFlashCode] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingChange | null>(null)

  const ledgerRef = useRef<HTMLDivElement>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const needScrollRef = useRef(false)

  useEffect(() => {
    if (assessmentId && activeAssessmentId !== assessmentId) void openAssessment(assessmentId)
  }, [assessmentId, activeAssessmentId, openAssessment])

  useEffect(() => {
    if (!assessmentId) return
    void assessmentsRepo.getAssessment(assessmentId).then(setAssessment)
  }, [assessmentId])

  useEffect(() => {
    if (!assessment) return
    void sitesRepo.getSite(assessment.farmSiteId).then(setSite)
  }, [assessment])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => () => clearTimeout(advanceTimerRef.current), [])
  useEffect(() => () => clearTimeout(flashTimerRef.current), [])

  const flat = useMemo(() => flatVisibleQuestions(visibility), [visibility])
  const engineAnswers = useMemo(() => toEngineAnswers(answers), [answers])

  const currentIndex = flat.findIndex((x) => x.question.code === currentCode)
  const currentEntry: FlatQuestionEntry | undefined = flat[currentIndex]

  const siteLabel = site ? `${site.farmName} · ${site.referenceCode}` : ''

  function scrollToActive() {
    requestAnimationFrame(() => {
      const box = ledgerRef.current
      const row = box?.querySelector<HTMLElement>(`[data-row="${currentCode}"]`)
      if (box && row) box.scrollTo({ top: Math.max(0, row.offsetTop - box.clientHeight * 0.55), behavior: 'smooth' })
    })
  }

  useEffect(() => {
    if (needScrollRef.current) {
      needScrollRef.current = false
      scrollToActive()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only scroll on explicit navigation, not on every answers/flat change
  }, [currentCode])

  // Initial scroll once the assessment (and its flat list) is ready.
  useEffect(() => {
    if (currentCode && flat.length > 0) scrollToActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once the ledger has content, not on every recompute
  }, [assessmentId, flat.length > 0])

  function goTo(code: string) {
    setCurrentCode(code)
    needScrollRef.current = true
  }

  function advance(dir: 1 | -1) {
    const i = currentIndex === -1 ? 0 : currentIndex
    const j = Math.min(Math.max(i + dir, 0), flat.length - 1)
    const next = flat[j]
    if (next) goTo(next.question.code)
  }

  function triggerFlash(code: string) {
    setFlashCode(code)
    clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashCode((c) => (c === code ? null : c)), 800)
  }

  function commitGeneric(question: Question, value: string | string[] | number) {
    setAnswer(question.code, value)
    triggerFlash(question.code)
  }

  function commitAndMaybeAdvance(question: Question, value: string) {
    setAnswer(question.code, value)
    triggerFlash(question.code)
    if (value === '') return // toggled off — stay put

    let fires = false
    if (question.notification) {
      const after = { ...engineAnswers, [question.id]: value }
      fires = evaluateBoolExpr(question.notification.expression, {
        principalId: question.id,
        answers: after,
        resolveCode,
      })
    }
    if (fires) return
    clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => advance(1), 420)
  }

  function pickSingle(question: Question, nextValue: string) {
    const cur = answers[question.code]
    const toggledOff = cur === nextValue
    if (!toggledOff && cur !== undefined) {
      const n = previewResetCount(question.code, nextValue)
      if (n > 0) {
        setPending({ question, value: nextValue, count: n })
        return
      }
    }
    commitAndMaybeAdvance(question, toggledOff ? '' : nextValue)
  }

  function pickMulti(question: Question, nextValues: string[]) {
    commitGeneric(question, nextValues)
  }

  function jumpToSection(sectionId: number) {
    const first = flat.find((x) => x.sectionId === sectionId)
    if (first) goTo(first.question.code)
  }

  // Keyboard: 1–9 pick options, Enter advances — ignored while typing in an
  // input/textarea (each control's own onEnter handles Enter there), while
  // the reset dialog is open.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (pending) return
      if (!currentEntry) return
      if (e.key === 'Enter') {
        advance(1)
        return
      }
      const n = Number.parseInt(e.key, 10)
      if (Number.isNaN(n) || n < 1) return
      const q = currentEntry.question
      const ordered = sortOptionsForDisplay(q.options)
      if (n > ordered.length) return
      if (q.controlType === 'SINGLE_SELECT' || q.controlType === 'SINGLE_SELECT_MODAL') {
        pickSingle(q, ordered[n - 1].value)
      } else if (q.controlType === 'MULTI_SELECT' || q.controlType === 'MULTI_SELECT_MODAL') {
        const cur = answers[q.code]
        const arr = Array.isArray(cur) ? cur : []
        const v = ordered[n - 1].value
        pickMulti(q, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handler closes over current state deliberately re-bound each render
  })

  if (!assessmentId || activeAssessmentId !== assessmentId) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading assessment…</div>
  }

  const savedText = lastSavedAt ? `Draft saved ${relativeTime(lastSavedAt, now)}` : 'Draft saved just now'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AssessmentChrome
        mode="assess"
        assessmentId={assessmentId}
        farmName={site?.farmName ?? 'Assessment'}
        siteReference={site?.referenceCode ?? ''}
        assessorType={assessment?.assessorType ?? ''}
        onBack={() => navigate('/assessments')}
        onToggleReview={() => navigate(`/assessments/${assessmentId}/review`)}
        onPickSection={jumpToSection}
      />

      <AnswerLedger
        ref={ledgerRef}
        flat={flat}
        answers={answers}
        currentCode={currentCode}
        flashCode={flashCode}
        siteLabel={siteLabel}
        onPick={goTo}
      />

      {currentEntry && (
        <AnswerDock
          question={currentEntry.question}
          positionLabel={`${STANDARD.sections.find((s) => s.id === currentEntry.sectionId)?.name ?? ''} · ${
            flat.filter((x) => x.sectionId === currentEntry.sectionId).findIndex((x) => x.question.code === currentCode) + 1
          } of ${flat.filter((x) => x.sectionId === currentEntry.sectionId).length}`}
          value={answers[currentEntry.question.code]}
          engineAnswers={engineAnswers}
          assessmentId={assessmentId}
          farmSiteId={assessment?.farmSiteId ?? ''}
          onPickSingle={(v) => pickSingle(currentEntry.question, v)}
          onPickMulti={(v) => pickMulti(currentEntry.question, v)}
          onCommit={(v) => commitGeneric(currentEntry.question, v)}
          onEnter={() => advance(1)}
          canGoPrev={currentIndex > 0}
          answered={isAnswered(currentEntry.question, answers)}
          onPrev={() => advance(-1)}
          onNext={() => advance(1)}
        />
      )}

      <div
        style={{
          flex: 'none',
          height: 42,
          background: '#fff',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          position: 'relative',
          zIndex: 4,
        }}
      >
        <Icon name="save" size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{savedText}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          Type <strong style={{ color: 'var(--text-body)' }}>1–9</strong> to answer ·{' '}
          <strong style={{ color: 'var(--text-body)' }}>Enter</strong> next
        </span>
      </div>

      {pending && (
        <ConfirmResetDialog
          questionText={localize(pending.question.text)}
          count={pending.count}
          onConfirm={() => {
            commitAndMaybeAdvance(pending.question, pending.value)
            setPending(null)
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
