export const plateLabels = {
  hardware: 'MORPH chip package',
  paths: 'Monte Carlo price paths',
  graph: 'Q-CyberSelect feature graph',
  filter: 'Prompt Shield input filter',
  events: 'Hawkes event intensity',
  shift: 'Adaptive-DRST domain shift',
} as const

export type PlateKind = keyof typeof plateLabels

export type TourMix = readonly [number, number, number]
export const neutralTour: TourMix = [0, 0, 0]

// Crossfade each property directly from the live model into the three camera cues.
// This also handles interrupting one shot halfway through its transition.
export function tourValue(mix: TourMix, base: number, first: number, second: number, third: number) {
  return base + mix[0] * (first - base) + mix[1] * (second - base) + mix[2] * (third - base)
}
