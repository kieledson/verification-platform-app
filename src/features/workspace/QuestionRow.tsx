import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { Answers } from '@/dependency-engine/expression/evaluate'
import { evaluateBoolExpr } from '@/dependency-engine/expression/evaluate'
import { resolveCode } from '@/standard/answerMapping'
import type { Question } from '@/standard/schema/types'
import { isQuestionEffectivelyAnswered, useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import { getDependentQuestions } from '@/features/workspace/reverseIndex'
import { ConfirmResetDialog } from '@/features/workspace/ConfirmResetDialog'
import { AlertBanner } from '@/features/workspace/AlertBanner'
import { SiteDetailsTrigger, SiteMap } from '@/features/workspace/SiteMap'
import { SingleSelectControl } from '@/features/workspace/controls/SingleSelectControl'
import { MultiSelectControl } from '@/features/workspace/controls/MultiSelectControl'
import { TextControl } from '@/features/workspace/controls/TextControl'
import { NumberControl } from '@/features/workspace/controls/NumberControl'
import { NarrativeControl } from '@/features/workspace/controls/NarrativeControl'
import { ImageControl } from '@/features/workspace/controls/ImageControl'
import { SignatureControl } from '@/features/workspace/controls/SignatureControl'
import { DateTimeControl } from '@/features/workspace/controls/DateTimeControl'

/** Renders `**Term** — definition` guidance text with the term bolded, per
 * the README's guidance-text convention. Plain text with no `**...**` runs
 * straight through unchanged. */
function renderGuidance(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))
}

export function QuestionRow({
  question,
  assessmentId,
  farmSiteId,
  engineAnswers,
}: {
  question: Question
  assessmentId: string
  farmSiteId: string
  engineAnswers: Answers
}) {
  const value = useAssessmentStore((s) => s.answers[question.code])
  const visibility = useAssessmentStore((s) => s.visibility)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const openGuidance = useUiStore((s) => s.openGuidance[question.code] ?? false)
  const toggleGuidance = useUiStore((s) => s.toggleGuidance)
  const [siteMapExpanded, setSiteMapExpanded] = useState(false)
  const [pendingChange, setPendingChange] = useState<string | string[] | null>(null)
  const guidanceRef = useRef<HTMLDivElement>(null)

  const answered = isQuestionEffectivelyAnswered(question.code)

  // Closes the guidance popover on an outside click/tap — a floating
  // popover (unlike the old push-down block) needs an explicit dismiss
  // path since it no longer occupies layout space the user would notice.
  useEffect(() => {
    if (!openGuidance) return
    function handlePointerDown(e: PointerEvent) {
      if (guidanceRef.current && !guidanceRef.current.contains(e.target as Node)) {
        toggleGuidance(question.code)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openGuidance, question.code, toggleGuidance])

  function commitAnswer(next: string | string[] | number) {
    setAnswer(question.code, next)
  }

  /** Discrete-choice controls (single/multi-select only — see
   * `ConfirmResetDialog.tsx`) route through here so a change that would
   * silently reset currently-visible, currently-answered dependents shows
   * the production confirm dialog first. Free-text/number controls call
   * `commitAnswer` directly and never hit this path — a debounced text
   * field firing a blocking confirm on every keystroke would be unusable. */
  function requestAnswerChange(next: string | string[]) {
    const dependents = getDependentQuestions(question.id)
    const hasLiveDependents = dependents.some(
      (d) => visibility[d.code] && isQuestionEffectivelyAnswered(d.code),
    )
    if (hasLiveDependents) {
      setPendingChange(next)
    } else {
      commitAnswer(next)
    }
  }

  let alertText: string | null = null
  if (question.notification) {
    const fires = evaluateBoolExpr(question.notification.expression, {
      principalId: question.id,
      answers: engineAnswers,
      resolveCode,
    })
    if (fires) alertText = localize(question.notification.text)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '3px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '18px 1fr 340px',
          gap: 14,
          alignItems: 'center',
          minHeight: 40,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: answered ? 'none' : '2px solid var(--border-strong)',
            background: answered ? 'var(--success)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {answered && <Icon name="check" size={10} style={{ color: '#fff' }} />}
        </span>

        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 10px' }}>
          <span style={{ fontSize: 13.5, lineHeight: 1.35, color: 'var(--text-body)' }}>{localize(question.text)}</span>
          {question.tooltip && (
            <div ref={guidanceRef} style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                onClick={() => toggleGuidance(question.code)}
                aria-label="Guidance for this question"
                aria-expanded={openGuidance}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: openGuidance ? 'var(--color-primary)' : 'var(--gray-100)',
                  color: openGuidance ? '#fff' : 'var(--text-muted)',
                  transition: 'background .15s ease, color .15s ease',
                }}
              >
                <Icon name="info" size={12} />
              </button>

              {openGuidance && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 6,
                    width: 280,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    boxShadow: '0 8px 20px rgba(1,44,76,0.16)',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: 'var(--text-muted)',
                    zIndex: 20,
                  }}
                >
                  {renderGuidance(localize(question.tooltip))}
                </div>
              )}
            </div>
          )}
          {!question.isMandatory && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Optional</span>
          )}
        </div>

        <div style={{ width: 340, display: 'flex', justifyContent: 'flex-end' }}>
          {question.controlType === 'SINGLE_SELECT' || question.controlType === 'SINGLE_SELECT_MODAL' ? (
            <SingleSelectControl
              options={question.options}
              value={typeof value === 'string' ? value : undefined}
              onChange={requestAnswerChange}
            />
          ) : question.controlType === 'MULTI_SELECT' || question.controlType === 'MULTI_SELECT_MODAL' ? (
            <MultiSelectControl
              options={question.options}
              value={Array.isArray(value) ? value : undefined}
              onChange={requestAnswerChange}
            />
          ) : question.controlType === 'TEXT' ? (
            <TextControl value={typeof value === 'string' ? value : undefined} onChange={commitAnswer} />
          ) : question.controlType === 'NUMBER' ? (
            <NumberControl
              value={typeof value === 'number' || typeof value === 'string' ? value : undefined}
              onChange={commitAnswer}
              questionText={localize(question.text)}
            />
          ) : question.controlType === 'TEXT_MULTILINE' ? (
            <NarrativeControl value={typeof value === 'string' ? value : undefined} onChange={commitAnswer} />
          ) : question.controlType === 'IMAGE' ? (
            <ImageControl
              assessmentId={assessmentId}
              questionCode={question.code}
              value={Array.isArray(value) ? value : undefined}
              onChange={commitAnswer}
            />
          ) : question.controlType === 'SIGNATURE' ? (
            <SignatureControl value={typeof value === 'string' ? value : undefined} onChange={commitAnswer} />
          ) : question.controlType === 'DATE_TIME' ? (
            <DateTimeControl value={typeof value === 'string' ? value : undefined} onChange={commitAnswer} />
          ) : question.controlType === 'SITE_DETAILS' ? (
            <SiteDetailsTrigger
              farmSiteId={farmSiteId}
              expanded={siteMapExpanded}
              onToggle={() => setSiteMapExpanded((v) => !v)}
            />
          ) : null}
        </div>
      </div>

      {alertText && <AlertBanner text={alertText} />}

      {question.controlType === 'SITE_DETAILS' && siteMapExpanded && <SiteMap farmSiteId={farmSiteId} />}

      {pendingChange !== null && (
        <ConfirmResetDialog
          onConfirm={() => {
            commitAnswer(pendingChange)
            setPendingChange(null)
          }}
          onCancel={() => setPendingChange(null)}
        />
      )}
    </div>
  )
}
