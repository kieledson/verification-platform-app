import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/design-system/components'

const WIDTH = 340
const HEIGHT = 76

/** A real canvas-based signature pad (chosen over a "tap to sign" placeholder
 * — pointer-event drawing is small enough to implement properly and gives
 * an actually-testable interaction). The stroke is persisted as a PNG data
 * URL string in the answer, which the effectively-answered check treats
 * like any other non-empty string answer. */
export function SignatureControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (next: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasStroke, setHasStroke] = useState(!!value)

  // Restore a previously-saved signature image once on mount.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !value) return
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = value
    // Intentionally mount-only: re-running on every `value` change would
    // fight the user's own in-progress strokes as onChange fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getPos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.strokeStyle = '#012C4C'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function handlePointerUp() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    setHasStroke(true)
    onChange(canvas.toDataURL('image/png'))
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onChange('')
  }

  return (
    <div style={{ width: WIDTH }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: WIDTH,
          height: HEIGHT,
          borderRadius: 8,
          border: '1.5px dashed var(--border-strong)',
          background: '#fff',
          touchAction: 'none',
          cursor: 'crosshair',
          display: 'block',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hasStroke ? 'Signed' : 'Sign above'}</span>
        <button
          type="button"
          onClick={handleClear}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 0,
          }}
        >
          <Icon name="eraser" size={12} /> Clear
        </button>
      </div>
    </div>
  )
}
