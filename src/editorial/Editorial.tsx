import { useState } from 'react'
import { Github } from 'lucide-react'
import WorkPlate from './WorkPlate'
import FutureWork from './FutureWork'
import './editorial.css'

const github = 'https://github.com/Vlastimir0500'
const studies = [
  { name: 'Q-CyberSelect', category: 'Quantum optimization', kind: 'graph', repo: 'Q-CyberSelect',
    caption: 'Feature graph · selected vertices', tools: ['QAOA', 'QUBO', 'UNSW-NB15'],
    summary: 'A graph-based search for compact intrusion-detection features. The study compares quantum and classical selectors on the same network data.',
    detail: 'The final evaluation retained four of 42 predictors. Held-out tests showed comparable classical alternatives, giving the selection method a concrete baseline.' },
  { name: 'Prompt Shield', category: 'AI security', kind: 'filter', repo: 'prompt-shield',
    caption: 'Prompt classification · input filter', tools: ['Prompt analysis', 'Risk classification'],
    summary: 'A browser-based prototype for inspecting untrusted prompts. It identifies suspicious instructions and explains the signals behind a risk assessment.',
    detail: 'The research interface brings the prompt, its classification and the explanation into one view so a reviewer can examine how the assessment was reached.' },
  { name: 'Hawkes-OFI Market Microstructure', category: 'Market microstructure', kind: 'events', repo: 'hawkes-ofi-market-microstructure',
    caption: 'Trade arrivals · intensity decay', tools: ['Hawkes processes', 'Order flow'],
    summary: 'Does trade clustering add predictive information beyond order-flow imbalance? This study tests short-horizon BTCUSDT returns across separate market episodes.',
    detail: 'The pipeline reconstructs the order book from snapshots and depth updates. Buy and sell arrivals feed an event model that is compared with the order-flow baseline out of sample.' },
  { name: 'Adaptive-DRST', category: 'Machine learning', kind: 'shift', repo: 'Adaptive-drst',
    caption: 'Domain shift · source and target', tools: ['Domain adaptation', 'Reliability'],
    summary: 'A study of self-training across changing data distributions. It examines when a shifted prediction is reliable enough to use and when it warrants validation.',
    detail: 'Experiments connect distributionally robust adaptation with scientific prediction. The reliability layer examines support and uncertainty to guide which predictions receive further validation.' },
] as const

const references = [
  { name: 'MORPH instruction set', type: 'Architecture specification', url: github + '/MORPH/blob/submission/morph-x-2027/docs/isa_v2.md', text: 'Instruction fields, reserved bits, and state transitions for the temporal engine.' },
  { name: 'Estimator validity', type: 'Numerical methods', url: github + '/mc-ad-greeks#why-estimator-validity-matters', text: 'A digital option illustrates how a low-variance pathwise derivative can miss the payoff boundary.' },
  { name: 'Real-return tail index', type: 'Statistical research', url: github + '/real-return-tail-index', text: 'Threshold diagnostics and bootstrap uncertainty for extreme inflation-adjusted S&P 500 returns.' },
]

function Tags({ items }: { items: readonly string[] }) {
  return <ul className="tech-tags" aria-label="Technical categories">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

function Chapter({ number, name }: { number: string; name: string }) {
  return <p className="chapter-mark"><span>{number}</span><i aria-hidden="true" />{name}</p>
}

function SelectedWork() {
  return <section className="work-chapter paper" id="work" aria-labelledby="work-title">
    <div className="ed-inner">
      <Chapter number="01" name="Project archive" />
      <header className="chapter-head"><h2 id="work-title">Selected <em>work.</em></h2><a className="source-link" href={github + '?tab=repositories'}>All repositories</a></header>
      <article className="feature-project">
        <figure><div className="project-art"><WorkPlate kind="hardware" /></div><figcaption>Fig. 02 <i>/</i> MORPH package, exploded assembly concept</figcaption></figure>
        <div className="feature-copy"><p className="category">Digital hardware</p><h3>MORPH</h3>
          <p className="feature-lead">One fabric speaks multiple wire protocols.</p>
          <p className="project-summary">A programmable engine turns timing requirements into pin-level operations. The design runs from cycle-exact models through formal checks and chip layout.</p>
          <Tags items={['SystemVerilog', '16-bit instructions', '8 protocol pins']} />
          <a className="source-link" href={github + '/MORPH'}>View MORPH on GitHub</a>
        </div>
      </article>
      <article className="feature-project feature-reversed">
        <figure><div className="project-art"><WorkPlate kind="paths" /></div><figcaption>Fig. 03 <i>/</i> Simulated price paths, illustrative study</figcaption></figure>
        <div className="feature-copy"><p className="category">Computational finance</p><h3>Monte Carlo <br />AD Greeks</h3>
          <p className="feature-lead">Which derivative estimator earns its cost?</p>
          <p className="project-summary">A JAX library compares pathwise, likelihood-ratio, and finite-difference estimates of option sensitivities. Its selector checks mathematical validity before weighing variance and runtime.</p>
          <Tags items={['JAX', 'Automatic differentiation', 'Monte Carlo']} />
          <a className="source-link" href={github + '/mc-ad-greeks'}>View Monte Carlo AD Greeks on GitHub</a>
        </div>
      </article>
    </div>
  </section>
}

function ProjectStudies() {
  const [active, setActive] = useState(0)
  const study = studies[active]
  return <section className="studies-chapter" id="studies" aria-labelledby="studies-title">
    <div className="ed-inner">
      <Chapter number="02" name="Technical work" />
      <header className="chapter-head"><h2 id="studies-title">Project <em>studies.</em></h2></header>
      <div className="study-desk">
        <div className="study-index" role="group" aria-label="Choose a project study">
          {studies.map((item,i) => <button key={item.repo} type="button" aria-controls="project-study" aria-pressed={i === active} onClick={() => setActive(i)}>
            <span className="study-id">0{i+1}</span><span><small>{item.category}</small><strong>{item.name}</strong></span><span className="selection-mark" aria-hidden="true" />
          </button>)}
        </div>
        <article className="study-sheet" id="project-study" aria-live="polite" aria-atomic="true">
          <div key={study.repo} className="study-sheet-inner">
            <figure><div className="study-art"><WorkPlate kind={study.kind} /></div><figcaption>Fig. 0{active+4} <i>/</i> {study.caption}</figcaption></figure>
            <h3>{study.name}</h3><p className="project-summary">{study.summary}</p>
            <Tags items={study.tools} />
            <div className="sheet-actions"><a className="source-link" href={github + '/' + study.repo}>View repository</a>
              <details><summary>Method notes</summary><p>{study.detail}</p></details></div>
          </div>
        </article>
      </div>
    </div>
  </section>
}

export default function Editorial() {
  return <div className="ed-content"><SelectedWork /><ProjectStudies />
    <section className="notes-chapter paper" id="research" aria-labelledby="notes-title"><div className="ed-inner">
      <Chapter number="03" name="Reading room" />
      <div className="notes-layout"><header className="chapter-head"><h2 id="notes-title">Research <br /><em>notes.</em></h2></header>
        <div>{references.map(item => <a key={item.url} className="reference-row" href={item.url}>
          <span className="category">{item.type}</span><h3>{item.name}</h3><p>{item.text}</p><span className="source-link">Read reference</span>
        </a>)}</div>
      </div>
    </div></section>
    <FutureWork />
    <section className="contact-chapter" id="contact" aria-labelledby="contact-title"><div className="ed-inner">
      <Chapter number="05" name="Contact" />
      <div className="contact-layout"><header className="chapter-head"><h2 id="contact-title">On <em>GitHub.</em></h2></header>
        <div><p>Explore the source, follow ongoing experiments, or open a project discussion through the relevant repository.</p>
          <a className="profile-action" href={github}><Github size={18} aria-hidden="true" />Vlastimir0500</a>
        </div>
      </div>
    </div></section>
  </div>
}
