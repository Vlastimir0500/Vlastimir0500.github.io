import { applyPose, joints, poseFor, type Joint, type Motion } from './voyageMotion'
import { projectArrival, type TourStop } from './projectArrival'

const chapters = [
  ['top', .63], ['about', .72], ['work', .55], ['mathematics', .68],
  ['intelligence', .48], ['research', .67], ['future-work', .52], ['contact', .79],
] as const
const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value))
const ease = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const anchors = '[data-companion-stop], [data-companion="chip"], [data-companion="network"]'

function visibleFinancePoint(path: SVGPathElement, length: number, screenHeight: number) {
  const chart = path.ownerSVGElement
  const matrix = path.getScreenCTM()
  if (!chart || !matrix || !length) return
  const bounds = chart.getBoundingClientRect()
  if (bounds.width < 90 || bounds.height < 50) return
  const fraction = clamp((screenHeight * .82 - bounds.top) / (screenHeight * .48 + bounds.height))
  if (fraction <= .02 || fraction >= .98) return
  const point = path.getPointAtLength(fraction * length).matrixTransform(matrix)
  if (point.y < 165 || point.y > screenHeight - 36) return
  // Fade through the change in scale when moving from the margin onto the plotted path.
  return { x: point.x, y: point.y, opacity: clamp(Math.min(fraction - .02, .98 - fraction) * 20) }
}

export function bindVoyage(shell: HTMLSpanElement, compact: boolean, reduced: boolean, tourMemory: { current: TourStop | null }) {
  const nodes = Object.fromEntries(joints.map(name => [name,shell.querySelector<SVGGElement>('[data-joint="'+name+'"]')!])) as Record<Joint,SVGGElement>
  const root = shell.querySelector<SVGGElement>('[data-joint="root"]')!
  const now = performance.now()
  let frame = 0, lastTime = now, lastScroll = window.scrollY, lastMove = -5000, direction = 1
  let velocity = 0, activeId = '', enteredAt = now, activatedAt = -5000
  let lastMotion: Motion | undefined, awake = true, sceneJump = -1
  let height = innerHeight, width = innerWidth, rigWidth = shell.offsetWidth, measured = false
  let route: { id: string; start: number; lane: number }[] = []
  let boundaries: number[] = []
  let lastPath: SVGPathElement | null = null, lastDefinition: string | null = null, pathLength = 0
  const pose = poseFor('idle',0,0,0)
  const arrivalPath=projectArrival(reduced,request,tourMemory)
  const dock=document.getElementById('companion-dock')

  function measure() {
    height = innerHeight
    width = innerWidth
    rigWidth = shell.offsetWidth
    const scroll = window.scrollY
    const limit = Math.max(0,document.documentElement.scrollHeight-height)
    const start = (el: Element) => clamp(el.getBoundingClientRect().top + scroll - height * .43,0,limit)
    route = chapters.flatMap(([id,lane]) => {
      const el = document.getElementById(id)
      return el ? [{ id, start: id === 'top' ? 0 : start(el), lane }] : []
    }).sort((a,b) => a.start-b.start)
    boundaries = [...route.slice(1).map(s => s.start), ...Array.from(document.querySelectorAll(anchors),start)]
      .sort((a,b)=>a-b).filter((value,i,all)=>value > 120 && (!i || value-all[i-1]>115))
    measured = true
  }
  function request() {
    if (!frame && !document.hidden && awake) frame=requestAnimationFrame(render)
  }
  function refresh() { measured=false; request() }
  function attribute(name: string, value: string) {
    if (shell.dataset[name]!==value) shell.dataset[name]=value
  }
  function render(time: number) {
    frame = 0
    if (!measured) measure()
    if (!route.length) return
    const dt = Math.min(75,Math.max(4,time-lastTime))
    const scroll = window.scrollY
    const distance = scroll-lastScroll
    if (Math.abs(distance) > .25) {
      direction = Math.sign(distance)
      lastMove=time
      velocity = mix(velocity,Math.min(6,Math.abs(distance)/dt),.55)
    } else velocity *= Math.exp(-dt/70)
    lastTime=time
    lastScroll=scroll
    const moving = time-lastMove<130 && velocity>.03
    let i=0
    while (i+1<route.length && route[i+1].start<=scroll+.5) i++
    const current = route[i], next=route[i+1]
    if (current.id !== activeId) { activeId=current.id; enteredAt=time; activatedAt=-5000; sceneJump=-1 }
    const progress=clamp((scroll-current.start)/Math.max(1,(next?.start ?? document.documentElement.scrollHeight-height)-current.start))
    let footY = height*mix(current.lane,next?.lane ?? current.lane,ease(progress))
    let footX = width-rigWidth*.51-4
    let scale = 1, opacity = 1, onGraph = false
    const arrival=time-enteredAt
    let motion: Motion = moving ? (velocity>1.25 ? 'run' : 'walk') : 'idle'
    if (current.id==='top' && scroll<24 && !moving) motion=arrival<1850?'wave':'look'
    if (current.id==='work' && (!moving || velocity<.68)) motion='inspect'
    if (current.id==='intelligence' && !moving) motion=time-activatedAt<1050?'point':'look'
    if (current.id==='research' && (time-activatedAt<1250 || progress>.57 && progress<.74)) motion='celebrate'
    if (current.id==='future-work' && !moving) motion='point'

    if (current.id==='mathematics') {
      const path = document.querySelector<SVGPathElement>('path[data-companion-trace]')
      if (path && !compact && !reduced) {
        const definition = path.getAttribute('d')
        if (path!==lastPath || lastDefinition!==definition) {
          lastPath=path; lastDefinition=definition; pathLength=path.getTotalLength()
        }
        const point=visibleFinancePoint(path,pathLength,height)
        if (point) {
          onGraph=true; footX=point.x; footY=point.y; opacity=point.opacity; scale=.72
        }
      }
      motion=moving?'run':'point'
    }
    let lift=0
    const band=clamp(height*.105,58,96)
    let nearest=Infinity
    for (const boundary of boundaries) if (Math.abs(scroll-boundary)<Math.abs(nearest)) nearest=scroll-boundary
    const phase=(nearest+band)/(2*band)
    if (!compact && !reduced && !onGraph && phase>0 && phase<1) {
      const lead=direction===1?phase:1-phase
      lift=4*phase*(1-phase)*Math.min(45,height*.055)
      motion=lead>.82?'land':'jump'
    }
    // A newly selected intelligence exhibit gets one small hop toward its figure.
    if (activeId==='intelligence' && sceneJump>=0 && !compact && !reduced) {
      const t=clamp((time-sceneJump)/410)
      if (t<1) { lift+=32*4*t*(1-t); motion=t>.82?'land':'jump' }
    }
    if (current.id==='contact') { motion=arrival<1800?'seated-wave':'sit'; lift=0 }
    if (compact && (motion==='walk' || motion==='run' || motion==='jump')) motion='idle'
    if (reduced) {
      motion=current.id==='contact'?'sit':current.id==='work'?'inspect':current.id==='top'?'wave':'idle'
      footY=height*.67
    }
    if (compact && dock) {
      const bounds=dock.getBoundingClientRect()
      footX=bounds.left+bounds.width*.5; footY=bounds.top+bounds.height*.5+rigWidth*.46
      lift=0
    }
    const tour=arrivalPath.sample({x:footX,y:footY-lift,scale},time,rigWidth,height)
    if (tour.motion) { motion=tour.motion; opacity=1 }
    attribute('tour',tour.stop?'true':'false')
    attribute('flight',tour.travelling?'true':'false')
    attribute('speaking',tour.speaking && !reduced?'true':'false')
    if (motion!==lastMotion) { shell.dataset.motion=motion; lastMotion=motion }
    attribute('chapter',current.id)
    attribute('direction',direction>0?'forward':'backward')
    attribute('onGraph',onGraph?'true':'false')
    const locomotion=motion==='walk'||motion==='run'||motion==='jump'||motion==='land'
    const flip=tour.motion ? tour.facingRight : onGraph ? direction>0 : locomotion && direction<0
    const target=poseFor(motion,scroll*(motion==='run'?.055:.045),reduced?0:time,progress)
    const response=reduced?1:1-Math.exp(-dt/57)
    let settling=false
    for (const key of joints) {
      const value=mix(pose[key],target[key],response)
      if(Math.abs(value-pose[key])>.035) applyPose(nodes,key,value)
      // Initial neutral joints still need their rotations when an animation starts in that pose.
      else if (!nodes[key].hasAttribute('transform')) applyPose(nodes,key,target[key])
      pose[key]=value
      settling ||= Math.abs(value-target[key])>.35
    }
    pose.lift=mix(pose.lift,target.lift,response)
    root.setAttribute('transform',(flip?'translate(102 '+pose.lift.toFixed(1)+') scale(-1 1)':'translate(0 '+pose.lift.toFixed(1)+')'))
    {
      const entrance=!compact && !tour.motion && !reduced && scroll<3 && activeId==='top' ? 1-ease(clamp((time-now)/680)) : 0
      const x=tour.feet.x-rigWidth*.5*tour.feet.scale+entrance*rigWidth*.85
      const y=tour.feet.y-rigWidth*1.045*tour.feet.scale
      shell.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+tour.feet.scale+')'
      shell.style.opacity=(opacity*(1-entrance)).toFixed(2)
    }
    const gestureActive=motion==='wave' || motion==='seated-wave' || time-activatedAt<1250 || sceneJump>=0 && time-sceneJump<480
    if (!reduced && (tour.travelling || tour.speaking || moving || settling || gestureActive || time-lastMove<340)) request()
  }
  const onPageVisibility=() => {
    if (document.hidden) { cancelAnimationFrame(frame); frame=0 }
    else { lastTime=performance.now(); request() }
  }
  const interaction=(event: Event) => {
    const target=event.target
    if (!(target instanceof Element)) return
    if (target.closest('#mathematics')) { request(); return }
    if (!target.closest('button,summary,[role="tab"]')) return
    if (target.closest('#intelligence,#studies')) { activatedAt=performance.now(); sceneJump=activatedAt; request() }
    if (target.closest('#research,#future-work')) { activatedAt=performance.now(); request() }
  }
  const onDialog=()=>{
    awake=!document.querySelector('dialog[open]')
    if (!awake) {cancelAnimationFrame(frame);frame=0}
    else request()
  }
  const modalObserver=new MutationObserver(onDialog)
  modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']})
  const resize=new ResizeObserver(refresh)
  resize.observe(document.body)
  window.addEventListener('resize',refresh)
  window.addEventListener('scroll',request,{passive:true})
  document.addEventListener('visibilitychange',onPageVisibility)
  document.addEventListener('click',interaction)
  document.addEventListener('input',interaction)
  onDialog()
  return ()=>{
    cancelAnimationFrame(frame)
    arrivalPath.dispose(); resize.disconnect(); modalObserver.disconnect()
    window.removeEventListener('scroll',request); window.removeEventListener('resize',refresh)
    document.removeEventListener('visibilitychange',onPageVisibility); document.removeEventListener('click',interaction)
    document.removeEventListener('input',interaction)
  }
}
