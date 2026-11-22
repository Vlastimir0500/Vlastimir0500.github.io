import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PirateFigure from './PirateFigure'
import { bindVoyage } from './bindVoyage'
import type { TourStop } from './projectArrival'
import './companion.css'

const preferenceKey = 'vlastimir.companion.hidden'
const narrowScreen = '(max-width: 1099px), (max-height: 490px)'
function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatch(media.matches)
    update()
    media.addEventListener('change',update)
    return () => media.removeEventListener('change',update)
  },[query])
  return match
}

function HatIcon({ hide }: { hide: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5.2 11.8.8-4.5q.4-2.8 4-3.2l2.5.1q2.4.3 3.2 3.1l1.2 4.7M5.7 9.1q4.4 1.5 10.3.1"/>
    <path d="M1.6 12.6q.7-1 3.7-1.1 5.8 2.3 11.6.1 2.6-.1 3.4 1.4.2 1.6-3 2.2-6.9 1.4-13.1-.3-3.1-.9-2.6-2.3Z"/>
    {hide && <path d="M3.3 3.1 19 18.9" strokeWidth="1.9"/>}
  </svg>
}

export default function Companion() {
  const [hidden,setHidden] = useState(() => {
    try { return localStorage.getItem(preferenceKey)==='1' } catch { return false }
  })
  const compact=useMedia(narrowScreen)
  const reduced=useMedia('(prefers-reduced-motion: reduce)')
  const [dock,setDock]=useState<HTMLElement | null>(null)
  const rig=useRef<HTMLSpanElement>(null)
  const tour=useRef<TourStop|null>(null)
  useLayoutEffect(()=>{setDock(document.getElementById('companion-dock'))},[])
  useEffect(()=>{
    document.dispatchEvent(new CustomEvent('vlastimir:guide-visibility',{detail:!hidden}))
  },[hidden])
  useEffect(()=>{
    if (!hidden && rig.current) return bindVoyage(rig.current,compact,reduced,tour)
  },[hidden,compact,reduced,dock])
  function toggle() {
    const next=!hidden
    if (next) { tour.current=null; document.dispatchEvent(new CustomEvent('vlastimir:guide-hidden')) }
    setHidden(next)
    try { localStorage.setItem(preferenceKey,next?'1':'0') } catch { /* Keep this visit's choice in memory. */ }
  }
  const label=(hidden?'Show':'Hide')+' pirate companion'
  const control=<button type="button" className={'voyage-toggle '+(compact?'is-docked':'is-rail')} aria-label={label}
    data-tip={label} title={label} aria-pressed={!hidden} onClick={toggle}><HatIcon hide={hidden}/></button>
  return <>{!hidden && <span ref={rig} className={'voyage-figure'+(compact?' is-docked':'')} aria-hidden="true" data-motion="idle">
    <PirateFigure/></span>}{compact ? (dock && createPortal(control,dock)) : control}</>
}
