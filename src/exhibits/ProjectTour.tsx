import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, MessageCircle, X } from 'lucide-react'
import type { PlateKind } from '../editorial/plates/plateTypes'
import { tourScript } from './tourScript'
import TourVoice from './TourVoice'
import './tour.css'

type Visit = { kind: PlateKind; beat: number }
type Guide = {
  visit: Visit | null; enabled: boolean
  start: (kind: PlateKind, opener?: HTMLElement) => void
  close: (restoreFocus?: boolean) => void
  setBeat: (beat: number) => void
}
const Tour = createContext<Guide | null>(null)
export function useProjectTour() {
  const guide = useContext(Tour)
  if (!guide) throw new Error('Project tour provider is missing')
  return guide
}

export function ProjectTourProvider({children}: {children: ReactNode}) {
  const [enabled,setEnabled] = useState(() => {
    try { return localStorage.getItem('vlastimir.companion.hidden') !== '1' } catch { return true }
  })
  const [visit,setVisit] = useState<Visit|null>(null)
  const opener = useRef<HTMLElement|null>(null)
  const lastKind = useRef<PlateKind|null>(null)
  const close = useCallback((restoreFocus = false) => {
    setVisit(null)
    if (restoreFocus && opener.current?.isConnected) opener.current.focus({preventScroll:true})
  },[])
  function start(kind:PlateKind, source?:HTMLElement) {
    if (!enabled) return
    opener.current = source?.matches('button') ? source : document.querySelector('[data-ask="'+kind+'"]')
    setVisit(v => v?.kind === kind ? v : {kind,beat:0})
  }
  useLayoutEffect(() => {
    const anchor=visit && document.querySelector<HTMLElement>('[data-tour-anchor="'+visit.kind+'"]')
    if (visit && anchor) {
      if (lastKind.current !== visit.kind) {
        const figure=anchor.closest('figure')!.getBoundingClientRect()
        const bottom=anchor.closest('.tour-dialogue')!.getBoundingClientRect().bottom
        const safeTop=(document.querySelector('.masthead')?.getBoundingClientRect().bottom ?? 70)+12
        if (bottom > innerHeight-14 || bottom < safeTop+80 || figure.top>innerHeight) {
          const y=Math.max(bottom-(innerHeight-16),figure.top-safeTop)
          window.scrollBy(0,y)
        }
      }
      lastKind.current=visit.kind
      document.dispatchEvent(new CustomEvent('vlastimir:tour',{detail:{...visit,anchor}}))
    } else {
      lastKind.current=null
      document.dispatchEvent(new CustomEvent('vlastimir:tour',{detail:null}))
    }
  },[visit])
  useEffect(()=>{
    function visibility(event:Event) {setEnabled(Boolean((event as CustomEvent<boolean>).detail))}
    const dismiss=()=>close()
    const escape=(event:KeyboardEvent)=>{
      if (event.key==='Escape' && lastKind.current && !document.querySelector('dialog[open]')) close(true)
    }
    document.addEventListener('vlastimir:guide-visibility',visibility)
    document.addEventListener('vlastimir:guide-hidden',dismiss)
    document.addEventListener('vlastimir:tour-away',dismiss)
    document.addEventListener('keydown',escape)
    return ()=>{
      document.removeEventListener('vlastimir:guide-visibility',visibility)
      document.removeEventListener('vlastimir:guide-hidden',dismiss)
      document.removeEventListener('vlastimir:tour-away',dismiss)
      document.removeEventListener('keydown',escape)
      document.dispatchEvent(new CustomEvent('vlastimir:tour',{detail:null}))
    }
  },[close])
  return <Tour.Provider value={{enabled,visit,start,close,setBeat:beat=>setVisit(v=>v && {...v,beat:Math.min(2,Math.max(0,beat))})}}>{children}</Tour.Provider>
}

export function ProjectTitle({kind,children}: {kind:PlateKind;children:ReactNode}) {
  const guide=useProjectTour()
  return <h3>{guide.enabled ? <button className="tour-project-title" type="button"
    aria-label={'Ask Luffy about '+tourScript[kind].name} onClick={e=>guide.start(kind,e.currentTarget)}>{children}</button> : children}</h3>
}

export function TourPrompt({kind}: {kind:PlateKind}) {
  const guide=useProjectTour()
  if (!guide.enabled) return null
  const active=guide.visit?.kind===kind
  return <button type="button" className="tour-prompt" data-ask={kind}
    aria-expanded={active} aria-controls={active?'guide-'+kind:undefined}
    aria-label={(active?'Close Luffy’s tour of ':'Ask Luffy about ')+tourScript[kind].name}
    onClick={e=>active?guide.close(true):guide.start(kind,e.currentTarget)}>
    <MessageCircle size={15} aria-hidden="true" />{active?'End tour':'Ask Luffy'}
  </button>
}

export function Dialogue({kind}: {kind:PlateKind}) {
  const guide=useProjectTour()
  const label=useId()
  if (!guide.visit || guide.visit.kind !== kind) return null
  const {beat}=guide.visit
  const [subject,speech,reply]=tourScript[kind].beats[beat]
  return <div className="tour-dialogue" id={'guide-'+kind} role="region" aria-label={'Luffy explains '+tourScript[kind].name}>
    <div className="tour-landing" aria-hidden="true">
      <span data-tour-anchor={kind} className="tour-perch" />
      <svg viewBox="0 0 78 12" fill="none"><path d="M6 7Q32 2 70 6M14 9Q40 6 59 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
    </div>
    <div className="tour-bubble">
      <div className="tour-speaker"><b>Luffy</b><span>{beat+1} / 3</span><TourVoice kind={kind} beat={beat} line={speech}/><button className="tour-dismiss" type="button" onClick={()=>guide.close(true)} aria-label="Dismiss dialogue"><X size={15}/></button></div>
      <div className="tour-line" aria-live="polite" aria-atomic="true"><p key={speech} id={label}>{speech}</p></div>
      <div className="tour-replies">
        {beat>0 && <button className="tour-back" type="button" aria-label="Previous dialogue" onClick={()=>guide.setBeat(beat-1)}><ChevronLeft size={16}/></button>}
        <button className="tour-reply" type="button" onClick={()=>beat===2?guide.close(true):guide.setBeat(beat+1)}>{reply}</button>
      </div>
    </div>
    <span className="exhibit-sr">Model view {subject}</span>
  </div>
}
