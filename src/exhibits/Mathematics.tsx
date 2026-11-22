import { useState } from 'react'
import { ProjectTitle, useProjectTour } from './ProjectTour'
import { Choices, ExhibitHeading, github, MethodNotes, ModelFigure, PlotFrame } from './ExhibitParts'
import { estimateDelta, pricePaths } from './financeMath'

const mcRepo = github + 'mc-ad-greeks'
const hawkesRepo = github + 'hawkes-ofi-market-microstructure'
const xAt = (fraction: number) => 29 + 472 * fraction
const signed = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2)

function DeltaConsole() {
  const [vol, setVol] = useState(20)
  const [payoff, setPayoff] = useState(0)
  const paths = pricePaths(vol / 100)
  const delta = estimateDelta(vol / 100, payoff === 0 ? 'call' : 'digital')
  const min = Math.floor(Math.min(...paths.flat()) / 10) * 10
  const max = Math.ceil(Math.max(...paths.flat()) / 10) * 10
  const yAt = (price: number) => 143 - 124 * (price - min) / (max - min)
  const line = (path: number[]) => path.map((v,i) => (i ? 'L' : 'M') + xAt(i / (path.length - 1)).toFixed(2) + ' ' + yAt(v).toFixed(2)).join(' ')
  return <div className="quant-workbench" data-companion="graph">
    <div className="bench-panel">
      <div className="bench-caption"><span>Simulated price paths</span><span>1 year · fixed seed</span></div>
      <PlotFrame label={'Twelve geometric Brownian motion paths at ' + vol + ' percent annual volatility'}>
        {paths.slice(1).map((path,i) => <path key={i} d={line(path)} className="plot-strand" />)}
        <path d={'M29 ' + yAt(100) + 'H501'} className="plot-cursor" />
        <path d={line(paths[0])} data-companion-trace className="plot-stroke plot-copper" />
        <text x="29" y="164" className="plot-label">Today</text><text x="459" y="164" className="plot-label">1 year</text>
        <text x="532" y="22" textAnchor="end" className="plot-label">{max}</text><text x="532" y="141" textAnchor="end" className="plot-label">{min}</text>
      </PlotFrame>
      <label className="scope-control"><span>Volatility</span><input type="range" min="10" max="40" step="1" value={vol}
        aria-label="Annual volatility" aria-valuetext={vol + ' percent'} onChange={e => setVol(Number(e.target.value))} /><output>{vol}%</output></label>
    </div>
    <div className="lab-reading"><h4>What is one more unit of spot worth?</h4>
      <Choices label="Option payoff" choices={['Vanilla call','Cash digital']} value={payoff} onChange={setPayoff}/>
      <p>{payoff === 0 ? 'A call pays the amount above the strike. At expiry the slope changes from zero to one. Here, each simulated path carries its own contribution back to today’s Delta.' : 'A cash digital pays one unit above the strike. Its sampled slope is zero almost everywhere. The likelihood-ratio estimate uses each normal draw to weight the probability of finishing above the threshold.'}</p>
      <div className="readout-pair"><div><small>{payoff === 0 ? 'Pathwise Delta' : 'Likelihood-ratio Delta'}</small><b>{delta.sampled.toFixed(4)}</b></div><div><small>Analytical Delta</small><b>{delta.analytic.toFixed(4)}</b></div></div>
      <p className="data-note">Browser experiment · 384 paths · spot and strike 100 · rate 2%</p>
    </div>
  </div>
}

const trades = [[.7,1],[1.5,-1],[2.2,1],[2.35,1],[2.65,1],[3.7,-1],[4.6,-1],[4.8,-1],[5.3,-1],[6.45,1],[6.6,1],[7.65,-1],[8.6,1],[9.3,-1]] as const
const bidDepth = [20,23,25,19,24,26,27,23,19,21,18]
const askDepth = [20,21,19,21,19,19,25,26,28,24,22]
const ofi = bidDepth.map((bid,i) => i === 0 ? 0 : bid - bidDepth[i-1] - (askDepth[i] - askDepth[i-1]))
function pressure(time: number) {
  return trades.reduce((signal, [stamp,side]) => stamp <= time ? signal + side * .8 * Math.exp(-1.65 * (time - stamp)) : signal, 0)
}
function FlowConsole() {
  const [mode,setMode] = useState(0)
  const [time,setTime] = useState(4.8)
  const isPressure = mode === 0
  const px = xAt(time / 10)
  const result = isPressure ? pressure(time) : ofi[Math.floor(time)]
  const points = Array.from({length:201},(_,i) => (i ? 'L' : 'M') + xAt(i / 200).toFixed(1) + ' ' + (82 - pressure(i / 20) * 24).toFixed(2)).join(' ')
  return <div className="quant-workbench">
    <div className="bench-panel">
      <div className="bench-caption"><span>{isPressure ? 'Buy minus sell intensity' : 'Level-one order-flow imbalance'}</span><span>Illustrative tape</span></div>
      <PlotFrame label={isPressure ? 'A signed pressure curve rises on buys, falls on sells and decays between trades' : 'Signed differences between bid and ask queue changes at fixed prices'}>
        <path d="M29 82H502" className="plot-cursor"/>
        {isPressure ? <><path d={points} className="plot-stroke plot-teal"/>{trades.map(([stamp,side]) =>
          <path key={stamp} d={'M' + xAt(stamp / 10) + ' 140v' + (side > 0 ? -9 : 8)} className={'plot-stroke ' + (side > 0 ? 'plot-teal':'plot-copper')}/>)}</>
          : ofi.map((n,i) => <path key={i} d={'M' + xAt(i / 10) + ' 82v' + -n * 6} strokeWidth="10" stroke={n >= 0 ? '#85c7bf' : '#d3a075'} />)}
        <path d={'M' + px + ' 10v139'} className="plot-cursor" />
        <circle cx={px} cy={82 - result * (isPressure ? 24 : 6)} r="4" fill="#f1ddba" />
        <text x="25" y="165" className="plot-label">0 s</text><text x="472" y="165" className="plot-label">10 s</text>
      </PlotFrame>
      <label className="scope-control"><span>Replay time</span><input type="range" min="0" max="100" value={Math.round(time*10)}
        aria-label="Order flow replay time" aria-valuetext={time.toFixed(1) + ' seconds'} onChange={e => setTime(Number(e.target.value) / 10)} /><output>{time.toFixed(1)} s</output></label>
    </div>
    <div className="lab-reading"><h4>Two views of a moving market.</h4>
      <Choices label="Market signal" choices={['Trade pressure','Book imbalance']} value={mode} onChange={setMode}/>
      <p>{isPressure ? 'Buy and sell events excite separate intensities. Each contribution fades exponentially. With equal background rates, the signed difference isolates the memory of recent trades.' : 'Hold the best bid and ask prices fixed. Subtract the change in the ask queue from the change in the bid queue at each book update. Positive values indicate net pressure on the buy side.'}</p>
      <div className="readout-pair"><div><small>{isPressure ? 'Signed intensity' : 'Signed queue change'}</small><b>{signed(result)}</b></div><div><small>Model time</small><b>{time.toFixed(1)} s</b></div></div>
      <p className="data-note">{isPressure ? 'Synthetic events · exponential decay 1.65 per second' : 'Synthetic book · queue sizes observed once per second'}</p>
    </div>
  </div>
}

export default function Mathematics() {
  const [project,setProject] = useState(0)
  const guide=useProjectTour()
  const mc = project === 0
  return <section id="mathematics" className="exhibit-chapter math-chapter" aria-label="Mathematics"><div className="ed-inner">
    <ExhibitHeading number="03" topic="Mathematics" title="Making uncertainty" accent="computable."/>
    <Choices label="Mathematics exhibit" choices={['Monte Carlo AD Greeks','Hawkes-OFI Market Microstructure']} value={project} onChange={index=>{setProject(index); guide.start(index===0?'paths':'events',document.activeElement as HTMLElement)}} />
    <article className="quant-exhibit" data-companion-stop key={project}>
      <div className="feature-project">
        <ModelFigure kind={mc?'paths':'events'} number={mc?'004':'005'} caption={mc?'Simulated trajectories in a geometric Brownian motion model':'Clustered trade arrivals and conditional intensity, illustrative study'} />
        <div className="feature-copy"><p className="category">{mc?'Computational finance':'Market microstructure'}</p><ProjectTitle kind={mc?'paths':'events'}>{mc?'Monte Carlo AD Greeks':'Hawkes-OFI Market Microstructure'}</ProjectTitle>
          <p className="feature-lead">{mc?'A calm estimator can still be wrong.':'How long does a burst of trades matter?'}</p>
          <p className="project-summary">{mc?'A JAX research library tests option sensitivities against analytical values. For a discontinuous digital payoff, differentiating sample paths can miss the entire effect of crossing the strike.':'The study reconstructs the BTCUSDT order book and compares the memory of buy and sell arrivals with pressure at the best bid and ask.'}</p>
          <a className="source-link" href={mc?mcRepo:hawkesRepo}>View {mc?'Monte Carlo AD Greeks':'Hawkes-OFI'} on GitHub</a>
        </div>
      </div>
      {mc ? <><DeltaConsole/><MethodNotes architecture="Terminal-price GBM feeds JAX estimators and an admissibility registry. A pilot estimates variance and runtime before the production draw."
        challenge="Differentiating an indicator misses the probability mass that crosses its boundary as spot changes."
        method="The recorded benchmark runs 200,000 paths per estimate across ten independent replications against analytical prices and Greeks."
        result="For cash-digital Delta, the recorded likelihood-ratio RMSE was 0.0000579. The naive pathwise RMSE was 0.01876 in that configuration."
        source={mcRepo+'#numerical-results'} label="Benchmark and analytical checks"/></>
      : <><FlowConsole/><MethodNotes architecture="Snapshot and depth updates reconstruct the book. A fitted bivariate Hawkes process models trade arrivals. Both signals feed short-horizon return regressions."
        challenge="Adjacent high-frequency samples share history. An ordinary random split can make a model appear more transferable than it is."
        method="Each of three independent captures is held out in turn. The study checks time resolution and block-bootstrap uncertainty and replicates the core estimator in MATLAB."
        result="At five seconds, mean held-out R² was 1.62% for Hawkes pressure and 0.01% for level-one OFI across the three captures."
        source={hawkesRepo+'#results'} label="Results and cross-capture tests"/></>}
    </article>
  </div></section>
}
