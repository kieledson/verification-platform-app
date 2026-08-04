import { useState } from 'react'
import { Card } from '@/design-system/components'
import { useAssessmentStore } from '@/state/assessmentStore'
import { signatureQuestions } from '@/features/review-finalise/SectionCompletionList'

/** Lightweight tap-to-sign: stores the signer's typed name as the answer.
 * A full canvas signature pad is a reasonable future upgrade; this keeps the
 * two SIGNATURE questions (primary assessor, farm representative) real and
 * persisted rather than a purely decorative placeholder. */
export function SignatureCapture() {
  const answers = useAssessmentStore((s) => s.answers)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const questions = signatureQuestions()

  function startSigning(code: string) {
    setEditingCode(code)
    setDraftName(typeof answers[code] === 'string' ? (answers[code] as string) : '')
  }

  function commit() {
    if (editingCode && draftName.trim()) setAnswer(editingCode, draftName.trim())
    setEditingCode(null)
  }

  return (
    <Card padding="md">
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        Signatures
      </div>
      {questions.map((q) => {
        const signed = typeof answers[q.code] === 'string' && (answers[q.code] as string).length > 0
        return (
          <div key={q.code} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>{q.label}</div>
            {editingCode === q.code ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                  placeholder="Type full name to sign"
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    padding: '0 10px',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                  }}
                />
                <button
                  onClick={commit}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    background: 'var(--ocean)',
                    color: '#fff',
                    padding: '0 14px',
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div
                onClick={() => startSigning(q.code)}
                style={{
                  height: 76,
                  border: signed ? '1px solid var(--border)' : '2px dashed var(--border-strong)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontFamily: signed ? 'var(--font-display)' : undefined,
                  fontStyle: signed ? 'italic' : undefined,
                  fontSize: signed ? 18 : 13,
                  color: signed ? 'var(--text-strong)' : 'var(--text-muted)',
                }}
              >
                {signed ? (answers[q.code] as string) : 'Tap to sign'}
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}
