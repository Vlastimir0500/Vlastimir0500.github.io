import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import WorkPlate from '../editorial/WorkPlate'
import type { PlateKind } from '../editorial/plates/plateTypes'
import { Dialogue, TourPrompt, useProjectTour } from './ProjectTour'
import { tourScript } from './tourScript'

export const github = 'https://github.com/Vlastimir0500/'

export function ExhibitHeading({ number, topic, title, accent }: { number: string; topic: string; title: string; accent: string }) {
  return <>
    <p className="chapter-mark"><span>{number}</span><i aria-hidden="true" />{topic}</p>
    <header className="chapter-head exhibit-head"><h2>{title} <em>{accent}</em></h2></header>
  </>
}

export function ModelFigure({ kind, number, caption, cue }: { kind: PlateKind; number: string; caption: string; cue?: string }) {
  const guide=useProjectTour()
  const active=guide.visit?.kind===kind
  const press=useRef<{id:number;x:number;y:number;dragged:boolean}|null>(null)
  function down(e:PointerEvent) {
    if (!e.isPrimary || e.button!==0 || (e.target as Element).closest('button')) return
    press.current={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false}
  }
  function move(e:PointerEvent) {
    const p=press.current
    if(p?.id===e.pointerId && Math.hypot(p.x-e.clientX,p.y-e.clientY)>7) p.dragged=true
  }
  function up(e:PointerEvent) {
    move(e)
    const p=press.current
    press.current=null
    if(p?.id===e.pointerId && !p.dragged) guide.start(kind)
  }
  return <figure className="exhibit-model" data-companion={cue} data-guided={active || undefined} data-tour-beat={active ? guide.visit?.beat : undefined}>
    <div className="project-art" onPointerDownCapture={down} onPointerMoveCapture={move} onPointerUpCapture={up}
      onPointerCancelCapture={()=>{press.current=null}}>
      <WorkPlate kind={kind} />
      <TourPrompt kind={kind}/>
      {active && guide.visit && <span className="tour-focus" key={guide.visit.beat}>{tourScript[kind].beats[guide.visit.beat][0]}</span>}
    </div>
    <figcaption>Fig. {number} <i>/</i> {caption}</figcaption>
    <Dialogue kind={kind}/>
  </figure>
}

export function Choices({ label, choices, value, onChange }: { label: string; choices: readonly string[]; value: number; onChange: (value: number) => void }) {
  return <div className="exhibit-choices" role="group" aria-label={label}>
    {choices.map((choice, index) => <button type="button" key={choice} aria-pressed={value === index}
      onClick={() => onChange(index)}>{choice}</button>)}
  </div>
}

export function PlotFrame({ label, children }: { label: string; children: ReactNode }) {
  return <svg className="exhibit-plot" viewBox="0 0 540 174" role="img" aria-label={label}>
    <title>{label}</title>
    <g className="plot-grid" aria-hidden="true">
      {[24, 78, 132, 186, 240, 294, 348, 402, 456, 510].map(x => <path key={x} d={'M' + x + ' 14v132'} />)}
      {[18, 50, 82, 114, 146].map(y => <path key={y} d={'M24 ' + y + 'h486'} />)}
    </g>
    {children}
  </svg>
}

export function MethodNotes({ architecture, challenge, method, result, source, label }: {
  architecture: string; challenge: string; method: string; result: string; source: string; label: string
}) {
  return <details className="exhibit-method">
    <summary>Engineering notes</summary>
    <dl>{[['Architecture',architecture],['Challenge',challenge],['Method',method],['Finding',result]].map(([term,detail]) =>
      <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl>
    <a className="source-link" href={source}>{label}</a>
  </details>
}
