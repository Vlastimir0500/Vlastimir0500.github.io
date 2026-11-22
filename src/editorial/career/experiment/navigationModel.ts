/** All positions are synthetic Cartesian coordinates in metres. */
export type Position = readonly [east: number, north: number]
type Sample = { position: Position; response: number[] }

export const protocol = {
  version: 'navigation-replay/1',
  generator: 'Mulberry32',
  trainVoyages: 8,
  testVoyages: 4,
  samplesPerVoyage: 64,
  placeFields: 20,
  fieldWidthMetres: 22,
  responseNoiseSD: 0.065,
  nearestNeighbours: 3,
  landmarkEverySamples: 16,
} as const

function generator(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let x = Math.imul(state ^ (state >>> 15), state | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const tau = 2 * Math.PI

export function syntheticRoute(seed: number, index: number): Position[] {
  // Separate streams let the preview render the same held-out voyage as the worker.
  const draw = generator(seed ^ Math.imul(index + 1, 0x85ebca6b))
  const start = tau * draw(), shape = tau * draw(), tide = tau * draw()
  const radius = .91 + .18 * draw(), direction = index % 2 === 0 ? 1 : -1
  return Array.from({length: protocol.samplesPerVoyage}, (_, i) => {
    const t = tau * i / protocol.samplesPerVoyage
    const a = start + direction * (t + .07 * Math.sin(2*t + tide))
    const r = radius + .065 * Math.sin(3*a + shape) + .05 * Math.cos(2*a + tide)
    return [72 * r * Math.cos(a) + 4 * Math.sin(2*a), 36 * r * Math.sin(a) + 3 * Math.cos(3*a)] as const
  })
}

function makeFields(seed: number): Position[] {
  const draw = generator(seed ^ 0x27d4eb2f)
  return Array.from({length: protocol.placeFields}, (_, i) => {
    const a = tau * (i + .5 * draw()) / protocol.placeFields
    const r = .75 + .47 * draw()
    return [72*r*Math.cos(a), 36*r*Math.sin(a)] as const
  })
}

function observe(seed: number, index: number, fields: Position[]): Sample[] {
  const draw = generator(seed ^ Math.imul(index + 1, 0xc2b2ae35))
  const denominator = 2 * protocol.fieldWidthMetres ** 2
  return syntheticRoute(seed,index).map(position => ({
    position,
    response: fields.map(([x,y]) => {
      const squaredDistance = (x-position[0])**2 + (y-position[1])**2
      const noise = Math.sqrt(-2*Math.log(1-draw())) * Math.cos(tau*draw())
      return Math.max(0, Math.exp(-squaredDistance / denominator) + noise * protocol.responseNoiseSD)
    }),
  }))
}

function decode(response: number[], training: Sample[]): Position {
  // Keep only the three nearest training responses while scanning the library.
  const nearest: {distance:number; position:Position}[] = []
  for (const sample of training) {
    let distance = 0
    for (let i = 0; i < response.length; i++) distance += (response[i] - sample.response[i]) ** 2
    if (nearest.length === protocol.nearestNeighbours && nearest[nearest.length-1].distance <= distance) continue
    nearest.push({distance, position:sample.position})
    nearest.sort((a,b) => a.distance - b.distance)
    if (nearest.length > protocol.nearestNeighbours) nearest.pop()
  }
  let east = 0, north = 0, total = 0
  for (const neighbour of nearest) {
    const weight = 1 / Math.max(.000001, Math.sqrt(neighbour.distance))
    total += weight
    east += neighbour.position[0] * weight
    north += neighbour.position[1] * weight
  }
  return [east / total, north / total]
}

function median(values: number[]) {
  const sorted = [...values].sort((a,b) => a-b)
  const mid = Math.floor(sorted.length / 2)
  return (sorted[mid] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2
}
const errorMetres = ([x,y]:Position, [u,v]:Position) => Math.hypot(x-u,y-v)

export type Fix = { truth: Position; decoded: Position; lastFix: Position }
export type ReplayStage = 'Generating training voyages' | 'Decoding held-out voyages' | 'Measuring position error'

export function runReplay(seed: number, progress: (stage: ReplayStage) => void = () => {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('Enter a whole-number seed from 0 to 4294967295.')
  progress('Generating training voyages')
  const fields = makeFields(seed)
  const training = Array.from({length:protocol.trainVoyages}, (_, i) => observe(seed,i,fields)).flat()
  progress('Decoding held-out voyages')
  const voyages = Array.from({length:protocol.testVoyages}, (_, i) => {
    const observed = observe(seed,protocol.trainVoyages+i,fields)
    return observed.map((sample,index): Fix => ({
      truth: sample.position,
      decoded: decode(sample.response,training),
      lastFix: observed[index-index % protocol.landmarkEverySamples].position,
    }))
  })
  progress('Measuring position error')
  const all = voyages.flat()
  return {
    protocol, seed, units:'metres', data:'synthetic',
    decoder:'Inverse response-distance weighted position of the three nearest training responses',
    baseline:'Last exact position fix, refreshed every 16 samples',
    metric:'Median Euclidean position error across all held-out samples',
    results:{
      heldOutSamples:all.length,
      decoderMedianMetres:median(all.map(p=>errorMetres(p.truth,p.decoded))),
      baselineMedianMetres:median(all.map(p=>errorMetres(p.truth,p.lastFix))),
    },
    voyages,
  }
}

export type Replay = ReturnType<typeof runReplay>
export type WorkerMessage = {stage: ReplayStage} | {replay: Replay} | {error: string}
