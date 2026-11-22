import type { Motion } from './voyageMotion'

export type TourStop = { kind: string; beat: number; anchor: HTMLElement }
type Feet = { x: number; y: number; scale: number }
const gestures: Record<string, Motion[]> = {
  hardware: ['inspect', 'point', 'celebrate'],
  paths: ['point', 'look', 'celebrate'],
  events: ['look', 'point', 'celebrate'],
  graph: ['look', 'point', 'celebrate'],
  shift: ['inspect', 'look', 'celebrate'],
  filter: ['point', 'inspect', 'celebrate'],
}

export function projectArrival(reduced: boolean, wake: () => void, memory: { current: TourStop | null }) {
  let rendered: Feet | undefined
  let flight: { start: Feet; time: number; departing: boolean } | undefined
  let changedAt=performance.now()
  let speakingUntil=0
  let hasSeenPerch=false
  function departure() {
    if (!memory.current) return
    memory.current=null
    changedAt=performance.now()
    flight=rendered && !reduced ? {start:{...rendered},time:changedAt,departing:true} : undefined
  }
  function change(event: Event) {
    const stop=(event as CustomEvent<TourStop|null>).detail
    if (!stop) { departure(); wake(); return }
    if (!(stop.anchor instanceof HTMLElement) || !Number.isFinite(stop.beat)) return
    if (memory.current?.anchor!==stop.anchor || memory.current?.kind!==stop.kind) {
      hasSeenPerch=false
      changedAt=performance.now()
      flight=rendered && !reduced ? {start:{...rendered},time:changedAt,departing:false} : undefined
    }
    memory.current=stop
    speakingUntil=performance.now()+(flight?.departing===false?730:0)+840
    wake()
  }
  document.addEventListener('vlastimir:tour',change)

  function sample(base: Feet, time: number, rigWidth: number, viewportHeight: number) {
    const stop=memory.current
    let destination=base
    let motion: Motion | undefined
    if (stop) {
      const bounds=stop.anchor.getBoundingClientRect()
      const visible=bounds.bottom>52 && bounds.top<viewportHeight
      if (!stop.anchor.isConnected || (!visible && hasSeenPerch && time-changedAt>700)) {
        departure()
        document.dispatchEvent(new CustomEvent('vlastimir:tour-away'))
      } else {
        if (visible) hasSeenPerch=true
        const displayedWidth=Math.min(82,bounds.width*.97,bounds.height*.87)
        destination={x:bounds.x+bounds.width*.5,y:bounds.bottom-4,scale:Math.max(.35,displayedWidth/rigWidth)}
        const sequence=gestures[stop.kind] ?? gestures.hardware
        motion=sequence[Math.min(sequence.length-1,Math.max(0,Math.trunc(stop.beat)))]
      }
    }
    let feet=destination
    let travelling=false
    let facingRight=Boolean(memory.current)
    if (flight) {
      const {start,departing}=flight
      const dx=destination.x-start.x, dy=destination.y-start.y
      const distance=Math.hypot(dx,dy)
      const duration=departing?560:730
      const t=Math.max(0,Math.min(1,(time-flight.time)/duration))
      if (t<1) {
        const blend=t*t*(3-2*t)
        const arc=4*blend*(1-blend)
        feet={ x:start.x+dx*blend, y:start.y+dy*blend-arc*Math.min(94,22+distance*.14),
          scale:start.scale+(destination.scale-start.scale)*blend }
        motion=t>.85?'land':'jump'
        facingRight=t>.85?Boolean(memory.current):dx>0
        travelling=true
      } else flight=undefined
    }
    rendered=feet
    return { feet, motion, facingRight, travelling, speaking: Boolean(memory.current) && !travelling && time < speakingUntil, stop:memory.current }
  }
  return { sample, dispose:()=>document.removeEventListener('vlastimir:tour',change) }
}
