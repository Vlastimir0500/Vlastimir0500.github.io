import { useState } from 'react'
import { ProjectTitle } from './ProjectTour'
import { Choices, ExhibitHeading, github, ModelFigure, PlotFrame } from './ExhibitParts'

const repo = github + 'MORPH'
const source = repo + '/blob/submission/morph-x-2027/'
const notes = [
  { title: 'Architecture', sub: 'Eight pins, one instruction engine.', body: 'A synchronizer feeds a change recorder. The host converts a trace or timing contract into 16-bit instructions. A 64-word memory feeds the fetch and execute states that drive, sample or release each pin.', label: 'Inspect the V2 instruction set', href: source + 'docs/isa_v2.md' },
  { title: 'Verification', sub: 'What happens to the pins on a fault?', body: 'Independent Python models check schedules against intended edges. Cocotb exercises the RTL. Two formal properties check output gating and fault release. The referenced qualification run records 31 passing top-level RTL tests.', label: 'Read the qualification evidence', href: repo + '#what-actually-works' },
  { title: 'Physical layout', sub: 'From RTL to routed geometry.', body: 'The IHP SG13CMOS5L flow fits an 8 × 4 Tiny Tapeout allocation. The documented CI run passed GDS precheck and a post-route gate. The 50 MHz clock is a design constraint. The physical evidence is a routed layout.', label: 'Inspect the routed GDS evidence', href: repo + '#physical-design' },
  { title: 'Protocols', sub: 'Change the program to change the waveform.', body: 'The repository includes UART byte transfers, four SPI modes and selected I²C addressing tests. Pulse Link exercises four pins using eight explicitly scheduled transitions. Scrub the fixture to see each event.', label: 'Open the Pulse Link self-test', href: source + 'examples/morph_x_pulse_link_challenge.json' },
  { title: 'Timing limits', sub: 'Some edge spacings cannot be emitted.', body: 'A DRIVE instruction updates one pin. Two different pins cannot change in one cycle, and gaps of one or three cycles are unreachable for this replay engine. The compiler rejects a request when those edges cannot fit.', label: 'Read the scheduling contract', href: source + 'docs/MORPH_X_MULTIPIN_V05.md' },
]
// Exact cycle, pin and post-edge level from SELFTEST-PULSE-LINK-01.
const events = [[0,0,1],[6,1,1],[12,2,1],[18,2,0],[24,3,1],[30,3,0],[36,1,0],[42,0,0]] as const
const xAt = (cycle: number) => 58 + cycle * 10
function waveform(pin: number) {
  const baseline = 33 + pin * 33
  let d = 'M44 ' + baseline
  for (const [cycle, changed, level] of events) {
    if (changed === pin) d += ' H' + xAt(cycle) + ' V' + (baseline - 18 * level)
  }
  return d + ' H510'
}

function PulseTrace() {
  const [index, setIndex] = useState(3)
  const [cycle,pin,level] = events[index]
  const active = [0,0,0,0]
  for (const [,changed,value] of events.slice(0,index + 1)) active[changed] = value
  return <div className="bench-panel scope">
    <div className="bench-caption"><span>Pulse Link self-test</span><span>4 digital pins</span></div>
    <PlotFrame label={'Digital event at cycle ' + cycle + ', pin ' + pin + ' becomes ' + (level ? 'high' : 'low')}>
      {active.map((val, line) => <g key={line}>
        <text x="4" y={31 + line * 33} className="plot-label">{'P' + line}</text>
        <path d={waveform(line)} className={'plot-stroke ' + (line === pin ? 'plot-copper' : 'plot-teal')} />
        <circle cx={xAt(cycle)} cy={33 + line * 33 - val * 18} r={line === pin ? 4 : 2.5} fill="currentColor" />
      </g>)}
      <path d={'M' + xAt(cycle) + ' 9V145'} className="plot-cursor" />
      <text x="55" y="165" className="plot-label">0</text><text x="418" y="165" className="plot-label">42 cycles</text>
    </PlotFrame>
    <label className="scope-control"><span>Event {index + 1} / 8</span><input type="range" min="1" max="8"
      aria-label="Pulse Link event" value={index + 1} onChange={e => setIndex(Number(e.target.value) - 1)} />
      <output>{'C' + String(cycle).padStart(2,'0') + ' · P' + pin + (level ? ' high' : ' low')}</output></label>
  </div>
}

export default function Silicon() {
  const [active, setActive] = useState(0)
  const note = notes[active]
  return <section id="work" className="paper exhibit-chapter silicon-chapter" aria-label="Silicon">
    <div className="ed-inner"><ExhibitHeading number="02" topic="Silicon" title="From logic" accent="to reality." />
      <article className="feature-project chip-feature" data-companion-stop>
        <ModelFigure kind="hardware" number="003" caption="MORPH package, exploded assembly concept" cue="chip" />
        <div className="feature-copy"><p className="category">Programmable digital hardware</p><ProjectTitle kind="hardware">MORPH</ProjectTitle>
          <p className="feature-lead">One fabric speaks multiple wire protocols.</p>
          <p className="project-summary">The timing of an edge can carry as much information as the level on a wire. MORPH turns a sequence of edges into a bounded program that a small digital engine can execute cycle by cycle.</p>
          <ul className="tech-tags"><li>SystemVerilog</li><li>16-bit instructions</li><li>8 protocol pins</li></ul>
          <a className="source-link" href={repo}>View MORPH on GitHub</a>
        </div>
      </article>
      <div className="silicon-bench">
        <div className="chip-notes"><Choices label="MORPH engineering topic" choices={notes.map(n => n.title)} value={active} onChange={setActive}/>
          <div key={active} className="topic-text"><h4>{note.sub}</h4><p>{note.body}</p><a className="source-link" href={note.href}>{note.label}</a></div>
        </div>
        <PulseTrace />
      </div>
    </div>
  </section>
}
