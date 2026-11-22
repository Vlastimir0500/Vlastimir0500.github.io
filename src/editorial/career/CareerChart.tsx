import { useId } from 'react'
import type { CSSProperties } from 'react'
import { available, milestones } from './careerPlan'
import type { MilestoneId } from './careerPlan'
import './career-chart.css'

const positions = {
  model: {wide: [90,110], narrow: [91,84]},
  automate: {wide: [90,269], narrow: [269,84]},
  bench: {wide: [273,110], narrow: [91,215]},
  reproduce: {wide: [273,269], narrow: [269,215]},
  navigate: {wide: [496,188], narrow: [180,348]},
  publish: {wide: [681,188], narrow: [180,473]},
} as const
type State = 'done' | 'ready' | 'upcoming'
type Edge = { from: MilestoneId; to: MilestoneId; wide: string; narrow: string; track: string }

const edges: Edge[] = [
  {from:'model',to:'bench',track:'research',wide:'M90 110H273',narrow:'M91 153V215'},
  {from:'automate',to:'reproduce',track:'automation',wide:'M90 269H273',narrow:'M269 153V215'},
  {from:'bench',to:'navigate',track:'research',wide:'M273 110H357L435 188H496',narrow:'M91 284V287L118 314H151L180 343V348'},
  {from:'reproduce',to:'navigate',track:'automation',wide:'M273 269H354L435 188H496',narrow:'M269 284V287L242 314H209L180 343V348'},
  {from:'navigate',to:'publish',track:'combined',wide:'M496 188H681',narrow:'M180 417V473'},
]

function StationIcon({station}: {station: MilestoneId}) {
  switch(station) {
    case 'model': return <><path d="m3 20 3-6 5-3 2-6 4-3 5 2 2 6-2 6-6 3-3 5-6 1Z"/><path d="m7 18 3-4 4-2 2-5 3-2 2 3-1 6-5 3-3 4-4 1Z"/><path d="m13 15 3-2 2-4"/></>
    case 'automate': return <><path d="M3 14h4m5 0h3l3-6h5m-8 6 3 6h5"/><rect x="6" y="10" width="7" height="8" rx=".8"/><path d="m21 5 3 3-3 3m0 6 3 3-3 3"/></>
    case 'bench': return <><path d="M4 4v19h21M7 18c4 0 5-11 9-11s4 9 8 9"/><path d="M8 21v-2m6 2v-3m6 3v-2"/><circle cx="16" cy="7" r="2"/></>
    case 'reproduce': return <><path d="M8 7a9 9 0 1 1-3 8M5 5v5h5M14 9v6l4 2"/><circle cx="14" cy="15" r="1.4"/></>
    case 'navigate': return <><circle cx="14" cy="14" r="10"/><path d="m19 7-3 10-8 4 4-10ZM12 11l4 6M14 2v3m0 18v3M2 14h3m18 0h3"/></>
    case 'publish': return <><path d="m4 9 10-5 10 5v11l-10 5-10-5ZM4 9l10 5 10-5M14 14v11M10 6l10 5v4"/></>
  }
}

function Wiring({narrow, completed,selected}: {narrow:boolean; completed:readonly string[];selected:string}) {
  const compact=narrow
  const width=compact?360:760
  const height=compact?548:354
  return <svg className={'career-wires '+(compact?'career-wires-narrow':'career-wires-wide')}
    viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {edges.map(edge=>{
        const d=compact?edge.narrow:edge.wide
        const earned=completed.includes(edge.from)
        return <g key={edge.from+edge.to} className={'career-trace is-'+edge.track+(earned?' is-earned':'')+(selected===edge.to?' is-traced':'')}>
          <path d={d} className="career-conduit"/>
          <path d={d} className="career-trace-ink"/>
          {selected===edge.to && <path key={selected} d={d} pathLength="1" className="career-trace-flash"/>}
        </g>
      })}
      <g className="career-direction">
        {compact ? <path d="m88 170 3 4 3-4m172 0 3 4 3-4m-95 254 3 4 3-4"/>
          : <path d="m181 106 5 4-5 4m0 151 5 4-5 4m399-85 5 4-5 4"/>}
      </g>
      {compact
        ? <path className="career-port" d="M24 84h36m240 0h12l10 10h12"/>
        : <><path className="career-port" d="M17 110h43m-43 159h43m653-81h29"/><circle className="career-via" cx="745" cy="188" r="2.7"/></>}
    </g>
  </svg>
}

type ChartProps = {
  selected: MilestoneId
  completed: readonly MilestoneId[]
  recommended: MilestoneId | null
  onSelect: (id:MilestoneId) => void
}

export default function CareerChart({selected,completed,recommended,onSelect}: ChartProps) {
  const description=useId()
  return <div className="career-chart" role="group" aria-label="Interactive career milestones" aria-describedby={description}>
    <p id={description} className="career-chart-description">Spatial model leads to Benchmarks. Pipeline leads to Replay. Both routes meet at Navigator and finish with Release. Select a milestone for its plan.</p>
    <div className="career-chart-shell">
      <div className="career-board">
        <span className="career-rail-label research-rail" aria-hidden="true">Spatial research</span>
        <span className="career-rail-label automation-rail" aria-hidden="true">Automation</span>
        <Wiring narrow={false} completed={completed} selected={selected}/>
        <Wiring narrow completed={completed} selected={selected}/>
        {milestones.map(station=>{
          const {wide, narrow} = positions[station.id]
          const state:State=completed.includes(station.id)?'done':available(station.id,completed)?'ready':'upcoming'
          const next=station.id===recommended && state==='ready'
          const label=state==='done'?'Complete':next?'Up next':state==='ready'?'Ready':'Upcoming'
          const style={
            '--cx':wide[0]/760*100+'%', '--cy':wide[1]/354*100+'%',
            '--mx':narrow[0]/360*100+'%', '--my':narrow[1]/548*100+'%',
          } as CSSProperties
          const track=station.id==='automate'||station.id==='reproduce'?'automation':station.id==='model'||station.id==='bench'?'research':'combined'
          return <button key={station.id} type="button" className={'career-station is-'+track} style={style}
            aria-pressed={selected===station.id} aria-controls="career-milestone" aria-label={station.short+', '+label} data-station={station.id} data-state={state}
            onClick={()=>onSelect(station.id)}>
            <span className="career-socket"><svg viewBox="0 0 28 28" aria-hidden="true" fill="none"
              stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><StationIcon station={station.id}/></svg>
              {state==='done' && <span className="career-check" aria-hidden="true">✓</span>}
            </span>
            <strong>{station.short}</strong>
            <small>{label}</small>
          </button>
        })}
      </div>
    </div>
  </div>
}
