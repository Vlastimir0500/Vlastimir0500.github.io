type PlaybackEvents = {
  speaking: (active: boolean) => void
  unavailable: () => void
}

// Each line owns its callbacks. A rejected play() or a late speech event from a
// previous line must never start a fallback or change the current controls.
export function playTourLine(audio: HTMLAudioElement, clip: string, line: string, events: PlaybackEvents) {
  let active = true
  let triedSpeech = false
  let utterance: SpeechSynthesisUtterance | null = null
  let stopWaiting: (() => void) | null = null

  function detachAudio() {
    audio.onplaying = audio.onwaiting = audio.onpause = audio.onended = audio.onerror = null
    audio.pause()
  }

  function readWithDeviceVoice() {
    if (!active || triedSpeech) return
    triedSpeech = true
    detachAudio()
    events.speaking(false)
    const synth = window.speechSynthesis
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
      events.unavailable()
      return
    }
    function readLocalVoice() {
      if (!active || utterance) return
      const voices = synth.getVoices().filter(voice => voice.localService && /^en(?:[-_]|$)/i.test(voice.lang))
      const voice = voices.find(voice => voice.default) ?? voices[0]
      if (!voice) return
      stopWaiting?.()
      utterance = new SpeechSynthesisUtterance(line)
      utterance.voice = voice
      utterance.lang = voice.lang
      utterance.rate = 1.02
      utterance.pitch = 1.08
      utterance.onstart = () => { if (active) events.speaking(true) }
      utterance.onend = () => {
        utterance = null
        if (active) events.speaking(false)
      }
      utterance.onerror = () => {
        utterance = null
        if (active) events.unavailable()
      }
      synth.speak(utterance)
    }
    function onVoicesChanged() {
      try { readLocalVoice() } catch { stopWaiting?.(); events.unavailable() }
    }
    // Chrome may expose its installed voices asynchronously on the first call.
    const timeout = window.setTimeout(() => {
      stopWaiting?.()
      if (active) events.unavailable()
    }, 1600)
    stopWaiting = () => {
      window.clearTimeout(timeout)
      synth.removeEventListener('voiceschanged', onVoicesChanged)
      stopWaiting = null
    }
    synth.addEventListener('voiceschanged', onVoicesChanged)
    onVoicesChanged()
  }

  audio.onplaying = () => { if (active && !triedSpeech) events.speaking(true) }
  audio.onpause = audio.onwaiting = audio.onended = () => { if (active) events.speaking(false) }
  audio.onerror = readWithDeviceVoice
  try {
    audio.src = clip
    void audio.play().catch(readWithDeviceVoice)
  } catch { readWithDeviceVoice() }

  return () => {
    active = false
    stopWaiting?.()
    detachAudio()
    audio.removeAttribute('src')
    audio.load()
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null
      window.speechSynthesis.cancel()
      utterance = null
    }
  }
}
