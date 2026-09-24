import { useRef, useState } from 'react'
import { images } from '../data/content'

export default function BeforeAfter() {
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const frame = useRef(null)

  const updateFromEvent = (clientX) => {
    const el = frame.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, next)))
  }

  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    updateFromEvent(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    updateFromEvent(e.clientX)
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  return (
    <div
      ref={frame}
      className="relative aspect-[4/3] w-full cursor-ew-resize touch-none overflow-hidden rounded-2xl border border-outline/30 bg-surface-high select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      role="slider"
      aria-label="Before and after tank cleaning comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
        if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
      }}
    >
      <img
        src={images.after}
        alt="After: professionally cleaned polytank interior with clear, hygienic walls"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={images.before}
          alt="Before: dirty polytank interior with visible sediment and buildup"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
      <div className="absolute inset-y-0 z-10 w-1 bg-white shadow-md" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg">
          <span className="text-lg font-bold" aria-hidden="true">
            ⟷
          </span>
        </span>
      </div>
      <span className="absolute top-4 left-4 rounded-full bg-primary/80 px-3 py-1 text-xs font-semibold text-white">
        Before
      </span>
      <span className="absolute top-4 right-4 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-white">
        After
      </span>
    </div>
  )
}
