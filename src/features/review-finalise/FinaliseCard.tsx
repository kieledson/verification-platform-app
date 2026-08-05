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
        background: 'var(--ocean-deep)',
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ocean-light)' }}>
        Finalise
      </span>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{copy}</p>
      <Button
        variant="secondary"
        block
        onClick={() => void handleFinalise()}
        disabled={finalising}
        style={{ height: 42, borderRadius: 999, background: 'var(--ocean-light)', color: 'var(--ocean-deep)', border: 'none', fontSize: 13.5, fontWeight: 800 }}
      >
        {finalising ? 'Finalising…' : 'Finalise assessment'}
      </Button>
    </div>
  )
}
