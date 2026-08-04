import { Card } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { signatureQuestions } from '@/features/review-finalise/SectionCompletionList'
import { SignatureControl } from '@/features/workspace/controls/SignatureControl'

/** Signing happens right here — the same real canvas pad used on the
 * question row in the workspace (`workspace/controls/SignatureControl.tsx`),
 * reused directly rather than replaced with a read-only preview that sends
 * the assessor away to sign elsewhere. Both places write the same PNG
 * data-URL answer, so there's exactly one signing mechanism, just available
 * wherever it's needed — including the last step before finalising. */
export function SignatureCapture() {
  const answers = useAssessmentStore((s) => s.answers)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const questions = signatureQuestions()

  return (
    <Card padding="md">
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        Signatures
      </div>
      {questions.map((q) => {
        const value = answers[q.code]
        const signatureValue = typeof value === 'string' ? value : undefined

        return (
          <div key={q.code} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>{q.label}</div>
            <SignatureControl value={signatureValue} onChange={(next) => setAnswer(q.code, next)} />
          </div>
        )
      })}
    </Card>
  )
}
