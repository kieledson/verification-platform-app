import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/design-system/components'
import { useUiStore } from '@/state/uiStore'
import { finaliseAssessment } from '@/sync/syncEngine'

export function FinaliseCard({ assessmentId, allAnswered }: { assessmentId: string; allAnswered: boolean }) {
  const navigate = useNavigate()
  const offline = useUiStore((s) => s.connectionMode === 'offline')
  const [finalising, setFinalising] = useState(false)

  async function handleFinalise() {
    setFinalising(true)
    await finaliseAssessment(assessmentId)
    navigate('/assessments')
  }

  const copy =
    allAnswered && offline
      ? 'Finalising locks the assessment on this tablet. It uploads by itself the next time you have wifi.'
      : allAnswered
        ? 'Finalising locks the assessment and starts uploading now.'
        : 'You can still finalise, but the assessment will be flagged as incomplete when it reaches the programme team.'

  return (
    <div
      style={{
        background: 'var(--ocean-deep, #012C4C)',
        color: '#fff',
        borderRadius: 12,
        padding: 18,
        marginTop: 16,
      }}
    >
      <p style={{ fontSize: 13, lineHeight: 1.4, margin: '0 0 16px', opacity: 0.9 }}>{copy}</p>
      <Button
        variant="secondary"
        block
        onClick={() => void handleFinalise()}
        disabled={finalising}
        style={{ background: 'var(--ocean-light, #5FB3EF)', color: 'var(--ocean-deep, #012C4C)', border: 'none' }}
      >
        {finalising ? 'Finalising…' : 'Finalise assessment'}
      </Button>
    </div>
  )
}
