import { forwardRef, Fragment } from 'react'
import { Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { localize } from '@/standard/localize'
import type { AnswerMap } from '@/db/repositories/answers'
import type { Question } from '@/standard/schema/types'
import { dependencyDepth, isAnswered, perSectionCounts, type FlatQuestionEntry } from '@/features/workspace/flatQuestions'
import { inferUnit } from '@/standard/inferUnit'

function answerSummary(question: Question, answers: AnswerMap, siteLabel: string): string | null {
  const value = answers[question.code]
  if (value === undefined || value === null) return null

  if (question.controlType === 'SITE_DETAILS') return siteLabel

  if (question.controlType === 'IMAGE') {
    const n = Array.isArray(value) ? value.length : 0
    return n === 0 ? null : `${n} photo${n === 1 ? '' : 's'}`
  }

  if (question.controlType === 'MULTI_SELECT' || question.controlType === 'MULTI_SELECT_MODAL') {
    if (!Array.isArray(value) || value.length === 0) return null
    return question.options
      .filter((o) => value.includes(o.value))
      .map((o) => localize(o.label))
      .join(' · ')
  }

  if (question.controlType === 'SINGLE_SELECT' || question.controlType === 'SINGLE_SELECT_MODAL') {
    const opt = question.options.find((o) => o.value === value)
    return opt ? localize(opt.label) : String(value)
  }

  if (question.controlType === 'NUMBER') {
    const unit = inferUnit(localize(question.text))
    return String(value) + (unit ? ` ${unit}` : '')
  }

  if (question.controlType === 'SIGNATURE') {
    return typeof value === 'string' && value.trim().length > 0 ? 'Signed' : null
  }

  if (Array.isArray(value)) return value.length > 0 ? `${value.length}` : null
  const str = String(value).trim()
  return str === '' ? null : str
}

export const AnswerLedger = forwardRef<
  HTMLDivElement,
  {
    flat: FlatQuestionEntry[]
    answers: AnswerMap
    currentCode: string | null
    flashCode: string | null
    siteLabel: string
    onPick: (code: string) => void
  }
>(function AnswerLedger({ flat, answers, currentCode, flashCode, siteLabel, onPick }, scrollRef) {
  const counts = perSectionCounts(flat, answers)
  let lastSectionId: number | null = null

  return (
    <div ref={scrollRef} data-scroll="ledger" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ maxWidth: 850, margin: '0 auto', padding: '18px 24px 26px', display: 'flex', flexDirection: 'column' }}>
        {flat.map(({ question, sectionId }) => {
          const rows = []
          if (sectionId !== lastSectionId) {
            lastSectionId = sectionId
            const section = STANDARD.sections.find((s) => s.id === sectionId)
            const c = counts.get(sectionId) ?? { done: 0, total: 0 }
            rows.push(
              <div
                key={`lm-${sectionId}`}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 0 10px' }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ocean)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Section {STANDARD.sections.findIndex((s) => s.id === sectionId) + 1} of {STANDARD.sections.length} —{' '}
                  {section?.name}
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--pearl-100)' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {c.done} of {c.total} answered
                </span>
              </div>,
            )
          }

          const active = question.code === currentCode
          const answered = isAnswered(question, answers)
          const summary = answerSummary(question, answers, siteLabel)
          const depth = dependencyDepth(question.id)
          const indent = depth * 22
          const flashing = flashCode === question.code

          rows.push(
            <div key={question.code} data-row={question.code}>
              <button
                type="button"
                onClick={() => onPick(question.code)}
                style={{
                  width: `calc(100% - ${indent}px)`,
                  marginLeft: indent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: 'none',
                  padding: '8px 12px 8px 7px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 8,
                  transition: 'background 130ms ease',
                  background: active ? 'var(--color-primary-subtle)' : flashing ? 'var(--rating-best-soft)' : 'transparent',
                  borderLeft: active ? '3px solid var(--ocean)' : '3px solid transparent',
                  paddingLeft: 7,
                }}
              >
                {depth > 0 && <Icon name="corner-down-right" size={12} style={{ color: 'var(--gray-400)', flex: 'none' }} />}
                <span
                  aria-hidden="true"
                  style={{
                    flex: 'none',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    marginTop: 1,
                    background: answered ? 'var(--success)' : active ? 'var(--ocean)' : 'transparent',
                    border: answered || active ? 'none' : '1.5px solid var(--border-strong)',
                    boxShadow: active && !answered ? '0 0 0 3px var(--color-primary-subtle)' : 'none',
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: active ? 'var(--ocean-deep)' : answered ? 'var(--text-muted)' : 'var(--text-body)',
                  }}
                >
                  {localize(question.text)}
                </span>
                <span
                  style={{
                    flex: 'none',
                    maxWidth: answered ? '44%' : undefined,
                    textAlign: 'right',
                    fontSize: answered ? 12.5 : active ? 11.5 : 12,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: answered ? 'var(--text-strong)' : active ? 'var(--ocean)' : 'var(--gray-400)',
                  }}
                >
                  {summary ?? (active ? 'Answering…' : '—')}
                </span>
              </button>
            </div>,
          )

          return <Fragment key={question.code}>{rows}</Fragment>
        })}
      </div>
    </div>
  )
})
