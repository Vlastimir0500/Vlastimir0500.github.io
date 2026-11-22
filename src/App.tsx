import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, Github, Menu, Pause, Play, X } from 'lucide-react'
import Editorial from './editorial/Editorial'
import FieldScene from './scene/FieldScene'
import Terminal from './desk/Terminal'
import Companion from './companion/Companion'

gsap.registerPlugin(ScrollTrigger)

const github = 'https://github.com/Vlastimir0500'
const navigation = [
  ['about', 'About', 1],
  ['work', 'Silicon', 2],
  ['mathematics', 'Mathematics', 3],
  ['intelligence', 'Intelligence', 4],
  ['research', 'Experiments', 5],
  ['future-work', 'Career map', 5],
  ['contact', 'Contact', 6],
] as const
const renderStudies = [
  { name: 'Surface', title: 'A single surface', note: 'One half-twist joins the ends of a ribbon. Follow the copper edge through a full circuit of the band.' },
  { name: 'Contours', title: 'Following the twist', note: 'Longitudinal contours trace the change in orientation along the Möbius band.' },
  { name: 'Structure', title: 'Inside the band', note: 'Transverse ribs reveal the local frame as it rotates through half a turn.' },
] as const
type Variant = 0 | 1 | 2

function Brand() {
  return <span className="brand"><svg viewBox="0 0 37 33" width="31" height="28" fill="currentColor" aria-hidden="true"><path d="M0 2h8l11.2 20.1-4 7.2zM12.4 2h7.9l5 9-4 7.15zM28.7 2h8L21.2 30h-8z" /></svg><span>Vlastimir</span></span>
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function Header() {
  const [active, setActive] = useState('top')
  const [paper, setPaper] = useState(false)
  const ruler = useRef<HTMLSpanElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const chapters = ['top', ...navigation.map(([id]) => id)]
      .map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
      .sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    let frame = 0
    const update = () => {
      frame = 0
      const current = chapters.filter(section => section.getBoundingClientRect().top < 120).at(-1)
      const atFoot = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      setActive(atFoot ? 'contact' : current?.id ?? 'top')
      setPaper(!atFoot && Boolean(current?.classList.contains('paper')))
      const distance = document.documentElement.scrollHeight - innerHeight
      if (ruler.current) ruler.current.style.transform = 'scaleX(' + (distance > 0 ? Math.min(1,scrollY/distance) : 0) + ')'
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const sizes = new ResizeObserver(schedule)
    sizes.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      sizes.disconnect()
    }
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const onResize = () => { if (window.innerWidth > 1050) dialog.current?.close() }
    document.documentElement.classList.add('menu-visible')
    window.addEventListener('resize', onResize)
    return () => {
      document.documentElement.classList.remove('menu-visible')
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])
  const links = navigation.map(([id, label]) =>
    <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined} onClick={() => dialog.current?.close()}>{label}</a>)
  const chapter = navigation.find(([id]) => id === active)?.[2] ?? 0
  return <>
    <a href="#work" className="skip-content">Skip to selected work</a>
    <header className={'masthead' + (paper ? ' masthead-paper' : '')}>
      <div className="masthead-inner">
        <a className="brand-link" href="#top" aria-label="Vlastimir, portfolio home"><Brand /></a>
        <nav className="desktop-nav" aria-label="Primary">{links}</nav>
        <div className="header-actions">
          <span className="chapter-counter" aria-hidden="true">{String(chapter).padStart(2,'0')} / 06</span>
          <span id="companion-dock" />
          <Terminal />
          <a className="github-link" href={github} target="_blank" rel="noreferrer"><Github size={15} aria-hidden="true" />GitHub</a>
          <button className="menu-button" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => { dialog.current?.showModal(); setMenuOpen(true) }}><Menu size={22} /></button>
        </div>
      </div>
      <span aria-hidden="true" className="reading-progress" ref={ruler} />
    </header>
    <dialog ref={dialog} id="mobile-navigation" aria-label="Navigation" onClose={() => setMenuOpen(false)}>
      <div className="menu-head"><Brand /><button aria-label="Close navigation" autoFocus onClick={() => dialog.current?.close()}><X /></button></div>
      <nav className="mobile-nav" aria-label="Mobile">{links}</nav>
      <a className="menu-profile" href={github} target="_blank" rel="noreferrer"><Github size={17} /> Vlastimir on GitHub</a>
    </dialog>
  </>
}

function Corners() {
  return <>{['tl','tr','bl','br'].map(corner => <i key={corner} aria-hidden="true" className={'cross cross-' + corner} />)}</>
}

function Hero() {
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const reducedMotion = useReducedMotion()
  const [variant, setVariant] = useState<Variant>(0)
  const [paused, setPaused] = useState(false)
  const [modelLive, setModelLive] = useState(false)
  const [studying, setStudying] = useState(false)
  const study = renderStudies[variant]

  useLayoutEffect(() => {
    if (reducedMotion || !section.current) {
      progress.current = 0
      setStudying(false)
      return
    }
    const media = gsap.matchMedia()
    const ctx = gsap.context(() => {
      media.add({ compact: '(max-width: 700px) and (min-height: 600px)', wide: '(min-width: 701px) and (min-height: 575px)' }, () => {
        const frame = section.current!.querySelector<HTMLElement>('.hero-frame')!
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section.current, start: 'top top',
            end: () => '+=' + Math.max(1, section.current!.offsetHeight - 2 * frame.offsetHeight),
            scrub: true, invalidateOnRefresh: true,
            onUpdate: self => {
              progress.current = self.progress
              setStudying(self.progress > 0.42)
            },
          },
        })
        timeline.to('.hero-lead', { yPercent: -10, opacity: 0, duration: 0.33 }, 0.045)
          .fromTo('.study-note', { yPercent: -50, y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18 }, 0.37)
          .fromTo('.study-phrase', {opacity:0}, {opacity:1,stagger:.07,duration:.17}, .39)
          .fromTo('.welcome-line', {opacity:0,y:7}, {opacity:1,y:0,duration:.18}, .60)
          .to('.model-stage', { scale: 1.025, duration: 0.82 }, 0)
          .to('.sequence-tick', { scaleX: 1, duration: 1 }, 0)
        gsap.to('.hero-inner', {
          scale: .955, opacity: .45, ease: 'none',
          scrollTrigger: { trigger: document.getElementById('about'), start: 'top bottom', end: 'top top', scrub: true },
        })
        return () => { progress.current = 0; setStudying(false) }
      })
    }, section)
    return () => { media.revert(); ctx.revert() }
  }, [reducedMotion])

  return <section id="top" className="hero-sequence" ref={section} aria-labelledby="home-title">
    <div className="hero-frame">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-columns">
          <div className="hero-copy">
            <div className="hero-lead" inert={studying}>
              <div className="overline"><span className="signal" aria-hidden="true"><i /><i /><i /></span>Research engineering</div>
              <h1 id="home-title" className="personal-title"><span className="greeting">HEY YOOO.</span><span className="name-line">I'M <em>VLASTIMIR.</em></span></h1>
              <p className="hero-description personal-manifesto">I build things.<br/>I break assumptions.<br/>I try to understand how everything works.</p>
              <div className="hero-actions"><a className="primary-action" href="#work"><span className="four-grid" aria-hidden="true"><i /><i /><i /><i /></span>Explore projects</a><a className="text-action" href="#research">Research notes</a></div>
            </div>
            <div className="study-note" inert={!studying} aria-hidden={!studying}>
              <p className="study-title opening-transition"><span className="study-phrase">Somewhere between silicon, </span><span className="study-phrase">mathematics, and </span><em className="study-phrase">machine intelligence.</em></p>
              <p className="welcome-line">Welcome to my little corner of the computational universe.</p><a href="#about" className="text-action">Meet Vlastimir</a>
            </div>
          </div>
          <figure className="specimen" aria-label={'Möbius strip, ' + study.name.toLowerCase() + ' rendering'}>
            <div className="model-stage">
              <div className="plot-field" aria-hidden="true" />
              <FieldScene progress={progress} paused={paused} reducedMotion={reducedMotion} variant={variant} onLiveChange={setModelLive} />
              <Corners />
              <span className="model-equation" aria-hidden="true">Δφ = π rad</span>
              <span className="plate-id" aria-hidden="true">MB—01 / {study.name}</span>
              <span className="axis-glyph" aria-hidden="true"><span>z</span><i /><b /></span>
            </div>
            <figcaption className="figure-caption"><span className="figure-name"><span>Fig. 001</span><i />Curiosity has no fixed direction.</span><div className="model-controls" role="group" aria-label="Rendering mode">
              {renderStudies.map(({ name, note }, index) => <button className="study-switch" key={name} title={note} aria-pressed={variant === index} onClick={() => setVariant(index as Variant)}>{name}</button>)}
              {modelLive && !reducedMotion && <button className="motion-control" aria-label={paused ? 'Resume rotation' : 'Pause rotation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
            </div></figcaption>
          </figure>
        </div>
        <div className="hero-foot">
          <a href="#about" className="scroll-control"><span><ArrowDown size={14} /></span>Scroll to explore</a>
          <div className="sequence-meter" aria-hidden="true"><i className="sequence-tick" /></div>
          <span className="edition">Portfolio <i>/</i> 2026</span>
        </div>
      </div>
    </div>
  </section>
}

export default function App() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const chapter = hash ? document.getElementById(hash) : null
    const input = new AbortController()
    let mounted = true
    let interrupted = false
    let frame = 0
    const stopAligning = () => { interrupted = true }
    const align = () => {
      if (mounted && !interrupted && window.location.hash.slice(1) === hash) chapter?.scrollIntoView()
    }
    if (chapter) {
      frame = requestAnimationFrame(align)
      for (const event of ['pointerdown', 'wheel', 'keydown']) {
        window.addEventListener(event, stopAligning, { signal: input.signal, passive: true })
      }
    }
    document.fonts.ready.then(() => {
      if (!mounted) return
      ScrollTrigger.refresh()
      // Wrapped project text can move a later chapter once the portfolio fonts load.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { align(); input.abort() })
    })
    return () => { mounted = false; cancelAnimationFrame(frame); input.abort() }
  }, [])
  return <><Header /><main><Hero /><Editorial /></main><Companion />
    <footer className="site-footer"><a href="#top" aria-label="Vlastimir, back to top"><Brand /></a><span>© 2026 Vlastimir</span><a className="footer-top" href="#top">Back to top</a></footer>
  </>
}
