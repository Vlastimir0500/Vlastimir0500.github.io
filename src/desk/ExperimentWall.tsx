import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import FutureWork from '../editorial/FutureWork'
import NotebookFigure, { hillEstimate, type SketchKind } from './NotebookFigure'
import './notebook.css'

const sheets = [
  {kind:'tail', status:'Documented result', title:'Reading the tail', caption:'Threshold study · synthetic sample',
    question:'How many extreme observations can a fit afford to keep?', link:'Read the tail-index study', href:'https://github.com/Vlastimir0500/real-return-tail-index'},
  {kind:'edge', status:'Ongoing exploration', title:'Following one edge', caption:'Geometry sketch · boundary trace',
    question:'How far must you travel along a Möbius strip to get back to your mark?', link:'Inspect the sculpture', href:'#top'},
  {kind:'loop', status:'Proposed experiment', title:'Remembering a loop', caption:'Map study · route connectivity',
    question:'Could a navigator infer an island from a succession of local observations?', link:'Explore the proposed atlas', href:'#research-atlas'},
] as const

function StudySheet({sheet}: {sheet: typeof sheets[number]}) {
  const [open, setOpen] = useState(false)
  const [k, setK] = useState(12)
  const [turns, setTurns] = useState(.62)
  const [closed, setClosed] = useState(false)
  const { kind } = sheet
  const values: Record<SketchKind, number> = { tail: k, edge: turns, loop: Number(closed) }
  const panel = 'notebook-detail-' + kind
  return <article className="notebook-sheet">
    <figure>
      <NotebookFigure kind={kind} value={values[kind]}/>
      <figcaption>{sheet.caption}</figcaption>
    </figure>
    <div className="notebook-copy">
      <p className={'notebook-state notebook-'+kind}>{sheet.status}</p>
      <h3>{sheet.title}</h3>
      <p className="notebook-question">{sheet.question}</p>
      <button className="notebook-toggle" type="button" aria-expanded={open} aria-controls={panel} onClick={()=>setOpen(!open)}>
        {open?<Minus aria-hidden="true" size={15}/>:<Plus aria-hidden="true" size={15}/>}
        {open?'Close sheet':'Open study sheet'}
      </button>
      <div className="notebook-detail" id={panel} hidden={!open}>
        {kind==='tail' && <>
          <p>The repository’s Pareto smoke test selected 50 exceedances and estimated a tail index of 3.78. Its validity check still classified the fit as uncertain. Threshold stability and bootstrap variability both enter that assessment.</p>
          <p>In this separate synthetic example, the Hill estimate uses the mean log distance from the threshold. Move the cutoff to see how the fitted index changes.</p>
          <label htmlFor="notebook-threshold">Exceedances <output htmlFor="notebook-threshold">{k}</output></label>
          <input id="notebook-threshold" type="range" min={4} max={32} value={k} onChange={event=>setK(Number(event.target.value))}/>
          <p className="notebook-readout" aria-live="polite">Illustrated tail index <strong>{hillEstimate(k).toFixed(2)}</strong></p>
        </>}
        {kind==='edge' && <>
          <p>The hero sculpture sweeps a cross-section around a closed curve while turning it through half a rotation. Start at one rim and follow the copper point.</p>
          <p>After one turn around the centerline, the point reaches the opposite rim at the same cross-section. A second turn brings it home. The two apparent rims belong to a single boundary.</p>
          <label htmlFor="notebook-turns">Turns around the centerline <output htmlFor="notebook-turns">{turns.toFixed(2)}</output></label>
          <input id="notebook-turns" type="range" min={0} max={2} step={.01} value={turns} onChange={event=>setTurns(Number(event.target.value))}/>
        </>}
        {kind==='loop' && <>
          <p>Seven observed stations form a connected graph. Sailing back to a known junction adds an edge without adding a station. The number of independent loops is the edge count minus the station count plus one.</p>
          <p>I’d test whether a similar loop survives when connections are reconstructed from overlapping simulated place fields. Shuffling their firing times would supply a control.</p>
          <button type="button" className="notebook-passage" aria-pressed={closed} onClick={()=>setClosed(!closed)}>Return passage <span>{closed?'charted':'uncharted'}</span></button>
          <p className="notebook-readout" aria-live="polite">{closed ? '7 edges · 7 stations · 1 loop' : '6 edges · 7 stations · 0 loops'}</p>
        </>}
        <a className="notebook-source" href={sheet.href}>{sheet.link}</a>
      </div>
    </div>
  </article>
}

export default function ExperimentWall() {
  return <>
    <section className="experiment-wall paper" id="research" aria-labelledby="notebook-title">
      <div className="ed-inner">
        <p className="chapter-mark"><span>05</span><i aria-hidden="true"/>The experiments</p>
        <header className="notebook-heading">
          <h2 id="notebook-title">Not everything starts <em>with an answer.</em></h2>
          <p>My notebook holds measurements, unfinished sketches and questions for the next voyage. Open a sheet to try the method.</p>
        </header>
        <div className="notebook-wall">{sheets.map(sheet=><StudySheet key={sheet.kind} sheet={sheet}/>)}</div>
      </div>
    </section>
    <FutureWork />
  </>
}
