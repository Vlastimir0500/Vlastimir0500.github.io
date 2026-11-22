import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import ArchipelagoChart, { type AtlasLayer } from './ArchipelagoChart'
import CareerRoadmap from './career/CareerRoadmap'
import './future-work.css'

const proposals = [
  {
    layer: 'fields', label: 'Place fields', discipline: 'Computational neuroscience',
    question: 'Where am I between landmarks?',
    experiment: 'I’d send a simulated navigator through these channels. Each model neuron would respond most strongly near one location. On the return trip, a decoder would have to estimate position from those overlapping responses alone.',
    measure: 'Compare median position error with a navigator that only remembers its last landmark. Then thin out the landmarks to see where the estimate begins to drift.',
    legend: 'Overlapping fields along a water route',
    citation: 'O’Keefe & Dostrovsky, 1971', href: 'https://pubmed.ncbi.nlm.nih.gov/5124915/',
  },
  {
    layer: 'loops', label: 'Route topology', discipline: 'Topology',
    question: 'When does a route become a loop?',
    experiment: 'Two paths skirt opposite shores of Keel Key and meet at the same junction. I’d connect pairs of cells that fire together and fill in a triangle when three fire together. Does the reconstructed map have a hole where the island should be?',
    measure: 'Track how much sailing it takes to recover one stable loop. Repeat with shuffled firing times to see how often the same method invents a loop.',
    legend: 'Connected passages and the cycle around the central island',
    citation: 'Curto & Itskov, 2008', href: 'https://doi.org/10.1371/journal.pcbi.1000205',
  },
  {
    layer: 'survey', label: 'Map formation', discipline: 'Predictive maps',
    question: 'How does a voyage become a chart?',
    experiment: 'I’d build the chart one crossing at a time. For each junction, the navigator would tally which passages it visits afterward, giving earlier visits more weight. Returning to the same fork along the other shore would link two fragments of the chart.',
    measure: 'Close a familiar channel, then count how many new voyages it takes for predicted visits to agree with held-out journeys again.',
    legend: 'A chart assembled over five survey fixes',
    citation: 'Stachenfeld et al., 2017', href: 'https://doi.org/10.1038/nn.4650',
  },
] as const satisfies ReadonlyArray<{
  layer: AtlasLayer; label: string; discipline: string; question: string; experiment: string;
  measure: string; legend: string; citation: string; href: string
}>

const surveyLog = [
  'Depart from the southwest anchorage.',
  'Mark the fork at the western junction.',
  'Trace the north shore to the eastern passage.',
  'Return along the south shore and close the loop.',
  'Retrace the north shore, then sail through the northeast exit.',
]

export default function FutureWork() {
  const [active, setActive] = useState(0)
  const [fix, setFix] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const proposal = proposals[active]
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowLeft') next = (index + proposals.length - 1) % proposals.length
    else if (event.key === 'ArrowRight') next = (index + 1) % proposals.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = proposals.length - 1
    else return
    event.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }
  return <><CareerRoadmap/><section className="future-chapter" id="research-atlas" aria-labelledby="future-title">
    <div className="ed-inner">
      <p className="chapter-mark"><span>05</span><i aria-hidden="true" />Future work / Proposed studies</p>
      <header className="atlas-intro">
        <h2 id="future-title">An atlas from <em>memory.</em></h2>
        <p>In <cite>One Piece</cite>, Nami sets out to draw a map of the world. I’d start with three islands and a navigator that has never seen a chart. How much of the sea could it reconstruct from its own voyages?</p>
      </header>
      <div className="atlas-tabs" role="tablist" aria-label="Research proposal">
        {proposals.map((item, i) => <button key={item.layer} type="button" role="tab"
          id={'atlas-tab-' + item.layer} aria-controls="atlas-panel" aria-selected={i === active} tabIndex={i === active ? 0 : -1}
          ref={node => { tabs.current[i] = node }} onClick={() => setActive(i)} onKeyDown={e => navigate(e,i)}>{item.label}</button>)}
      </div>
      <div className="atlas-panel" id="atlas-panel" role="tabpanel" aria-labelledby={'atlas-tab-' + proposal.layer} tabIndex={0}>
        <figure className="atlas-figure">
          <div className="atlas-chart"><ArchipelagoChart layer={proposal.layer} step={fix} /></div>
          <figcaption>Fig. 009 <i>/</i> {proposal.legend}. Illustrative chart.</figcaption>
          {proposal.layer === 'survey' && <div className="survey-log">
            <label htmlFor="survey-fix">Survey fix <span>{fix + 1} / {surveyLog.length}</span></label>
            <input id="survey-fix" type="range" min="1" max={surveyLog.length} step="1" value={fix + 1}
              aria-valuetext={'Fix ' + (fix + 1) + '. ' + surveyLog[fix]} onChange={e => setFix(Number(e.target.value) - 1)} />
            <p>{surveyLog[fix]}</p>
          </div>}
        </figure>
        <article className="atlas-proposal">
          <p className="category">{proposal.discipline}</p>
          <h3>{proposal.question}</h3>
          <p>{proposal.experiment}</p>
          <h4>What I’d measure</h4>
          <p>{proposal.measure}</p>
          <a className="atlas-reading" href={proposal.href}>{proposal.citation}<ArrowUpRight size={15} aria-hidden="true" /></a>
        </article>
      </div>
    </div>
  </section></>
}
