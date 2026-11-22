import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { FieldVariant } from './fieldGeometry'
import './field.css'

const FieldCanvas = lazy(() => import('./FieldCanvas'))
const figures = ['mobius-surface', 'mobius-contours', 'mobius-structure'] as const

class RenderBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

type FieldProps = {
  progress: RefObject<number>
  paused: boolean
  reducedMotion: boolean
  variant: FieldVariant
  onLiveChange?: (live: boolean) => void
}

export default function FieldScene({ progress, paused, reducedMotion, variant, onLiveChange }: FieldProps) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [seen, setSeen] = useState(false)
  const [foreground, setForeground] = useState(!document.hidden)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onLoss = useCallback(() => setFailed(true), [])
  const live = !reducedMotion && !failed && Boolean(window.WebGL2RenderingContext)
  const rendered = live && ready

  useEffect(() => {
    if (!live) setReady(false)
    onLiveChange?.(rendered)
  }, [live, rendered, onLiveChange])

  useEffect(() => {
    const root = host.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
      if (entry.isIntersecting) setSeen(true)
    })
    observer.observe(root)
    const change = () => setForeground(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', change)
    }
  }, [])

  return (
    <div ref={host} className={`field-scene${rendered ? ' has-canvas' : ''}`} aria-hidden="true">
      <img
        className="field-poster"
        src={`./field/${figures[variant]}.webp`}
        alt=""
        width={960}
        height={960}
        decoding="async"
        draggable={false}
      />
      {live && seen && (
        <div className="field-webgl">
          <RenderBoundary onFailure={onLoss}>
            <Suspense fallback={null}>
              <FieldCanvas progress={progress} variant={variant} paused={paused} active={visible && foreground} onReady={onReady} onLoss={onLoss} />
            </Suspense>
          </RenderBoundary>
        </div>
      )}
    </div>
  )
}
