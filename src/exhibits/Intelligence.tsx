import { useState } from 'react'
import { ProjectTitle, useProjectTour } from './ProjectTour'
import { Choices, ExhibitHeading, github, MethodNotes, ModelFigure, PlotFrame } from './ExhibitParts'

const projects = [
  { name:'Q-CyberSelect', repo:'Q-CyberSelect', kind:'graph', fig:'006', category:'Quantum optimization',
    hook:'Which four features carry the signal?', caption:'Feature-selection graph, conceptual projection',
    summary:'A binary optimization problem trades predictive relevance against redundant traffic features. The selected subset then goes to a conventional classifier.',
    architecture:'A graph-structured QUBO encodes relevance, redundancy and subset size. QAOA samples candidate solutions on controlled instances.',
    challenge:'The quality of a compact feature set depends on how it generalizes after all selector choices have been frozen.',
    method:'The study checks small problems against exact optimization and compares selectors on a locked UNSW-NB15 split with the same downstream classifier.',
    result:'The four-feature QAOA subset achieved a held-out F1 of 0.829. The four-feature mutual-information baseline reached 0.908.', ref:'#locked-test-results', label:'Locked test results' },
  { name:'Adaptive-DRST', repo:'Adaptive-drst', kind:'shift', fig:'007', category:'Reliability under shift',
    hook:'Which predictions deserve a second look?', caption:'Source and target distributions, illustrative projection',
    summary:'A point can look familiar and still be wrong. This study trains a second model to rank the expected error of scientific predictions after the data distribution changes.',
    architecture:'A source-trained predictor feeds uncertainty and neighborhood signals into a separate risk model trained on out-of-fold source errors.',
    challenge:'A domain classifier measures how distinguishable two domains are. That score alone can miss the predictions with the largest errors.',
    method:'Freeze predictions and risk rankings before examining target labels. Then evaluate error as progressively more predictions are accepted.',
    result:'On the lake-water to secondary-effluent shift, the lowest-risk quarter had mean absolute error 3.075, versus 10.433 for all 140 target observations.', ref:'#final-results', label:'Reliability-layer results' },
  { name:'Prompt Shield', repo:'prompt-shield', kind:'filter', fig:'008', category:'AI security',
    hook:'What made this instruction suspicious?', caption:'Input, assessment and review, conceptual filter assembly',
    summary:'A browser-based research prototype gives a reviewer the suspicious category, risk assessment and reasoning behind a prompt classification.',
    architecture:'The documented flow takes prompt input through a scanner, a threat assessment and an explanatory report. The dashboard includes scan history and export.',
    challenge:'Text retrieved for analysis can contain instructions of its own. Reviewers need to see the origin and meaning of a signal before acting on it.',
    method:'The prototype separates classification from the reason cited for the flag. A reviewer can inspect both alongside the original input.',
    result:'The repository documents a working prototype and its detection taxonomy. A measured detection-rate benchmark remains open.', ref:'#architecture', label:'Architecture and research scope' },
] as const

const selections = [
  { name:'QAOA', features:['sttl','ct_state_ttl','dload','rate'], f1:'.829', recall:'.896' },
  { name:'Mutual information', features:['dttl','dbytes','sttl','sbytes'], f1:'.908', recall:'.945' },
  { name:'Random forest', features:['rate','sload','ct_state_ttl','sttl'], f1:'.879', recall:'.959' },
]
const predictors = ['dttl','dbytes','sttl','sbytes','dload','ct_state_ttl','rate','sload']
function SelectionLab() {
  const [active,setActive] = useState(0)
  const selection = selections[active]
  return <div className="ai-console">
    <Choices label="Feature selector" choices={selections.map(s=>s.name)} value={active} onChange={setActive}/>
    <ul aria-label={'Four features chosen by ' + selection.name} className="feature-bits">
      {predictors.map(name=><li key={name} data-on={selection.features.includes(name)}><i aria-hidden="true"/>{name}
        <span className="exhibit-sr">{selection.features.includes(name)?', selected':', omitted'}</span></li>)}
    </ul>
    <p className="experiment-reading"><b>{selection.f1}</b> held-out F1 <span> / </span><b>{selection.recall}</b> recall</p>
    <p className="data-note">Observed results · four of 42 predictors selected · union of displayed subsets shown</p>
  </div>
}

const errors = [[3.075,4.306,6.940,10.433],[.268,.425,2.219,3.582]]
const calibration = [{p:.18, n:6, ok:1},{p:.38,n:8,ok:3},{p:.62,n:6,ok:4},{p:.85,n:10,ok:7}]
function ReliabilityLab() {
  const [view,setView] = useState(0)
  const [target,setTarget] = useState(0)
  const [bin,setBin] = useState(2)
  const observed = errors[target]
  const pts = observed.map((error,i)=>[65 + 138*i,143 - 11*error])
  const xy = (p:number,f:number) => [47 + p*445,143 - f*122]
  const sample = calibration[bin]
  return <div className="ai-console">
    <Choices label="Reliability diagram" choices={['Risk and coverage','Calibration','Neural baseline']} value={view} onChange={setView}/>
    {view===0 && <>
      <PlotFrame label="Published mean absolute error as the share of accepted targets increases">
        <polyline points={pts.map(p=>p.join(',')).join(' ')} className="plot-stroke plot-teal" />
        {pts.map(([x,y],i)=><g key={x}><circle cx={x} cy={y} r="3.5" fill="#dfb38d"/><text x={x} y={y-7} textAnchor="middle" className="plot-label">{observed[i].toFixed(3)}</text>
          <text x={x} y="166" textAnchor="middle" className="plot-label">{(i+1)*25}%</text></g>)}
      </PlotFrame>
      <Choices label="Target domain" choices={['Secondary effluent','Ground water']} value={target} onChange={setTarget}/>
      <p className="data-note">Reported target mean absolute error by accepted share, ranked from lowest risk upward.</p>
    </>}
    {view===1 && <>
      <PlotFrame label="Illustrative calibration diagram comparing predicted probability and observed frequency">
        <path d="M47 143L492 21" className="plot-cursor"/>
        <polyline points={calibration.map(k=>xy(k.p,k.ok/k.n).join(',')).join(' ')} className="plot-stroke plot-teal"/>
        {calibration.map((k,i)=>{const [x,y]=xy(k.p,k.ok/k.n);return <circle key={k.p} cx={x} cy={y} r={i===bin?6:3} fill={i===bin?'#e9b68b':'#8ab9bc'}/>})}
        <text x="47" y="165" className="plot-label">0</text><text x="490" y="165" className="plot-label">1</text>
      </PlotFrame>
      <label className="scope-control"><span>Probability bin</span><input type="range" min="1" max="4" value={bin+1} aria-label="Calibration probability bin" onChange={e=>setBin(Number(e.target.value)-1)}/><output>{bin+1} / 4</output></label>
      <p className="data-note">Teaching example · estimated probability {(sample.p*100).toFixed(0)}% · observed {sample.ok} of {sample.n}. The diagonal marks exact calibration.</p>
    </>}
    {view===2 && <>
      <PlotFrame label="Conceptual domain-adversarial network with shared network features leading to a task head and a domain head">
        {[[37,56,142,38],[37,56,142,82],[37,106,142,82],[37,106,142,126],[142,38,252,63],[142,82,252,63],[142,82,252,104],[142,126,252,104],[252,63,366,44],[252,63,366,121],[252,104,366,44],[252,104,366,121]].map(([a,b,c,d])=><path key={[a,b,c,d].join('-')} d={`M${a} ${b}L${c} ${d}`} className="plot-strand"/>)}
        {[[37,56],[37,106],[142,38],[142,82],[142,126],[252,63],[252,104],[366,44],[366,121]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="5" fill={x===366?'#d6a884':'#8abdbc'}/>)}
        <text x="381" y="48" className="plot-label">Task head</text><text x="381" y="125" className="plot-label">Domain head</text>
      </PlotFrame>
      <p className="data-note">Conceptual DANN baseline. Both heads share features. In the documented secondary-effluent test, near-chance domain discrimination still left the source-only random forest ahead on target error.</p>
    </>}
  </div>
}

const review = [
  { title:'Input', headline:'Keep the source visible.', detail:'A visitor asks for a document summary. The retrieved document includes a passage that appears to give a competing instruction. The two pieces of text have different origins.' },
  { title:'Assessment', headline:'Identify the boundary crossing.', detail:'The scanner can classify language in retrieved material as a possible indirect injection. An analyst examines the passage in its original context alongside the stated task.' },
  { title:'Report', headline:'Explain the flag.', detail:'The report groups the finding by category and puts its rationale beside the input. A reviewer can decide whether the flagged passage is relevant to the legitimate request.' },
]
function ReviewLab() {
  const [stage,setStage] = useState(0)
  return <div className="ai-console"><Choices label="Defensive review stage" choices={review.map(r=>r.title)} value={stage} onChange={setStage}/>
    <ol className="trust-route" aria-label="Prompt review flow">{review.map((r,i)=><li key={r.title} aria-current={i===stage?'step':undefined}>{r.title}</li>)}</ol>
    <h5>{review[stage].headline}</h5><p>{review[stage].detail}</p><p className="data-note">Illustrated review of untrusted document text</p>
  </div>
}

export default function Intelligence() {
  const [active,setActive] = useState(0)
  const guide=useProjectTour()
  const item = projects[active]
  const repo = github + item.repo
  return <section id="intelligence" className="studies-chapter exhibit-chapter intelligence-chapter" aria-label="Intelligence"><div className="ed-inner">
    <ExhibitHeading number="04" topic="Intelligence" title="Intelligence needs" accent="more than accuracy."/>
    <div className="study-desk" id="studies">
      <div className="study-index" role="group" aria-label="Choose an intelligence exhibit">{projects.map((project,i)=>
        <button type="button" key={project.repo} aria-controls="project-study" aria-pressed={i===active} onClick={e=>{setActive(i);guide.start(project.kind,e.currentTarget)}}>
          <span className="study-id">0{i+1}</span><span><small>{project.category}</small><strong>{project.name}</strong></span><span className="selection-mark" aria-hidden="true"/>
        </button>)}</div>
      <article className="study-sheet" id="project-study" data-companion-stop><div key={active} className="study-sheet-inner">
        <ModelFigure kind={item.kind} number={item.fig} caption={item.caption} cue="network"/>
        <ProjectTitle kind={item.kind}>{item.name}</ProjectTitle><p className="ai-hook">{item.hook}</p><p className="project-summary">{item.summary}</p>
        <a className="source-link" href={repo}>View {item.name} on GitHub</a>
        {active===0?<SelectionLab/>:active===1?<ReliabilityLab/>:<ReviewLab/>}
        <MethodNotes architecture={item.architecture} challenge={item.challenge} method={item.method} result={item.result} source={repo+item.ref} label={item.label}/>
      </div></article>
    </div>
  </div></section>
}
