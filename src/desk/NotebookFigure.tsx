import { useId } from 'react'

export type SketchKind = 'tail' | 'edge' | 'loop'
type Point = readonly [number, number]
const teal = '#426e6b'
const copper = '#a26742'
const graphite = '#525d5d'
const tau = 2 * Math.PI
const xy = ([x,y]: Point) => x.toFixed(2) + ',' + y.toFixed(2)
const path = (points: readonly Point[]) => 'M' + points.map(xy).join('L')

// Deterministic positive losses, generated solely for this threshold sketch.
const sortedLosses = Array.from({length: 45}, (_, index) => {
  const rank = (index + .55) / 45
  return Math.pow(1 - rank, -1 / 2.4) * (1 + .10 * Math.sin(7 * rank) + .045 * Math.sin(24 * rank))
}).sort((a,b) => b-a)

export function hillEstimate(k: number) {
  const threshold = sortedLosses[k]
  const sum = sortedLosses.slice(0,k).reduce((value, loss) => value + Math.log(loss / threshold), 0)
  return k / sum
}
const lossX = (loss: number) => 33 + Math.log(loss) / Math.log(sortedLosses[0]) * 231
const exceedY = (index: number) => 112 - Math.log(index + 1) / Math.log(sortedLosses.length) * 83
const lossPoints: Point[] = sortedLosses.map((loss,i) => [lossX(loss),exceedY(i)])

function TailSketch({ k }: { k: number }) {
  const threshold = lossX(sortedLosses[k])
  return <>
    <path d="M31 23V118H269" fill="none" stroke={graphite} strokeWidth=".8"/>
    <path d={path(lossPoints)} fill="none" stroke={graphite} strokeWidth="1.2"/>
    <path d={'M'+threshold+' 25V118'} fill="none" stroke={copper} strokeWidth="1.1" strokeDasharray="3 3"/>
    <path d={path(lossPoints.slice(0,k+1))} fill="none" stroke={copper} strokeWidth="2.1"/>
    {lossPoints.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i<k?2.25:1.5} fill={i<k?copper:teal}/>)}
    <g fill={graphite} fontSize="9" fontFamily="var(--mono,monospace)">
      <text x="33" y="18">log P(X ≥ x)</text><text x="269" y="134" textAnchor="end">log loss</text>
    </g>
  </>
}

// Project a ruled Möbius strip. A point on the boundary returns after 4π.
function band(u: number, v: number): Point {
  const radius = 1 + .31*v*Math.cos(u/2)
  const x = radius*Math.cos(u), y = radius*Math.sin(u), z = .51*v*Math.sin(u/2)
  return [150 + 84*x + 13*y, 73 + 31*y - 35*z - 8*x]
}
const strips = Array.from({length: 13}, (_,v) =>
  path(Array.from({length: 97}, (_,i)=>band(i*tau/96, -1+v/6))))
const ribs = Array.from({length: 52}, (_,i) => path([band(i*tau/52,-1),band(i*tau/52,1)]))
function EdgeSketch({ turns }: { turns: number }) {
  const u = turns*tau
  const [x,y] = band(u,1)
  const previous = Math.max(0,u-.92)
  const trace = path(Array.from({length: 30},(_,i)=>band(previous+(u-previous)*i/29,1)))
  return <>
    <g fill="none" stroke={teal} opacity=".66" strokeWidth=".64">{strips.map((d,i)=><path d={d} key={i}/>)}</g>
    <g fill="none" stroke={graphite} opacity=".48" strokeWidth=".62">{ribs.map((d,i)=><path d={d} key={i}/>)}</g>
    <path d={strips[0]+strips[12]} stroke={teal} fill="none" strokeWidth="1.25"/>
    <path d={trace} stroke={copper} strokeWidth="3.3" fill="none"/>
    <circle cx={x} cy={y} r="5.8" stroke={copper} fill="#eae5d9" strokeWidth="1.35"/>
    <circle cx={x} cy={y} r="2.3" fill={copper}/>
  </>
}

const stations: Point[] = [[49,98],[83,68],[136,35],[196,42],[235,77],[194,108],[130,103]]
function CognitiveSketch({ closed }: { closed: boolean }) {
  const coast = 'M113 72Q117 62 126 60Q135 59 143 53Q154 46 165 53Q176 59 185 58Q194 63 193 70Q188 77 177 79Q164 89 154 84Q143 78 132 83Q120 82 113 72Z'
  return <>
    <g fill="none" stroke={teal} opacity=".45">{[1.35,1.18,1,.85,.65,.43].map(s=>
      <path key={s} d={coast} transform={'translate(153 69) scale('+s+') translate(-153 -69)'} strokeWidth={s===1?1.7:.65} fill={s===1?'#b9c4b3':'none'}/>)}</g>
    <path d={path(stations)} fill="none" stroke={teal} strokeWidth="1.9"/>
    {closed && <path d={path([stations[6],stations[1]])} fill="none" stroke={copper} strokeWidth="2.6"/>}
    {stations.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i===1?4.8:3.2} fill="#ede7db" stroke={i===1?copper:teal} strokeWidth="1.5"/>)}
    <text x="249" y="118" textAnchor="end" fill={graphite} fontFamily="var(--mono,monospace)" fontSize="10">β₁ = {closed ? 1 : 0}</text>
  </>
}

export default function NotebookFigure({kind, value}: {kind: SketchKind; value: number}) {
  const id = useId().replace(/[^a-z0-9_-]/gi,'')
  const title = {
    tail: 'Log survival curve for a synthetic positive-loss sample with the selected exceedances in copper.',
    edge: 'Projected Möbius strip. A copper marker tracks a point along its single boundary.',
    loop: value ? 'Seven stations with a closed passage around the island.' : 'Seven stations on an open route around the island.',
  }[kind]
  return <svg className="notebook-figure" viewBox="0 0 300 145" role="img" aria-label={title}>
    <defs><pattern id={'paper-grid-'+id} width="15" height="15" patternUnits="userSpaceOnUse">
      <path d="M15 0H0V15" fill="none" stroke="#78968a" strokeWidth=".55" opacity=".37"/>
    </pattern></defs>
    <rect width="300" height="145" fill={'url(#paper-grid-'+id+')'}/>
    {kind==='tail' && <TailSketch k={value}/>}
    {kind==='edge' && <EdgeSketch turns={value}/>}
    {kind==='loop' && <CognitiveSketch closed={Boolean(value)}/>}
  </svg>
}
