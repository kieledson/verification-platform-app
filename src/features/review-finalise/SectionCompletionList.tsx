import { useNavigate } from 'react-router-dom'
import { Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { localize } from '@/standard/localize'
import { useAssessmentStore } from '@/state/assessmentStore'
import { flatVisibleQuestions, perSectionCounts } from '@/features/workspace/flatQuestions'
import type { AnswerMap } from '@/db/repositories/answers'

export function SectionCompletionList({ assessmentId }: { assessmentId: string }) {
  const navigate = useNavigate()
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const setCurrentCode = useAssessmentStore((s) => s.setCurrentCode)

  const flat = flatVisibleQuestions(visibility)
  const counts = perSectionCounts(flat, answers)

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '6px 18px', boxShadow: '0 1px 2px rgba(1,44,76,0.05)' }}>
      {STANDARD.sections.map((section, i) => {
        const c = counts.get(section.id) ?? { done: 0, total: 0 }
        const complete = c.total > 0 && c.done === c.total

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              const first = flat.find((x) => x.sectionId === section.id)
              if (first) setCurrentCode(first.question.code)
              navigate(`/assessments/${assessmentId}`)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'none',
              border: 'none',
              borderBottom: i < STANDARD.sections.length - 1 ? '1px solid var(--gray-100)' : 'none',
              padding: '10px 2px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 130ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span
              style={{
                flex: 'none',
                width: 26,
                height: 26,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                background: complete ? 'var(--success)' : 'var(--gray-100)',
                color: complete ? '#fff' : 'var(--text-muted)',
              }}
            >
              {complete ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{section.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {c.done} of {c.total} answered
              </span>
            </span>
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, color: complete ? 'var(--success)' : 'var(--seastar)' }}>
              {complete ? 'Complete' : `${c.total - c.done} still to answer`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function overallCompleteness(answers: AnswerMap, visibility: Record<string, boolean>) {
  const flat = flatVisibleQuestions(visibility)
  const counts = perSectionCounts(flat, answers)
  let total = 0
  let done = 0
  for (const c of counts.values()) {
    total += c.total
    done += c.done
  }
  return { total, done, complete: total > 0 && done === total }
}

export function signatureQuestions() {
  return STANDARD.questions.filter((q) => q.controlType === 'SIGNATURE').map((q) => ({ ...q, label: localize(q.text) }))
}
