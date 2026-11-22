import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import type { PlateKind } from '../editorial/plates/plateTypes'
import { playTourLine } from './tourPlayback'
import './tourVoice.css'

export default function TourVoice({ kind, beat, line }: { kind: PlateKind; beat: number; line: string }) {
  const player = useRef<HTMLAudioElement | null>(null)
  const stopLine = useRef<(() => void) | null>(null)
  const reading = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [failed, setFailed] = useState(false)

  const cancel = useCallback(() => {
    stopLine.current?.()
    stopLine.current = null
  }, [])

  const silence = useCallback(() => {
    reading.current = false
    cancel()
    setEnabled(false)
    setSpeaking(false)
  }, [cancel])

  const speak = useCallback(() => {
    if (document.hidden) return
    cancel()
    setSpeaking(false)
    setFailed(false)
    // Reuse the element unlocked by the visitor's first click on mobile.
    const audio = player.current ?? (player.current = new Audio())
    stopLine.current = playTourLine(audio, './voice/' + kind + '-' + beat + '.mp3', line, {
      speaking: setSpeaking,
      unavailable: () => {
        reading.current = false
        setSpeaking(false)
        setEnabled(false)
        setFailed(true)
      },
    })
  }, [kind, beat, line, cancel])

  useLayoutEffect(() => {
    if (reading.current) speak()
    return cancel
  }, [speak, cancel])

  useEffect(() => {
    const visibility = () => { if (document.hidden) silence() }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', silence)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', silence)
    }
  }, [silence])

  function toggle() {
    if (reading.current) { silence(); return }
    reading.current = true
    setEnabled(true)
    speak()
  }
  const hint = failed ? 'The browser could not play this line. Select to try again.'
    : enabled ? 'Turn off spoken tour replies.' : 'Read this tour aloud with its original synthetic narrator.'
  return <>
    <button className="tour-voice" type="button" onClick={toggle} aria-label="Read Luffy’s dialogue aloud"
      aria-pressed={enabled} title={hint} data-narrating={speaking || undefined}>
      {enabled ? <VolumeX size={14} aria-hidden="true"/> : <Volume2 size={14} aria-hidden="true"/>}
      {failed ? 'Retry voice' : enabled ? 'Mute' : 'Read aloud'}
    </button>
    {failed && <span className="tour-voice-error" role="status">Voice playback unavailable.</span>}
  </>
}
