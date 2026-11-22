import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Terminal as TerminalIcon, X } from 'lucide-react'
import './terminal.css'

const profile = 'https://github.com/Vlastimir0500'
const commands = [
  ['help', 'List commands'], ['about', 'Meet Vlastimir'],
  ['projects', 'Browse six projects'], ['research', 'Explore the notebook and future work'],
  ['morph', 'Inspect the silicon exhibit'], ['github', 'Find the source'],
  ['skills', 'See methods used in the work'], ['clear', 'Clear the screen'],
] as const

type Reply = {
  text: string
  links?: readonly (readonly [name: string, url: string])[]
}

const replies: Record<string, Reply> = {
  about: { text: 'I’m Vlastimir. This is my field notebook for programmable hardware, financial mathematics and machine intelligence.',
    links: [['Who am I?', '#about'], ['Contact', '#contact']] },
  projects: { text: 'The six exhibits follow three lines of work. In an exhibit, choose Ask Luffy for a guided tour. Read aloud turns on the companion’s narration.',
    links: [['MORPH', '#work'], ['Monte Carlo AD Greeks', profile + '/mc-ad-greeks'], ['Hawkes-OFI', profile + '/hawkes-ofi-market-microstructure'],
      ['Q-CyberSelect', profile + '/Q-CyberSelect'], ['Adaptive-DRST', profile + '/Adaptive-drst'], ['Prompt Shield', profile + '/prompt-shield']] },
  research: { text: 'The notebook holds studies and sketches. Follow my planned route into spatial intelligence, test a place-cell decoder on synthetic voyages, or explore the proposed island studies.',
    links: [['Experiment wall', '#research'], ['Career map', '#future-work'], ['Run Navigation replay', '#navigation-replay'], ['An atlas from memory', '#research-atlas']] },
  morph: { text: 'MORPH is a programmable temporal engine. Its instructions express pin-level behavior and timing so one fabric can implement several wire protocols.',
    links: [['Inspect MORPH', '#work'], ['MORPH repository', profile + '/MORPH']] },
  github: { text: 'Source, engineering notes and project discussions.',
    links: [['Vlastimir0500 on GitHub', profile], ['Portfolio source', profile + '/Vlastimir0500.github.io']] },
  skills: { text: 'SystemVerilog and verification in MORPH. JAX, automatic differentiation and Monte Carlo estimators in AD Greeks. Feature selection, calibration and domain adaptation in the intelligence exhibits.',
    links: [['Silicon', '#work'], ['Mathematics', '#mathematics'], ['Intelligence', '#intelligence']] },
  mobius: { text: 'One edge. One side. Follow the copper rim twice around the sculpture to return to your starting point.',
    links: [['Inspect the Möbius strip', '#top']] },
  meat: { text: 'Galley inventory checked. Enough provisions for one more island.',
    links: [['Set a course', '#research-atlas']] },
}

type Entry = { id: number; typed: string; command: string }

export default function Terminal() {
  const modal = useRef<HTMLDialogElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const history = useRef<string[]>([])
  const cursor = useRef(0)
  const draft = useRef('')
  const sequence = useRef(0)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])

  useLayoutEffect(() => {
    if (open && log.current) log.current.scrollTop = log.current.scrollHeight
  }, [entries, open])

  function show() {
    modal.current?.showModal()
    setOpen(true)
    input.current?.focus({ preventScroll: true })
  }

  function run(raw: string) {
    const typed = raw.trim()
    if (!typed) return
    const command = typed.toLowerCase()
    history.current.push(typed)
    if (history.current.length > 100) history.current.shift()
    cursor.current = history.current.length
    draft.current = ''
    setValue('')
    const id = ++sequence.current
    if (command === 'clear') setEntries([])
    else {
      const entry = { id, typed, command }
      setEntries(previous => [...previous.slice(-59), entry])
    }
    input.current?.focus({ preventScroll: true })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    run(value)
  }

  function recall(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    if (!history.current.length) return
    event.preventDefault()
    if (cursor.current === history.current.length) draft.current = value
    cursor.current = Math.max(0, Math.min(history.current.length, cursor.current + (event.key === 'ArrowUp' ? -1 : 1)))
    setValue(history.current[cursor.current] ?? draft.current)
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('#') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    modal.current?.close()
    requestAnimationFrame(() => {
      const target = document.getElementById(href.slice(1))
      if (!target) return
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    })
  }

  function output(command: string) {
    if (command === 'help') return <dl className="terminal-commands">{commands.map(([name, description]) =>
      <div key={name}><dt><button type="button" onClick={() => run(name)}>{name}</button></dt><dd>{description}</dd></div>)}</dl>
    const reply = Object.hasOwn(replies, command) ? replies[command] : undefined
    if (!reply) return <p>Unknown command. Type <button className="terminal-inline-command" type="button" onClick={() => run('help')}>help</button> to see the index.</p>
    return <><p>{reply.text}</p>{reply.links && <ul className="terminal-links">{reply.links.map(([title, href]) =>
      <li key={href}><a href={href} onClick={event => navigate(event, href)}>{title}</a></li>)}</ul>}</>
  }

  return <>
    <button className="terminal-trigger" type="button" onClick={show} aria-haspopup="dialog" aria-expanded={open}
      aria-controls="portfolio-terminal" aria-label="Open portfolio terminal" title="Open portfolio terminal">
      <TerminalIcon size={17} strokeWidth={1.7} aria-hidden="true" />
    </button>
    {createPortal(<dialog id="portfolio-terminal" className="folio-terminal" ref={modal} aria-labelledby="terminal-title"
      onClose={() => setOpen(false)} onClick={event => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.current?.close()
      }}>
      <header className="terminal-heading">
        <TerminalIcon size={22} strokeWidth={1.4} aria-hidden="true" />
        <h2 id="terminal-title">Portfolio terminal</h2>
        <button type="button" className="terminal-close" onClick={() => modal.current?.close()} aria-label="Close terminal"><X size={19} /></button>
      </header>
      <div className="terminal-body" ref={log} tabIndex={0} role="log" aria-label="Terminal output" aria-live="polite" aria-relevant="additions text">
        {entries.length === 0 && sequence.current === 0 && <div className="terminal-welcome"><p>Where to?</p><span>Run <button type="button" className="terminal-inline-command" onClick={() => run('help')}>help</button> for commands, or start with <button type="button" className="terminal-inline-command" onClick={() => run('projects')}>projects</button>.</span></div>}
        {entries.map(entry => <div key={entry.id} className="terminal-entry"><p className="terminal-echo"><span aria-hidden="true">›</span>{entry.typed}</p>
          <div className="terminal-reply">{output(entry.command)}</div></div>)}
      </div>
      <form onSubmit={submit} className="terminal-form">
        <label htmlFor="terminal-command"><span aria-hidden="true">vl / ~</span><span className="terminal-sr">Portfolio command</span></label>
        <input ref={input} id="terminal-command" value={value} maxLength={120} onChange={e => setValue(e.target.value)} onKeyDown={recall}
          type="text" placeholder="Enter a command" autoComplete="off" spellCheck={false} autoCapitalize="none" enterKeyHint="go" />
        <button type="submit" className="terminal-enter">Run</button>
      </form>
      <p className="terminal-hints"><span><kbd>↑</kbd> <kbd>↓</kbd> history</span><span><kbd>Esc</kbd> close</span></p>
    </dialog>, document.body)}
  </>
}
