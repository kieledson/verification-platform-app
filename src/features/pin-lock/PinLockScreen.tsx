import { useState } from 'react'
import { Button, Input, Card, Icon } from '@/design-system/components'
import { usePinLockStore } from '@/state/pinLockStore'

/**
 * Device-level gate, independent of any web-session concept. Production
 * string preserved verbatim from the source system.
 */
export function PinLockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const { error, attemptUnlock } = usePinLockStore()
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const ok = await attemptUnlock(pin)
    setSubmitting(false)
    if (ok) onUnlocked()
    else setPin('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-warm, #FBFAE8)',
        zIndex: 1000,
      }}
    >
      <Card elevation="md" padding="lg" style={{ width: 360, textAlign: 'center' }}>
        <Icon name="lock" size={28} style={{ color: 'var(--ocean)', marginBottom: 12 }} />
        <h2 style={{ font: 'var(--font-display)', margin: '0 0 8px' }}>Device locked</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.4, marginBottom: 20 }}>
          The system has locked out due to a period of inactivity. To unlock and continue, please
          enter the last 4 characters of your password.
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            error={error ?? undefined}
            autoFocus
          />
          <Button type="submit" variant="primary" block disabled={submitting || pin.length === 0}>
            Unlock
          </Button>
        </form>
      </Card>
    </div>
  )
}
