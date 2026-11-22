import { useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, Check, Undo2 } from 'lucide-react'
import CareerChart from './CareerChart'
import ExperimentRunner from './experiment/ExperimentRunner'
import { available, milestones, nextMilestone, readProgress, saveProgress } from './careerPlan'
import type { MilestoneId } from './careerPlan'
import './career-roadmap.css'

export default function CareerRoadmap() {
  const [done,setDone]=useState(readProgress)
  const [selected,setSelected]=useState<MilestoneId>(()=>nextMilestone(done) ?? 'publish')
  const [message,setMessage]=useState('')
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const next=nextMilestone(done)
  const node=milestones.find(m=>m.id===selected)!
  const complete=done.includes(selected)
  const ready=available(selected,done)
  const pending=node.needs.filter(id=>!done.includes(id))
  function select(id: MilestoneId) {
    setSelected(id)
    setMessage('')
  }
  function openStation(id: MilestoneId) {
    select(id)
    if (matchMedia('(max-width: 740px)').matches) {
      requestAnimationFrame(() => {
        detailHeading.current?.focus({ preventScroll: true })
        detailHeading.current?.closest('article')?.scrollIntoView({ block: 'start' })
      })
    }
  }
  function returnToChart() {
    board.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
    board.current?.scrollIntoView({ block: 'start' })
  }
  function advance() {
    if (!ready || complete) return
    const updated=[...done,selected]
    const upcoming=nextMilestone(updated)
    saveProgress(updated);setDone(updated)
    if(upcoming)setSelected(upcoming)
    setMessage(upcoming ? node.short+' marked complete. '+milestones.find(m=>m.id===upcoming)!.short+' is next.' : 'Route complete. All six milestones are marked in your preview.')
  }
  function undo() {
    const last=done.at(-1)
    if (!last) return
    const updated=done.slice(0,-1)
    saveProgress(updated);setDone(updated);setSelected(last)
    setMessage(milestones.find(m=>m.id===last)!.short+' reopened.')
  }
  return <section id="future-work" className="career-chapter" aria-labelledby="career-title"><div className="ed-inner">
    <p className="chapter-mark"><span>05</span><i aria-hidden="true"/>Future work / Career map</p>
    <header className="career-intro">
      <h2 id="career-title">My research <em>trajectory.</em></h2>
      <div><p>I want to build navigation systems that learn from experience. My route into spatial intelligence brings computational neuroscience and automation together.</p>
        <nav aria-label="Future work exhibits"><a href="#navigation-replay">Run the experiment</a><a href="#research-atlas">Explore the atlas</a></nav></div>
    </header>
    <div className="career-spread">
      <div className="career-map" ref={board}>
        <CareerChart selected={selected} completed={done} recommended={next} onSelect={openStation}/>
        <div className="career-progress"><span>Route preview <b>{done.length} / 6</b></span>
          <progress value={done.length} max={6} aria-label="Milestones completed in this preview"/>
          {done.length>0 && <button type="button" onClick={undo}><Undo2 size={13} aria-hidden="true"/>Undo last step</button>}</div>
        <p className="career-local">Explore the planned roles and deliverables. Your checkmarks are saved in this browser.</p>
      </div>
      <article id="career-milestone" className="career-detail" aria-labelledby="milestone-title">
        <p className="category">{node.track}</p>
        <h3 id="milestone-title" tabIndex={-1} ref={detailHeading}>{node.title}</h3>
        <p className="career-role"><span>Target role</span> {node.role}</p>
        <p className="career-aim">{node.aim}</p>
        <dl><div><dt>What I’d ship</dt><dd>{node.deliverable}</dd></div>
        <div><dt>How I’d verify it</dt><dd>{node.test}</dd></div></dl>
        <a className="career-evidence" href={node.link}>{node.linkText}<ArrowUpRight size={14} aria-hidden="true"/></a>
        <div className="career-action">
          {complete ? <span className="career-done"><Check size={15} aria-hidden="true"/>Complete in your preview</span>
            : ready ? <button type="button" onClick={advance}><Check size={15} aria-hidden="true"/>{done.length===5?'Complete route':'Complete & advance'}</button>
            : <div className="career-prereqs"><span>First complete</span>{pending.map(id=><button key={id} onClick={()=>select(id)}>{milestones.find(m=>m.id===id)!.short}</button>)}</div>}
        </div>
        <button className="career-back" type="button" onClick={returnToChart}><ArrowUp size={13} aria-hidden="true"/>Back to map</button>
      </article>
    </div>
    <p className="career-sr" role="status">{message}</p>
    <ExperimentRunner/>
  </div></section>
}
