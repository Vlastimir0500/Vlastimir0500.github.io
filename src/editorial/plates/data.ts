import * as THREE from 'three'

type DataKind = 'paths' | 'events' | 'shift'
type Plate = { object: THREE.Group; update: (time: number, progress: number) => void }
type Random = () => number

const teal = new THREE.Color('#6fc7c2')
const pale = new THREE.Color('#e7e1d6')
const copper = new THREE.Color('#b87333')
const brightCopper = new THREE.Color('#e0a16c')
const slate = new THREE.Color('#829099')
const near = -2.35
const far = 2.35
const floor = -.91

function seeded(seed: number): Random {
  let state = seed
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function normal(random: Random) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-8, random()))) * Math.cos(2 * Math.PI * random())
}

function point(x: number, y: number, z: number) { return new THREE.Vector3(x, y, z) }
function mix(a: THREE.Color, b: THREE.Color, t: number) { return a.clone().lerp(b, t) }
function clamp(v: number, min: number, max: number) { return THREE.MathUtils.clamp(v, min, max) }

// Combining strokes keeps all the grid lines or paths in a single draw call.
class Strokes {
  private positions: number[] = []
  private colors: number[] = []

  edge(a: THREE.Vector3, b: THREE.Vector3, color: THREE.Color) {
    this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    this.colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
  }

  polyline(points: THREE.Vector3[], color: THREE.Color) {
    for (let i = 1; i < points.length; i++) this.edge(points[i-1], points[i], color)
  }

  addTo(object: THREE.Group, opacity = 1) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3))
    const material = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: opacity < 1, opacity, depthWrite: opacity === 1,
    })
    object.add(new THREE.LineSegments(geometry, material))
  }
}

function grid(object: THREE.Group) {
  const strokes = new Strokes()
  for (let i = 0; i <= 16; i++) {
    const x = THREE.MathUtils.lerp(near, far, i / 16)
    strokes.edge(point(x, floor, -.92), point(x, floor, .92), slate)
    strokes.edge(point(x, floor, .92), point(x, floor + (i % 4 === 0 ? .07 : .035), .92), pale)
  }
  for (let j = 0; j <= 6; j++) {
    const z = -.92 + j * 1.84 / 6
    strokes.edge(point(near, floor, z), point(far, floor, z), slate)
  }
  strokes.addTo(object, .23)
}

function markers(count: number, color: THREE.Color, dynamic = false) {
  const geometry = new THREE.IcosahedronGeometry(1, 0)
  const material = new THREE.MeshBasicMaterial({ color })
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  if (dynamic) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
  }
  return mesh
}

const markerMatrix = new THREE.Matrix4()
function place(mesh: THREE.InstancedMesh, i: number, position: THREE.Vector3, radius: number) {
  markerMatrix.makeScale(radius, radius, radius).setPosition(position)
  mesh.setMatrixAt(i, markerMatrix)
}

function pathsPlate(): Plate {
  const object = new THREE.Group()
  object.name = 'Monte Carlo sample paths'
  const random = seeded(0x9183ae)
  const strokes = new Strokes()
  const paths: THREE.Vector3[][] = []
  const count = 48
  const steps = 100
  grid(object)

  for (let i = 0; i < count; i++) {
    let walk = 0
    const drift = normal(random) * .65
    const depth = ((i + .5) / count - .5) * 1.54
    const path: THREE.Vector3[] = []
    for (let j = 0; j <= steps; j++) {
      const t = j / steps
      if (j) walk += normal(random) * .065
      const displacement = Math.tanh(walk + drift * t + .17*t)
      const y = -.13 + (displacement < 0 ? .74 : 1.16) * displacement
      const z = depth * Math.sqrt(t) + .1 * Math.sin(5.4*t + i*.91) * t
      path.push(point(THREE.MathUtils.lerp(near, far, t), y, z))
    }
    const color = i % 9 === 0 ? mix(copper, brightCopper, .45) : mix(slate, teal, .24 + .72*random())
    strokes.polyline(path, color)
    paths.push(path)
  }
  strokes.addTo(object, .72)

  // A common evaluation time cuts a moving cross-section through the ensemble.
  const samples = markers(count, pale, true)
  const ends = markers(count, teal)
  for (let i = 0; i < count; i++) {
    samples.setColorAt(i, i % 9 === 0 ? brightCopper : mix(pale, teal, random()*.65))
    place(ends, i, paths[i][steps], .016)
    ends.setColorAt(i, i % 9 === 0 ? brightCopper : teal)
  }
  object.add(samples, ends)
  const position = new THREE.Vector3()
  function update(time: number, progress: number) {
    const sample = ((.39 + time*.085 + progress*.52) % 1) * (steps-1)
    const index = Math.floor(sample)
    for(let i = 0; i < count; i++) {
      position.lerpVectors(paths[i][index], paths[i][index+1], sample-index)
      place(samples, i, position, i % 9 === 0 ? .031 : .021)
    }
    samples.instanceMatrix.needsUpdate = true
  }
  update(0, .25)
  return { object, update }
}

type Arrival = { t: number; weight: number }
function clusteredArrivals(centers: number[], random: Random): Arrival[] {
  const arrivals: Arrival[] = []
  for (const center of centers) {
    const count = 4 + Math.floor(random()*5)
    for (let j = 0; j < count; j++) {
      arrivals.push({ t: clamp(center + normal(random)*.023, .018, .958), weight: .58 + .55*random() })
    }
  }
  return arrivals.sort((a,b) => a.t - b.t)
}

function intensity(arrivals: Arrival[], t: number) {
  let value = 0
  for (const event of arrivals) {
    if (event.t > t) break
    value += event.weight * Math.exp(-(t-event.t)*18)
  }
  return value
}

function eventsPlate(): Plate {
  const object = new THREE.Group()
  object.name = 'Hawkes arrival and intensity study'
  grid(object)
  const random = seeded(0x7253ac)
  const lines = new Strokes()
  const pulse = markers(2, pale, true)
  const lanes = [
    { z: -.62, color: teal, arrivals: clusteredArrivals([.08,.27,.47,.54,.82],random) },
    { z: .61, color: brightCopper, arrivals: clusteredArrivals([.13,.32,.45,.68,.87],random) },
  ]
  const roof: THREE.Vector3[][] = []

  lanes.forEach((lane, index) => {
    const sampleCount = 220
    const points: THREE.Vector3[] = []
    const verts: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const minY = floor + .09
    const shade = mix(new THREE.Color('#122026'), lane.color, .11)
    const maxValue = Math.max(...lane.arrivals.map(e => intensity(lane.arrivals,e.t)))
    function surface(t: number) {
      return -.55 + intensity(lane.arrivals,t)/maxValue * 1.58
    }
    for (let j = 0; j <= sampleCount; j++) {
      const t = j / sampleCount
      const x = THREE.MathUtils.lerp(near, far, t)
      const top = point(x,surface(t),lane.z)
      points.push(top)
      verts.push(x,minY,lane.z, x,top.y,lane.z)
      colors.push(shade.r,shade.g,shade.b, lane.color.r,lane.color.g,lane.color.b)
      if (j < sampleCount) {
        const k = j*2
        indices.push(k,k+1,k+2,k+1,k+3,k+2)
      }
      if (j % 5 === 0) lines.edge(point(x,minY,lane.z),top,mix(shade,lane.color,.25))
    }
    const curtain = new THREE.BufferGeometry()
    curtain.setAttribute('position',new THREE.Float32BufferAttribute(verts,3))
    curtain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
    curtain.setIndex(indices)
    object.add(new THREE.Mesh(curtain, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: .44, side: THREE.DoubleSide, depthWrite: false,
    })))
    lines.polyline(points,lane.color)
    roof.push(points)
    const tips = markers(lane.arrivals.length,lane.color)
    lane.arrivals.forEach((event,i) => {
      const x = THREE.MathUtils.lerp(near,far,event.t)
      const z = lane.z + (index === 0 ? -.17 : .17)
      const tip = point(x,minY + .28 + event.weight*.32,z)
      lines.edge(point(x,minY,z),tip,lane.color)
      place(tips,i,tip,.017)
    })
    object.add(tips)
    pulse.setColorAt(index,mix(lane.color,pale,.65))
  })
  lines.addTo(object, .92)
  object.add(pulse)
  const position = new THREE.Vector3()
  function update(time: number, progress: number) {
    const t = (.28 + progress*.52 + time*.075) % 1
    roof.forEach((curve,i) => {
      const fraction = t*(curve.length-1)
      const j = Math.floor(fraction)
      position.lerpVectors(curve[j],curve[j+1],fraction-j)
      place(pulse,i,position,.045)
    })
    pulse.instanceMatrix.needsUpdate = true
  }
  update(0,.2)
  return { object, update }
}

function shiftPlate(): Plate {
  const object = new THREE.Group()
  object.name = 'Domain shift and covariance study'
  const random = seeded(0x06e13c)
  const contour = new Strokes()
  const centers = [point(-1.24,-.05,-.18),point(1.27,.12,.17)]
  const rotations = [
    new THREE.Quaternion().setFromEuler(new THREE.Euler(.28,.29,.52)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-.34,-.26,-.42)),
  ]
  const scales = [point(.54,.27,.28),point(.47,.32,.27)]
  const colors = [teal,brightCopper]
  const pointCount = 350
  const cloud = markers(pointCount*2,pale)

  for (let side = 0; side < 2; side++) {
    const center = centers[side]
    const scale = scales[side]
    const rotation = rotations[side]
    const tone = colors[side]
    for (let j = 0; j < pointCount; j++) {
      const v = point(normal(random), normal(random), normal(random))
      if (v.length() > 2.5) v.setLength(2.5)
      v.multiply(scale).applyQuaternion(rotation).add(center)
      const i = side*pointCount + j
      place(cloud,i,v,.012 + .022*random())
      cloud.setColorAt(i,mix(tone,pale,.34*random()).multiplyScalar(.55+random()*.45))
    }
    // Two nested confidence ellipses and an oblique meridian describe the same covariance.
    for (const [radius,plane] of [[2.24,0],[1.44,0],[2.24,1],[2.24,2]]) {
      const points: THREE.Vector3[] = []
      for (let j=0; j<=88; j++) {
        const a = j*Math.PI*2/88
        const u = Math.cos(a)*radius
        const v = Math.sin(a)*radius
        const p = plane === 0 ? point(u,v,0) : plane === 1 ? point(u,0,v) : point(0,u,v)
        points.push(p.multiply(scale).applyQuaternion(rotation).add(center))
      }
      contour.polyline(points,mix(tone,slate,plane === 0 ? .12 : .45))
    }
  }
  object.add(cloud)
  contour.addTo(object,.73)

  const streams = new Strokes()
  const curves: THREE.CubicBezierCurve3[] = []
  const streamCount = 10
  const particles = markers(streamCount,pale,true)
  for(let i=0; i<streamCount; i++) {
    const angle = i*Math.PI*2/streamCount
    const y = Math.cos(angle)*.27
    const z = Math.sin(angle)*.31
    const curve = new THREE.CubicBezierCurve3(
      point(-.93,y-.07,z-.18),point(-.4,y+.45,z-.13),
      point(.34,-y-.36,-z+.15),point(.99,-y+.15,-z+.17),
    )
    curves.push(curve)
    streams.polyline(curve.getPoints(42),mix(teal,slate,.48))
    particles.setColorAt(i,mix(pale,teal,.28))
  }
  streams.addTo(object,.34)
  object.add(particles)
  const position = new THREE.Vector3()
  function update(time: number, progress: number) {
    curves.forEach((curve,i) => {
      const t = (.17 + i*.618 + time*.095 + progress*.54) % 1
      curve.getPoint(t,position)
      const radius = .015 + .018*Math.sin(t*Math.PI)
      place(particles,i,position,radius)
    })
    particles.instanceMatrix.needsUpdate = true
  }
  update(0,.2)
  return { object, update }
}

export function createDataPlate(kind: DataKind): Plate {
  if (kind === 'paths') return pathsPlate()
  if (kind === 'events') return eventsPlate()
  return shiftPlate()
}
