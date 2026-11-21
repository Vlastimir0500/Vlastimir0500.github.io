export const plateLabels = {
  hardware: 'MORPH chip package',
  paths: 'Monte Carlo price paths',
  graph: 'Q-CyberSelect feature graph',
  filter: 'Prompt Shield input filter',
  events: 'Hawkes event intensity',
  shift: 'Adaptive-DRST domain shift',
} as const

export type PlateKind = keyof typeof plateLabels
