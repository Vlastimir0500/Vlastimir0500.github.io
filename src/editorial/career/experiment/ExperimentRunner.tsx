import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Play } from 'lucide-react'
import { protocol, syntheticRoute } from './navigationModel'
import type { Position, Replay, ReplayStage, WorkerMessage } from './navigationModel'
import './experiment.css'

const firstSeed = 1701
function readSeed(text: string) {
  if (!/^\d+$/.test(text.trim())) return null
  const number = Number(text)
  return Number.isSafeInteger(number) && number <= 4294967295 ? number : null
}
const east = (x: number) => 215 + 2.1*x
const north = (y: number) => 106 - 2.1*y
const points = (route: Position[]) => route.map(([x,y])=>east(x).toFixed(2)+','+north(y).toFixed(2)).join(' ')

function ReplayPlot({seed, replay}: {seed: number; replay: Replay|null}) {
  const grid = useId()
  const observations = replay?.voyages[0]
  const truth = observations?.map(fix=>fix.truth) ?? syntheticRoute(seed,protocol.trainVoyages)
  return <figure className="replay-plot">
    <svg viewBox="0 0 430 220" role="img" aria-label={observations
      ? 'First held-out voyage. Decoded positions in cyan follow the reference route in copper.'
      : 'Reference route for the first synthetic held-out voyage, with four landmark fixes.'}>
      <defs><pattern id={grid} x="5" y="1" width="21" height="21" patternUnits="userSpaceOnUse">
        <path d="M21 0H0V21" fill="none" stroke="#93b3bb" strokeOpacity=".16" strokeWidth=".6"/>
      </pattern></defs>
      <rect width="430" height="220" fill={'url(#'+grid+')'}/>
      <g fill="none" stroke="#9db0b5" opacity=".23" strokeDasharray="2 5"><path d="M12 106H418M215 9V207"/></g>
      <polyline points={points(truth)} fill="none" stroke="#daa679" strokeWidth="2" strokeLinejoin="round"/>
      {observations && <polyline className="replay-decoded" points={points(observations.map(p=>p.decoded))} fill="none" stroke="#84d6cc" strokeWidth="1.55" strokeLinejoin="round"/>}
      {truth.filter((_,i)=>i%protocol.landmarkEverySamples===0).map(([x,y],i)=>
        <rect key={i} x={east(x)-2.7} y={north(y)-2.7} width="5.4" height="5.4" fill="#f1d8b1" stroke="#1d292a" strokeWidth="1"/>)}
      <path d="M18 199v5h42v-5" fill="none" stroke="#afc0c0" strokeWidth="1"/>
      <text x="66" y="205" fill="#bdcccb" fontFamily="var(--mono)" fontSize="10">20 m</text>
    </svg>
    <figcaption><span>Held-out voyage 01</span><span className="replay-legend"><i/>Reference {replay && <><i/>Decoded</>}</span></figcaption>
  </figure>
}

function saveReplay(replay: Replay) {
  const blob = new Blob([JSON.stringify(replay,null,2)+'\n'],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'navigation-replay-'+replay.seed+'.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export default function ExperimentRunner() {
  const [seedText,setSeedText] = useState(String(firstSeed))
  const [run,setRun] = useState<Replay|null>(null)
  const [stage,setStage] = useState<ReplayStage|null>(null)
  const [error,setError] = useState('')
  const worker = useRef<Worker|null>(null)
  const heading = useId(), seedId = useId(), errorId = useId()
  const seed = readSeed(seedText)
  useEffect(()=>()=>{worker.current?.terminate()},[])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (worker.current) return
    if (seed === null) { setError('Enter a whole-number seed from 0 to 4294967295.'); return }
    setError('')
    setRun(null)
    setStage('Generating training voyages')
    function finish() {
      worker.current?.terminate()
      worker.current = null
      setStage(null)
    }
    try {
      const task = new Worker(new URL('./replay.worker.ts',import.meta.url),{type:'module'})
      worker.current = task
      task.onmessage = ({data}: MessageEvent<WorkerMessage>) => {
        if ('stage' in data) { setStage(data.stage); return }
        if ('replay' in data) setRun(data.replay)
        else setError(data.error)
        finish()
      }
      task.onerror = event => {
        event.preventDefault()
        setError('The experiment could not start. Reload the page and try again.')
        finish()
      }
      task.postMessage(seed)
    } catch {
      setError('This browser could not start the experiment worker.')
      finish()
    }
  }

  return <article className="replay-bench" aria-labelledby={heading} id="navigation-replay">
    <header className="replay-heading"><h3 id={heading}>Navigation <em>replay.</em></h3><p>Can a navigator recover its position between landmarks? Run the same synthetic voyages through a place-cell decoder and a navigator that holds its last fix.</p></header>
    <div className="replay-instrument">
      <div className="replay-scope">
        <ReplayPlot seed={seed ?? firstSeed} replay={run}/>
        <div className="replay-results" aria-label="Median position error">
          <div><span>Decoder error</span><output>{run ? run.results.decoderMedianMetres.toFixed(2)+' m' : '—'}</output></div>
          <div><span>Last-fix error</span><output>{run ? run.results.baselineMedianMetres.toFixed(2)+' m' : '—'}</output></div>
        </div>
      </div>
      <div className="replay-protocol">
        <h4>Run the protocol</h4>
        <ol>
          <li>Generate eight training voyages and noisy responses from 20 simulated place fields.</li>
          <li>Decode four new voyages from the three closest training responses at each sample.</li>
          <li>Compare median position error against the last known fix, refreshed every 16 samples.</li>
        </ol>
        <form onSubmit={submit} noValidate className="replay-controls">
          <label htmlFor={seedId}>Random seed<input id={seedId} type="text" inputMode="numeric" spellCheck={false} autoComplete="off" value={seedText}
            disabled={!!stage} onChange={event=>{setSeedText(event.target.value);setRun(null);setError('')}}
            aria-invalid={Boolean(error && seed === null)} aria-describedby={error ? errorId : undefined}/></label>
          <button className="replay-run" type="submit" disabled={!!stage}><Play size={14} fill="currentColor" aria-hidden="true"/>{stage ? 'Running…' : 'Run experiment'}</button>
        </form>
        <div className="replay-status" role="status">{stage || (run ? 'Scored '+run.results.heldOutSamples+' held-out positions.' : '')}</div>
        {error && <p className="replay-error" id={errorId} role="alert">{error}</p>}
        {run && <button type="button" className="replay-download" onClick={()=>saveReplay(run)}><Download size={15} aria-hidden="true"/>Download run JSON</button>}
      </div>
    </div>
  </article>
}
