import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Pause, Play, Rotate3D } from 'lucide-react'
import { plateLabels } from './plates/plateTypes'
import type { PlateKind } from './plates/plateTypes'
import type { createPlateStage } from './plates/stage'

export default function WorkPlate({ kind }: { kind: PlateKind }) {
  const viewport = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState(-1)
  const activeBeat = useRef(-1)
  const pauseFlag = useRef(false)
  const refresh = useRef<(() => void) | undefined>(undefined)
  const instructionId = useId()
  const name = plateLabels[kind]

  useLayoutEffect(() => {
    function frameTour(event: Event) {
      const cue = (event as CustomEvent<{kind: PlateKind; beat: number} | null>).detail
      activeBeat.current = cue?.kind === kind && Number.isInteger(cue.beat) && cue.beat >= 0 && cue.beat <= 2 ? cue.beat : -1
      setBeat(activeBeat.current)
      refresh.current?.()
    }
    document.addEventListener('vlastimir:tour',frameTour)
    return () => document.removeEventListener('vlastimir:tour',frameTour)
  },[kind])

  useEffect(() => {
    const host = viewport.current
    if (!host || !window.WebGL2RenderingContext) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let stage: ReturnType<typeof createPlateStage> | undefined
    let canvas: HTMLCanvasElement | undefined
    let visible = false, ended = false, loading = false, failed = false, lost = false
    let frame = 0, last = 0, elapsed = 0, progress = .5
    let yaw = 0, pitch = 0, pointer: number | undefined, lastX = 0, lastY = 0
    let dirty = true, ready = false
    const tour: [number, number, number] = [0,0,0]
    const size = { width: host.clientWidth, height: host.clientHeight }

    function render(now: number) {
      frame = 0
      if (!stage || lost || !visible || document.hidden || motion.matches || ended) return
      if (dirty || !last || now - last >= 1000 / 30) {
        const dt = last ? Math.max(0, (now - last) / 1000) : 0
        if (!pauseFlag.current) elapsed += Math.min(dt, .12)
        const blend = pauseFlag.current ? 1 : 1 - Math.exp(-6.5 * Math.min(dt, .25))
        for (let i=0; i<tour.length; i++) {
          const target = i === activeBeat.current ? 1 : 0
          tour[i] += (target - tour[i]) * blend
          if (Math.abs(target - tour[i]) < .001) tour[i] = target
        }
        stage.draw(size.width, size.height, Math.min(devicePixelRatio || 1, 1.6), elapsed, progress, yaw, pitch, tour)
        dirty = false
        last = now
        if (!ready) { ready = true; setLive(true) }
      }
      if (!pauseFlag.current) frame = requestAnimationFrame(render)
    }
    function invalidate() {
      dirty = true
      if (visible && stage && !lost && !document.hidden && !frame) frame = requestAnimationFrame(render)
    }
    refresh.current = () => { last = 0; invalidate() }

    function release() {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', contextLost)
        canvas.removeEventListener('webglcontextrestored', contextRestored)
      }
      stage?.dispose()
      stage = undefined
      canvas?.remove()
      canvas = undefined
      ready = false
      lost = false
      if (!ended) setLive(false)
    }
    function contextLost(event: Event) {
      event.preventDefault()
      lost = true
      ready = false
      cancelAnimationFrame(frame)
      frame = 0
      setLive(false)
    }
    function contextRestored() {
      // Rebuild the scene-owned reflection and shadow targets after a driver reset.
      release()
      void activate()
    }

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
        canvas.addEventListener('webglcontextrestored',contextRestored)
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

  const poster = !live && beat >= 0 ? 'tour/' + kind + '-' + beat : kind
  return <div className={'work-plate' + (live ? ' is-live' : '')} data-plate={kind} data-tour-beat={beat >= 0 ? beat : undefined}>
    <img className="plate-still" src={'./plates/' + poster + '.webp'} alt={name + ', illustrative 3D model'} loading="lazy" draggable={false} />
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

