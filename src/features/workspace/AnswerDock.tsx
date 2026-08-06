import { type ReactNode } from 'react'
import { Icon } from '@/design-system/components'
import { localize } from '@/standard/localize'
import type { Answers } from '@/dependency-engine/expression/evaluate'
import { evaluateBoolExpr } from '@/dependency-engine/expression/evaluate'
import { resolveCode } from '@/standard/answerMapping'
import type { Question } from '@/standard/schema/types'
import { useUiStore } from '@/state/uiStore'
import { SingleSelectControl } from '@/features/workspace/controls/SingleSelectControl'
import { MultiSelectControl } from '@/features/workspace/controls/MultiSelectControl'
import { TextControl } from '@/features/workspace/controls/TextControl'
import { NumberControl } from '@/features/workspace/controls/NumberControl'
import { NarrativeControl } from '@/features/workspace/controls/NarrativeControl'
import { ImageControl } from '@/features/workspace/controls/ImageControl'
import { SignatureControl } from '@/features/workspace/controls/SignatureControl'
import { DateTimeControl } from '@/features/workspace/controls/DateTimeControl'
import { SiteDetailsPanel } from '@/features/workspace/SiteMap'

/** Renders `**Term** — definition` guidance text with the term bolded — the
 * real schema stores guidance as one flowing string, not the handoff's
 * illustrative separate intro/defs fields, so this keeps the single-string
 * parsing already proven against the real data. */
function renderGuidance(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))
}

export function AnswerDock({
  question,
  positionLabel,
  value,
  engineAnswers,
  assessmentId,
  farmSiteId,
  onPickSingle,
  onPickMulti,
  onCommit,
  onEnter,
  canGoPrev,
  answered,
  onPrev,
  onNext,
}: {
  question: Question
  positionLabel: string
  value: string | string[] | number | undefined
  engineAnswers: Answers
  assessmentId: string
  farmSiteId: string
  onPickSingle: (value: string) => void
  onPickMulti: (values: string[]) => void
  onCommit: (value: string | string[] | number) => void
  onEnter: () => void
  canGoPrev: boolean
  answered: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const openGuidance = useUiStore((s) => s.openGuidance[question.code] ?? false)
  const toggleGuidance = useUiStore((s) => s.toggleGuidance)

  let alertText: string | null = null
  if (question.notification) {
    const fires = evaluateBoolExpr(question.notification.expression, {
      principalId: question.id,
      answers: engineAnswers,
      resolveCode,
    })
    if (fires) alertText = localize(question.notification.text)
  }

  const hasGuide = !!question.tooltip

  return (
    <div
      style={{
        flex: 'none',
        background: '#fff',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 24px rgba(1,44,76,0.08)',
        padding: '14px 0 10px',
        position: 'relative',
        zIndex: 4,
      }}
    >
      <div style={{ maxWidth: 850, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ocean)' }}>
                {positionLabel}
              </span>
              {!question.isMandatory && (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Optional
                </span>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1.28, color: 'var(--text-strong)', margin: 0 }}>
              {localize(question.text)}
            </p>
            {hasGuide && (
              <>
                <button
                  type="button"
                  onClick={() => toggleGuidance(question.code)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--ocean)',
                  }}
                >
                  <Icon name="book-open" size={13} />
                  <span>Guidance</span>
                  <Icon name={openGuidance ? 'chevron-up' : 'chevron-down'} size={12} />
                </button>
                {openGuidance && (
                  <div
                    style={{
                      borderLeft: '2px solid var(--ocean)',
                      padding: '2px 0 2px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 9,
                      maxHeight: 150,
                      overflowY: 'auto',
                    }}
                  >
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-muted)', margin: 0 }}>
                      {renderGuidance(localize(question.tooltip!))}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ flex: 'none', maxWidth: 470, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {question.controlType === 'SINGLE_SELECT' || question.controlType === 'SINGLE_SELECT_MODAL' ? (
              <SingleSelectControl
                options={question.options}
                value={typeof value === 'string' ? value : undefined}
                onChange={onPickSingle}
              />
            ) : question.controlType === 'MULTI_SELECT' || question.controlType === 'MULTI_SELECT_MODAL' ? (
              <MultiSelectControl
                options={question.options}
                value={Array.isArray(value) ? value : undefined}
                onChange={onPickMulti}
              />
            ) : question.controlType === 'TEXT' ? (
              <TextControl value={typeof value === 'string' ? value : undefined} onChange={onCommit} onEnter={onEnter} />
            ) : question.controlType === 'NUMBER' ? (
              <NumberControl
                value={typeof value === 'number' || typeof value === 'string' ? value : undefined}
                onChange={onCommit}
                onEnter={onEnter}
                questionText={localize(question.text)}
              />
            ) : question.controlType === 'TEXT_MULTILINE' ? (
              <NarrativeControl value={typeof value === 'string' ? value : undefined} onChange={onCommit} />
            ) : question.controlType === 'IMAGE' ? (
              <ImageControl
                assessmentId={assessmentId}
                questionCode={question.code}
                value={Array.isArray(value) ? value : undefined}
                onChange={onCommit}
              />
            ) : question.controlType === 'SIGNATURE' ? (
              <SignatureControl value={typeof value === 'string' ? value : undefined} onChange={onCommit} />
            ) : question.controlType === 'DATE_TIME' ? (
              <DateTimeControl value={typeof value === 'string' ? value : undefined} onChange={onCommit} />
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                onClick={onPrev}
                title="Previous question"
                disabled={!canGoPrev}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: 6,
                  color: 'var(--text-muted)',
                  cursor: canGoPrev ? 'pointer' : 'default',
                  opacity: canGoPrev ? 1 : 0.35,
                  pointerEvents: canGoPrev ? 'auto' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <Icon name="chevron-left" size={14} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={onNext}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: 6,
                  color: answered ? 'var(--ocean)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <span>{answered ? 'Next' : 'Skip'}</span>
                <Icon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </div>

        {question.controlType === 'SITE_DETAILS' && (
          <SiteDetailsPanel farmSiteId={farmSiteId} />
        )}

        {alertText && (
          <div style={{ display: 'flex', gap: 9, background: 'var(--highlight)', border: '1px solid #E8CF7A', borderRadius: 10, padding: '9px 12px' }}>
            <Icon name="alert-triangle" size={15} style={{ color: 'var(--sand)', flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--sand-deep)' }}>{alertText}</span>
          </div>
        )}
      </div>
    </div>
  )
}
