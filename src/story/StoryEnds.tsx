import { useEffect, useRef } from 'react'
import { Github, MessagesSquare } from 'lucide-react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const github = 'https://github.com/Vlastimir0500'
const slices = [...Array.from({length: 23}, (_,i) => ({fixed:i/22, across:true})),
  ...Array.from({length: 31}, (_,i) => ({fixed:i/30, across:false}))]

function latticeLine(fixed: number, across: boolean, phase: number) {
  const points: string[] = []
  for (let i = 0; i <= 40; i++) {
    const u = across ? i / 40 : fixed
    const v = across ? fixed : i / 40
    const z = Math.sin(2*Math.PI*u + phase) * Math.cos(Math.PI*v)
    const x = 265 + (u-.5)*302 + (v-.5)*150
    const y = 157 + (u-.5)*55 - (v-.5)*108 - z*58
    points.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1))
  }
  return points.join(' ')
}

function WaveFigure() {
  const art = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const root = art.current
    if (!root) return
    const lines = root.querySelectorAll<SVGPathElement>('[data-lattice]')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let trigger: ScrollTrigger | undefined
    function paint(phase: number) {
      lines.forEach((line,i) => { const slice=slices[i]; line.setAttribute('d',latticeLine(slice.fixed,slice.across,phase)) })
    }
    function setup() {
      trigger?.kill()
      if (motion.matches) { paint(.65); return }
      trigger = ScrollTrigger.create({trigger:root, start:'top bottom', end:'bottom top',
        onUpdate: self => paint(.4 + self.progress*2.7)})
    }
    setup()
    motion.addEventListener('change',setup)
    return () => {trigger?.kill(); motion.removeEventListener('change',setup)}
  }, [])
  return <figure className="wave-study"><svg viewBox="0 0 530 300" ref={art} role="img" aria-label="A regular grid lifted into a sinusoidal surface">
    <defs><pattern id="wave-grid" width="27" height="27" patternUnits="userSpaceOnUse"><path d="M27 0H0V27" fill="none" stroke="#799997" strokeOpacity=".17" strokeWidth=".6"/></pattern></defs>
    <rect width="530" height="300" fill="url(#wave-grid)" />
    <g fill="none">{slices.map(({fixed,across},i)=><path key={i} data-lattice="" d={latticeLine(fixed,across,.65)}
      stroke={i === 11 ? '#e9ab7c' : across ? '#8fc9c1' : '#618b90'} strokeWidth={i === 11 ? 1.8 : .9} opacity={i === 11 ? 1 : .83}/>)}</g>
    <g stroke="#94a8ac" fill="none"><path d="M15 23v-8h8M507 15h8v8M515 277v8h-8M23 285h-8v-8"/></g>
  </svg><figcaption><span>Fig. 002 / Phase study</span><span>z = sin(2πu + φ) cos(πv)</span></figcaption></figure>
}

export function Introduction() {
  return <section id="about" className="about-chapter" aria-labelledby="about-title"><div className="ed-inner">
    <p className="chapter-mark"><span>01</span><i aria-hidden="true"/>Who am I?</p>
    <div className="story-spread"><div>
      <h2 id="about-title">Curiosity is the <em>operating system.</em></h2>
      <p className="static-transition">Somewhere between silicon, mathematics, and machine intelligence. Welcome to my little corner of the computational universe.</p>
      <p>I'm Vlastimir. I like understanding things deeply enough to build something with them.</p>
      <p>Sometimes that's programmable hardware. Sometimes it's financial mathematics. Sometimes it's security, machine learning, or a research question that won't leave my head.</p>
    </div><WaveFigure /></div>
  </div></section>
}

export function Contact() {
  return <section className="contact-chapter story-contact" id="contact" aria-labelledby="contact-title"><div className="ed-inner">
    <p className="chapter-mark"><span>06</span><i aria-hidden="true"/>The end?</p>
    <div className="closing-note"><h2 id="contact-title">Still figuring <em>things out.</em></h2>
      <p>There's always another problem, another question, another idea worth building.</p></div>
    <p className="closing-statement">LET'S BUILD<br/> SOMETHING <em>INTERESTING.</em></p>
    <div className="closing-actions"><a className="profile-action" href={github}><Github size={17}/>GitHub</a>
      <a className="profile-action" href={github+'/Vlastimir0500.github.io/issues/new'}><MessagesSquare size={17}/>Start a conversation on GitHub</a></div>
  </div></section>
}
