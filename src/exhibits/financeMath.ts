// Common normal draws keep the same simulated voyages when volatility changes.
const steps = 32
const samples = 384
const rate = .02
const strike = 100
let seed = 514229
function uniform() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  return (seed + .5) / 4294967296
}
const brownian = Array.from({ length: samples }, () => {
  let value = 0
  const path = [0]
  for (let k = 0; k < steps; k++) {
    const z = Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform())
    value += z / Math.sqrt(steps)
    path.push(value)
  }
  return path
})

export type Payoff = 'call' | 'digital'
export function pricePaths(volatility: number) {
  return brownian.slice(0, 12).map(path =>
    path.map((w, i) => strike * Math.exp((rate - volatility ** 2 / 2) * i / steps + volatility * w)))
}
const featured = pricePaths(.2)[0]
const low = Math.min(...featured)
const high = Math.max(...featured)
export const companionTrace = featured.map(value => (high - value) / (high - low))

function normalCdf(x: number) {
  const t = 1 / (1 + .2316419 * Math.abs(x))
  const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
    * t * (.31938153 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - tail : tail
}
export function estimateDelta(volatility: number, payoff: Payoff) {
  const d1 = (rate + volatility ** 2 / 2) / volatility
  const d2 = d1 - volatility
  const discount = Math.exp(-rate)
  let sum = 0
  for (const path of brownian) {
    const shock = path[steps]
    const relativePrice = Math.exp(rate - volatility ** 2 / 2 + volatility * shock)
    if (relativePrice <= 1) continue
    sum += payoff === 'call' ? relativePrice : shock / (strike * volatility)
  }
  return {
    sampled: discount * sum / samples,
    analytic: payoff === 'call' ? normalCdf(d1) : discount * Math.exp(-d2 * d2 / 2) / (Math.sqrt(2 * Math.PI) * strike * volatility),
  }
}
