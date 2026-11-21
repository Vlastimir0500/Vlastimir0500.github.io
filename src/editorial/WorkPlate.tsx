import { useEffect, useId, useRef, useState } from 'react'
import { Pause, Play, Rotate3D } from 'lucide-react'
import { plateLabels } from './plates/plateTypes'
import type { PlateKind } from './plates/plateTypes'
import type { createPlateStage } from './plates/stage'

export default function WorkPlate({ kind }: { kind: PlateKind }) {
  const viewport = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [paused, setPaused] = useState(false)
  const pauseFlag = useRef(false)
  const refresh = useRef<(() => void) | undefined>(undefined)
  const instructionId = useId()
  const name = plateLabels[kind]

  useEffect(() => {
    const host = viewport.current
    if (!host || !window.WebGL2RenderingContext) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let stage: ReturnType<typeof createPlateStage> | undefined
    let canvas: HTMLCanvasElement | undefined
    let visible = false, ended = false, loading = false, failed = false
    let frame = 0, last = 0, elapsed = 0, progress = .5
    let yaw = 0, pitch = 0, pointer: number | undefined, lastX = 0, lastY = 0
    let dirty = true, ready = false
    const size = { width: host.clientWidth, height: host.clientHeight }

    function render(now: number) {
      frame = 0
      if (!stage || !visible || document.hidden || motion.matches || ended) return
      if (dirty || !last || now - last >= 1000 / 30) {
        if (!pauseFlag.current && last) elapsed += Math.min((now - last) / 1000, .12)
        stage.draw(size.width, size.height, Math.min(devicePixelRatio || 1, 1.6), elapsed, progress, yaw, pitch)
        dirty = false
        last = now
        if (!ready) { ready = true; setLive(true) }
      }
      if (!pauseFlag.current) frame = requestAnimationFrame(render)
    }
    function invalidate() {
      dirty = true
      if (visible && stage && !document.hidden && !frame) frame = requestAnimationFrame(render)
    }
    refresh.current = () => { last = 0; invalidate() }

    function release() {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
      if (canvas) canvas.removeEventListener('webglcontextlost', contextLost)
      stage?.dispose()
      stage = undefined
      canvas?.remove()
      canvas = undefined
      ready = false
      if (!ended) setLive(false)
    }
    function contextLost() { failed = true; release() }

    async function activate() {
      if (ended || failed || !visible || document.hidden || motion.matches) return
      if (stage) { invalidate(); return }
      if (loading) return
      loading = true
      try {
        const { createPlateStage } = await import('./plates/stage')
        if (ended || !visible || document.hidden || motion.matches) return
        canvas = document.createElement('canvas')
        canvas.setAttribute('aria-hidden','true')
        host!.appendChild(canvas)
        stage = createPlateStage(canvas,kind)
        canvas.addEventListener('webglcontextlost',contextLost)
        invalidate()
      } catch {
        failed = true
        release()
      } finally { loading = false }
    }
    function syncScroll() {
      if (pauseFlag.current || !visible || motion.matches) return
      const bounds = host!.getBoundingClientRect()
      progress = Math.max(0, Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)))
      invalidate()
    }
    function visibilityChange() {
      last = 0
      if (visible && !document.hidden) { syncScroll(); void activate() }
      else { cancelAnimationFrame(frame); frame = 0 }
    }
    function preferenceChange() {
      if (motion.matches) release()
      else void activate()
    }
    function down(event: PointerEvent) {
      if (!ready || event.button !== 0 || pointer !== undefined) return
      pointer = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      host!.setPointerCapture(pointer)
      host!.dataset.dragging = 'true'
    }
    function move(event: PointerEvent) {
      if (pointer !== event.pointerId) return
      yaw -= (event.clientX - lastX) * .009
      pitch = Math.max(-.43,Math.min(.55,pitch + (event.clientY-lastY)*.005))
      lastX = event.clientX; lastY = event.clientY
      invalidate()
    }
    function up(event: PointerEvent) {
      if (pointer !== event.pointerId) return
      pointer = undefined
      delete host!.dataset.dragging
    }
    function key(event: KeyboardEvent) {
      if (!ready) return
      if (event.key === 'ArrowLeft') yaw -= .16
      else if (event.key === 'ArrowRight') yaw += .16
      else if (event.key === 'Home') { yaw = 0; pitch = 0 }
      else return
      event.preventDefault()
      invalidate()
    }
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibilityChange() })
    intersection.observe(host)
    const resize = new ResizeObserver(([entry])=>{
      size.width = Math.round(entry.contentRect.width)
      size.height = Math.round(entry.contentRect.height)
      invalidate()
    })
    resize.observe(host)
    motion.addEventListener('change',preferenceChange)
    document.addEventListener('visibilitychange',visibilityChange)
    window.addEventListener('scroll',syncScroll,{passive:true})
    host.addEventListener('pointerdown',down)
    host.addEventListener('pointermove',move)
    host.addEventListener('lostpointercapture',up)
    host.addEventListener('pointerup',up)
    host.addEventListener('pointercancel',up)
    host.addEventListener('keydown',key)
    return () => {
      ended = true
      refresh.current = undefined
      intersection.disconnect()
      resize.disconnect()
      motion.removeEventListener('change',preferenceChange)
      document.removeEventListener('visibilitychange',visibilityChange)
      window.removeEventListener('scroll',syncScroll)
      host.removeEventListener('pointerdown',down)
      host.removeEventListener('pointermove',move)
      host.removeEventListener('lostpointercapture',up)
      host.removeEventListener('pointerup',up)
      host.removeEventListener('pointercancel',up)
      host.removeEventListener('keydown',key)
      release()
    }
  }, [kind])

  function toggleMotion() {
    pauseFlag.current = !pauseFlag.current
    setPaused(pauseFlag.current)
    refresh.current?.()
  }

  return <div className={'work-plate' + (live ? ' is-live' : '')} data-plate={kind}>
    <img className="plate-still" src={'./plates/' + kind + '.webp'} alt={name + ', illustrative 3D model'} loading="lazy" draggable={false} />
    <div className="plate-viewport" ref={viewport} role="group" tabIndex={live ? 0 : undefined}
      aria-label={name} aria-describedby={live ? instructionId : undefined} />
    {live && <>
      <span className="plate-instructions" id={instructionId}>Drag or use the left and right arrow keys to rotate. Press Home to reset the view.</span>
      <span className="plate-orbit-tip" aria-hidden="true"><Rotate3D size={14} />Drag to rotate</span>
      <button className="plate-motion" type="button" aria-label={(paused ? 'Play ' : 'Pause ') + name + ' animation'}
        aria-pressed={paused} onClick={toggleMotion}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
    </>}
  </div>
}

