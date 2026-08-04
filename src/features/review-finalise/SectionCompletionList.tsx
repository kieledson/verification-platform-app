import { useNavigate } from 'react-router-dom'
import { Card, Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { localize } from '@/standard/localize'
import { useAssessmentStore } from '@/state/assessmentStore'

function sectionCounts(sectionId: number, answers: Record<string, unknown>, visibility: Record<string, boolean>) {
  const section = STANDARD.sections.find((s) => s.id === sectionId)!
  const questions = STANDARD.questions.filter((q) => section.questionIds.includes(q.id) && q.isMandatory)
  const visible = questions.filter((q) => visibility[q.code])
  const answered = visible.filter((q) => {
    const value = answers[q.code]
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  })
  return { total: visible.length, done: answered.length }
}

export function SectionCompletionList({ assessmentId }: { assessmentId: string }) {
  const navigate = useNavigate()
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)

  return (
    <Card padding="none">
      {STANDARD.sections.map((section, i) => {
        const { total, done } = sectionCounts(section.id, answers, visibility)
        const complete = total > 0 && done === total

        return (
          <div
            key={section.id}
            onClick={() => navigate(`/assessments/${assessmentId}/section/${section.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '13px 18px',
              borderBottom: i < STANDARD.sections.length - 1 ? '1px solid var(--gray-100)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                background: complete ? 'var(--success)' : 'var(--gray-100)',
                color: complete ? '#fff' : 'var(--text-body)',
              }}
            >
              {complete ? <Icon name="check" size={14} /> : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{section.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {done} of {total} answered
              </div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: complete ? 'var(--success)' : 'var(--seastar)',
              }}
            >
              {complete ? 'Complete' : `${total - done} still to answer`}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

export function overallCompleteness(answers: Record<string, unknown>, visibility: Record<string, boolean>) {
  let total = 0
  let done = 0
  for (const section of STANDARD.sections) {
    const c = sectionCounts(section.id, answers, visibility)
    total += c.total
    done += c.done
  }
  return { total, done, complete: total > 0 && done === total }
}

export function signatureQuestions() {
  return STANDARD.questions.filter((q) => q.controlType === 'SIGNATURE').map((q) => ({ ...q, label: localize(q.text) }))
}
