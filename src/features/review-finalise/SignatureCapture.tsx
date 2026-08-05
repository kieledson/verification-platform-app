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
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 1px 2px rgba(1,44,76,0.05)',
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ocean)' }}>
        Signatures
      </span>
      {questions.map((q) => {
        const value = answers[q.code]
        const signatureValue = typeof value === 'string' ? value : undefined

        return (
          <div key={q.code} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{q.label}</span>
            <SignatureControl value={signatureValue} onChange={(next) => setAnswer(q.code, next)} />
          </div>
        )
      })}
    </div>
  )
}
