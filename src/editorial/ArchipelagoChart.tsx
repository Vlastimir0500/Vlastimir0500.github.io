import { useId } from 'react'

export type AtlasLayer = 'fields' | 'loops' | 'survey'
type Point = readonly [number, number]
type Island = { x: number; y: number; rx: number; ry: number; seed: number; angle: number }
const tau = 2 * Math.PI
const islands: Island[] = [
  { x: 164, y: 157, rx: 92, ry: 61, seed: 1.2, angle: -.36 },
  { x: 397, y: 197, rx: 52, ry: 35, seed: 4.5, angle: .28 },
  { x: 630, y: 261, rx: 74, ry: 57, seed: 7.8, angle: -.78 },
]

// Contours share a coast, then migrate toward a displaced summit as elevation increases.
function contourPoint(isle: Island, level: number, angle: number): Point {
  const { rx, ry, seed } = isle
  const fold = .15 * Math.cos(3 * angle + seed) + .105 * Math.sin(2 * angle - seed)
    + .078 * Math.cos(5 * angle + .6 * seed) + .044 * Math.sin(8 * angle - seed)
  const inlet = .035 * Math.sin(13 * angle + seed) + .021 * Math.cos(19 * angle - seed)
  const relief = Math.max(0, 1 - level)
  const r = level * (1 + fold + inlet / Math.max(1, level * level)
    + relief * .16 * Math.cos(4 * angle + level * 4 + seed))
  const x = rx * (r * Math.cos(angle) - .29 * relief + .11 * Math.sin(relief * Math.PI))
  const y = ry * (r * Math.sin(angle) - .23 * relief)
  return [isle.x + x * Math.cos(isle.angle) - y * Math.sin(isle.angle),
    isle.y + x * Math.sin(isle.angle) + y * Math.cos(isle.angle)]
}

const coords = ([x, y]: Point) => x.toFixed(1) + ' ' + y.toFixed(1)
function contour(isle: Island, level: number) {
  return Array.from({ length: 144 }, (_, i) =>
    (i ? 'L' : 'M') + coords(contourPoint(isle, level, i * tau / 144))).join('') + 'Z'
}

function engrave(isle: Island) {
  const paths = []
  for (let ring = 0; ring < 6; ring++) {
    const radius = .94 - .127 * ring
    const count = Math.round(radius * 81)
    for (let i = 0; i < count; i++) {
      const angle = (i + (ring % 2) * .5) * tau / count
      const slope = Math.sin(angle + isle.angle - .35)
      if (slope < -.2 && i % 3 !== 0) continue
      const length = .023 + .025 * (1 + slope) + .009 * Math.sin(2 * i + ring)
      paths.push('M' + coords(contourPoint(isle, radius, angle))
        + 'L' + coords(contourPoint(isle, radius - length, angle + .012)))
    }
  }
  return paths.join('')
}

const ground = islands.map(isle => ({
  sea: [1.82, 1.61, 1.44, 1.30, 1.18, 1.09, 1.035].map(r => contour(isle, r)),
  land: [1, .91, .79, .665, .54, .415, .29, .17, .07].map(r => contour(isle, r)),
  engraving: engrave(isle),
}))

const nodes: Point[] = [[76, 306], [161, 284], [240, 252], [287, 203],
  [328, 141], [409, 119], [499, 164], [498, 237], [416, 273], [344, 256],
  [559, 138], [650, 95]]
const legs = [[0, 1, 2, 3], [3, 4, 5, 6], [6, 7, 8, 9, 3], [6, 10, 11]]
const surveyStops = [0, 3, 6, 3, 11]
const fields: { center: Point; rx: number; ry: number; angle: number }[] = [
  { center: nodes[1], rx: 34, ry: 25, angle: -18 },
  { center: nodes[3], rx: 35, ry: 24, angle: -50 },
  { center: [302, 176], rx: 31, ry: 23, angle: -53 },
  { center: nodes[5], rx: 38, ry: 24, angle: 13 },
  { center: nodes[7], rx: 37, ry: 25, angle: -40 },
]

function routeCurve(indices: number[]) {
  const pts = indices.map(index => nodes[index])
  let result = 'M' + coords(pts[0])
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const prev = pts[Math.max(0, i - 2)], next = pts[Math.min(pts.length - 1, i + 1)]
    result += 'C' + coords([a[0] + (b[0] - prev[0]) / 6, a[1] + (b[1] - prev[1]) / 6])
      + ' ' + coords([b[0] - (next[0] - a[0]) / 6, b[1] - (next[1] - a[1]) / 6]) + ' ' + coords(b)
  }
  return result
}
const routes = legs.map(routeCurve)
const islandNames = [
  { x: 158, y: 69, name: 'Vesper Isle', discovered: 1 },
  { x: 395, y: 208, name: 'Keel Key', discovered: 2 },
  { x: 604, y: 350, name: 'Lantern Reach', discovered: 4 },
]
const descriptions: Record<AtlasLayer, string> = {
  fields: 'Five place fields mark locations along a water route. Two fields overlap in the western channel.',
  loops: 'A graph follows the navigable channels. Copper edges form a closed loop around the central island.',
  survey: 'A route survey gradually charts the channels from a southwest launch to a northeastern exit.',
}

export default function ArchipelagoChart({ layer, step }: { layer: AtlasLayer; step: number }) {
  const uid = 'atlas' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => uid + '-' + name
  const paint = (name: string) => 'url(#' + id(name) + ')'
  const surveyStep = Math.max(0, Math.min(4, Math.round(step)))
  const [x, y] = nodes[surveyStops[surveyStep]]
  return <svg className="archipelago-chart" viewBox="0 0 720 415" width="720" height="415"
    style={{ display: 'block', width: '100%', height: 'auto', overflow: 'hidden' }}
    role="img" aria-labelledby={id('title') + ' ' + id('desc')}>
    <title id={id('title')}>Archipelago route chart</title>
    <desc id={id('desc')}>{descriptions[layer]}{layer === 'survey' ? ' Observation ' + (surveyStep + 1) + ' of 5.' : ''}</desc>
    <defs>
      <linearGradient id={id('ocean')} x2=".84" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#1d373b"/><stop offset=".5" stopColor="#172d33"/><stop offset="1" stopColor="#102026"/>
      </linearGradient>
      <linearGradient id={id('land')} x1="0" y1="0" x2=".9" y2="1">
        <stop stopColor="#b6b39a"/><stop offset=".48" stopColor="#87988b"/><stop offset="1" stopColor="#657f78"/>
      </linearGradient>
      <radialGradient id={id('field')}>
        <stop stopColor="#a1f3dc" stopOpacity=".78"/><stop offset=".33" stopColor="#7be1c0" stopOpacity=".57"/>
        <stop offset=".71" stopColor="#79d6bc" stopOpacity=".23"/><stop offset="1" stopColor="#69c8aa" stopOpacity=".02"/>
      </radialGradient>
      <radialGradient id={id('survey-reveal')}>
        <stop offset=".38" stopColor="white"/><stop offset="1" stopColor="black"/>
      </radialGradient>
      <pattern id={id('grid')} width="48" height="48" patternUnits="userSpaceOnUse" x="24" y="15">
        <path d="M48 0H0V48" fill="none" stroke="#82afab" strokeWidth=".65" opacity=".31"/>
        <path d="M0 2.8V0H2.8" fill="none" stroke="#b3cac1" strokeWidth=".9" opacity=".42"/>
      </pattern>
      <g id={id('terrain')}>
        {ground.map((isle, i) => <g key={i}>
          {isle.sea.map((d, j) => <path key={j} d={d} fill={j === 2 ? '#77afa1' : 'none'}
            fillOpacity=".045" stroke="#83b4aa" strokeWidth={j % 3 === 0 ? 1.15 : .7} opacity={.22 + j * .065}/>)}
          <path d={isle.land[0]} fill={paint('land')} stroke="#d6d2b4" strokeWidth="1.6" strokeLinejoin="round"/>
          {isle.land.slice(1).map((d, j) => <path key={j} d={d} fill="#c1bda2" fillOpacity=".092"
            stroke={j % 3 === 0 ? '#445d55' : '#5b7265'} strokeWidth={j % 3 === 0 ? .95 : .72}/>)}
          <path d={isle.engraving} fill="none" stroke="#344e49" strokeWidth=".77" opacity=".75"/>
        </g>)}
      </g>
      {layer === 'survey' && <mask id={id('discovered')} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="415">
        <rect width="720" height="415" fill="black"/>
        {[0, ...legs.slice(0, surveyStep).flat()].map((index, i) => <circle key={i}
          cx={nodes[index][0]} cy={nodes[index][1]} r="127" fill={paint('survey-reveal')} style={{mixBlendMode:'screen'}}/>)}
      </mask>}
    </defs>
    <rect width="720" height="415" fill={paint('ocean')}/>
    <rect width="720" height="415" fill={paint('grid')}/>
    <g stroke="#9bbbaf" fill="none" strokeWidth=".7" opacity=".15">
      <path d="M0 377L674 0M2 415L523 0M0 243L720 48M0 303L720 19M123 415L688 0M64 0L720 354M0 19L720 406"/>
    </g>
    <use href={'#' + id('terrain')} opacity={layer === 'survey' ? .16 : 1}/>
    {layer === 'survey' && <use href={'#' + id('terrain')} mask={paint('discovered')}/>}
    <g fontFamily="var(--serif, Georgia, serif)" fontStyle="italic" fontSize="16" fill="#cfdbc9" textAnchor="middle"
      stroke="#1c3234" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" letterSpacing=".4"
      opacity=".9">
      {islandNames.filter(i => layer !== 'survey' || surveyStep >= i.discovered)
        .map(i => <text key={i.name} x={i.x} y={i.y}>{i.name}</text>)}
    </g>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {layer !== 'survey' && routes.map((d, i) => <path key={i} d={d} stroke="#d6bb95"
        strokeDasharray={layer === 'loops' ? '1.1 5' : '3 5'} strokeWidth="1.6" opacity={layer === 'fields' ? .78 : .34}/>)}
      {layer === 'fields' && <g>{fields.map(({ center, rx, ry, angle }, i) =>
        <g key={i} transform={'translate(' + center.join(' ') + ') rotate(' + angle + ')'}>
          <ellipse rx={rx} ry={ry} fill={paint('field')}/>
          {[1, .77, .52, .30].map((r, i) => <ellipse key={r} rx={rx * r} ry={ry * r} stroke="#abedd6"
            opacity={.56 + .08 * i} strokeWidth={i === 3 ? 1.3 : .95}/>)}
          <circle r="2.2" fill="#e1f4dc"/>
        </g>)}</g>}
      {layer === 'loops' && <g>
        <path d={'M' + [...legs[1], ...legs[2].slice(1)].map(index => coords(nodes[index])).join('L') + 'Z'}
          fill="#d49a62" fillOpacity=".085"/>
        {legs.map((leg, index) => <polyline key={index} points={leg.map(n => nodes[n].join(',')).join(' ')}
          stroke={index === 1 || index === 2 ? '#efb57e' : '#8ad6cd'} strokeWidth="2.6"/>)}
        {nodes.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={i === 3 || i === 6 ? 5.6 : 3.7}
          fill="#192e32" stroke={i >= 3 && i <= 9 ? '#efb57e' : '#95ded2'} strokeWidth="2"/>)}
      </g>}
      {layer === 'survey' && <g>
        {routes.slice(0, surveyStep).map((d, i) => <path key={i} d={d} stroke="#efb57e" strokeWidth="2.7"/>)}
        {surveyStep > 0 && <path key={'trace-' + surveyStep} className="atlas-new-leg"
          d={surveyStep === 4 ? routes[1] + routes[3] : routes[surveyStep - 1]}
          stroke="#ffe0a9" strokeWidth="2" pathLength="1"/>}
        {Array.from(new Set(surveyStops.slice(0, surveyStep + 1))).map(n =>
          <circle key={n} cx={nodes[n][0]} cy={nodes[n][1]} r="4.1" fill="#17282c" stroke="#edc393" strokeWidth="1.75"/>)}
        <g key={surveyStep} transform={'translate(' + x + ' ' + y + ')'}>
          <circle className="atlas-observed-stop" r="12" stroke="#f4cd97" opacity=".7"/>
          <circle r="3.6" fill="#ffdaa7"/>
          <path d="M-16 0h5m22 0h5M0-16v5m0 22v5" stroke="#f4cd97" strokeWidth="1.5"/>
        </g>
      </g>}
    </g>
    <g transform="translate(57 67)" fill="none" stroke="#c6c5ac" opacity=".88">
      <circle r="10" strokeWidth=".6"/><path d="M0-18L4 0 0 14-4 0Z" strokeWidth=".9"/>
      <path d="M0-18V0H-4Z" fill="#ded2ad" stroke="none"/><path d="M-14 0H14" strokeWidth=".7"/>
      <text x="0" y="-24" fill="#d4d5bd" stroke="none" textAnchor="middle" fontFamily="var(--mono,monospace)" fontSize="11">N</text>
    </g>
    <rect x="10" y="10" width="700" height="395" fill="none" stroke="#98b5ad" strokeOpacity=".4" strokeWidth=".8"/>
    <path d="M10 25V10h15M695 10h15v15M710 390v15h-15M25 405H10v-15" fill="none" stroke="#bac4ad" strokeWidth="1.6"/>
    <style>{`@media (prefers-reduced-motion: no-preference) {
      .atlas-observed-stop { animation: atlas-survey-fix 1.4s ease-out 2; transform-box:fill-box; transform-origin:center }
      @keyframes atlas-survey-fix { from {transform:scale(.62);opacity:.95} to {transform:scale(1);opacity:.7} }
      .atlas-new-leg { stroke-dasharray:1; animation:atlas-survey-trace 1.2s ease-out both }
      @keyframes atlas-survey-trace { from {stroke-dashoffset:1} to {stroke-dashoffset:0} }
    }`}</style>
  </svg>
}
