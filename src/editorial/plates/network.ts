import * as THREE from 'three'
import { neutralTour, tourValue, type TourMix } from './plateTypes'

const brass = 0xd99963
const cyan = 0x79c3c5
const silver = 0xd4dfdf

function wires(points: THREE.Vector3[], color: number, opacity: number) {
  return new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, opacity, transparent: true, depthWrite: false }),
  )
}

function metal(color: number, roughness = .32) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: .68 })
}

function network() {
  const object = new THREE.Group()
  const globe = new THREE.Group()
  object.add(globe)
  const count = 76
  const positions: THREE.Vector3[] = []
  const sphere: THREE.Vector3[] = []
  const struts: THREE.Vector3[] = []
  const indices = [9, 33, 49, 64]
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(.038, 12, 8), metal(cyan), count)
  const matrix = new THREE.Matrix4()
  for (let i = 0; i < count; i++) {
    const y = 1 - 2 * (i + .5) / count
    const radius = Math.sqrt(1 - y * y)
    const longitude = i * 2.39996323
    sphere.push(new THREE.Vector3(radius * Math.cos(longitude), y, radius * Math.sin(longitude)))
    const point = sphere[i].clone().multiply(new THREE.Vector3(2.03, 1.07, 1.12))
    positions.push(point)
    nodes.setMatrixAt(i, matrix.makeTranslation(point.x, point.y, point.z))
  }
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (sphere[i].distanceToSquared(sphere[j]) < .285) struts.push(positions[i], positions[j])
    }
  }
  const shell = wires(struts, cyan, .51)
  nodes.material.transparent = true
  globe.add(nodes, shell)
  const selected = indices.map(i => positions[i])
  const route: THREE.Vector3[] = []
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(.091, 22, 12), metal(brass, .24), selected.length)
  const bands = new THREE.TorusGeometry(.134, .007, 6, 34)
  const bandMetal = metal(0xf2b37b)
  const halos: THREE.Mesh[] = []
  selected.forEach((point, i) => {
    dots.setMatrixAt(i, matrix.makeTranslation(point.x, point.y, point.z))
    const halo = new THREE.Mesh(bands, bandMetal)
    halo.position.copy(point)
    halo.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), sphere[indices[i]])
    globe.add(halo)
    halos.push(halo)
    route.push(point, selected[(i + 1) % selected.length])
  })
  globe.add(dots, wires(route, brass, .95))
  const moving = new THREE.InstancedMesh(
    new THREE.SphereGeometry(.040, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffddb5 }), selected.length,
  )
  globe.add(moving)
  const position = new THREE.Vector3()
  return { object, update(time: number, progress: number, tour:TourMix=neutralTour) {
    globe.rotation.set(.13 + Math.sin(time * .23) * .045, time * .105 + progress * .26 + .48*tour[0]-.29*tour[1], -.12)
    nodes.material.opacity = tourValue(tour,1,1,.55,.13)
    shell.material.opacity = tourValue(tour,.51,.64,.30,.07)
    const glow = .18*tour[1] + .33*tour[2]
    dots.material.emissive.setRGB(glow,glow*.48,glow*.22)
    halos.forEach(halo=>halo.scale.setScalar(1 + .50*tour[1] + .24*tour[2]))
    selected.forEach((point, i) => {
      const along = (time * .24 + .23 * i) % 1
      position.lerpVectors(point, selected[(i + 1) % selected.length], along)
      moving.setMatrixAt(i, matrix.makeTranslation(position.x, position.y, position.z))
    })
    moving.instanceMatrix.needsUpdate = true
  } }
}

function filter() {
  const object = new THREE.Group()
  const gates = new THREE.Group()
  const width = 1.72, height = 1.92
  const shape = new THREE.Shape()
  shape.moveTo(-width/2+.12, -height/2)
  shape.lineTo(width/2-.12, -height/2)
  shape.lineTo(width/2, -height/2+.12)
  shape.lineTo(width/2, height/2-.12)
  shape.lineTo(width/2-.12, height/2)
  shape.lineTo(-width/2+.12,height/2)
  shape.lineTo(-width/2,height/2-.12)
  shape.lineTo(-width/2,-height/2+.12)
  shape.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-.71,-.80); hole.lineTo(-.71,.80); hole.lineTo(.71,.80); hole.lineTo(.71,-.80); hole.closePath()
  shape.holes.push(hole)
  const frameGeometry = new THREE.ExtrudeGeometry(shape, { depth: .075, bevelEnabled:true, bevelSegments:2, bevelSize:.018, bevelThickness:.013 })
  const glass = new THREE.MeshBasicMaterial({ color:0x82b8c1, side:THREE.DoubleSide, transparent:true, opacity:.12, depthWrite:false })
  const grill: THREE.Vector3[] = []
  for (let j = -6; j <= 6; j++) grill.push(new THREE.Vector3(j*.107,-.79,.045),new THREE.Vector3(j*.107,.79,.045))
  for (let j = -7; j <= 7; j++) grill.push(new THREE.Vector3(-.70,j*.105,.045),new THREE.Vector3(.70,j*.105,.045))
  for (let i = 0; i < 3; i++) {
    const plate = new THREE.Group()
    const frame = new THREE.Mesh(frameGeometry, metal([0x82949d,0x42535d,brass][i]))
    plate.add(frame, wires(grill, i===2 ? brass : silver,.53))
    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(1.42,1.6),glass)
    glassPane.position.z = .025
    plate.add(glassPane)
    plate.rotation.y = Math.PI * .34
    plate.position.x = (i - 1) * .52
    gates.add(plate)
  }
  object.add(gates)
  const matrix = new THREE.Matrix4()
  const curves: THREE.Curve<THREE.Vector3>[] = []
  const lanePoints:THREE.Vector3[] = []
  const traces:THREE.Vector3[] = []
  for (let i=0; i<19; i++) {
    const spread = (i-9)/9
    const y = spread * .92
    const z = Math.sin(i*1.87)*.56
    const passed = i%3===0
    const path = [
      new THREE.Vector3(-2.63, y, z), new THREE.Vector3(-1.75,y,z),
      new THREE.Vector3(-1.13,y*.7,z*.6), new THREE.Vector3(-.56,y*.61,z*.50),
    ]
    if (passed) path.push(new THREE.Vector3(.62,y*.61,z*.50),new THREE.Vector3(1.17,y*.61,z*.50),new THREE.Vector3(1.76,y*.88,z),new THREE.Vector3(2.63,y*.88,z))
    const curve = new THREE.CatmullRomCurve3(path,false,'centripetal')
    curves.push(curve)
    const samples = curve.getPoints(42)
    for(let k=1;k<samples.length;k++)(passed ? traces : lanePoints).push(samples[k-1],samples[k])
  }
  const incoming = wires(lanePoints,cyan,.40)
  const outgoing = wires(traces,brass,.77)
  object.add(incoming, outgoing)
  const packets = new THREE.InstancedMesh(new THREE.SphereGeometry(.037,12,8),new THREE.MeshBasicMaterial(),curves.length)
  curves.forEach((_,i)=>packets.setColorAt(i,new THREE.Color(i%3===0?0xffbf87:0x9ee6e3)))
  object.add(packets)
  const sample = new THREE.Vector3()
  return {object, update(time:number, progress:number, tour:TourMix=neutralTour) {
    const gap = tourValue(tour,.51+.16*progress+.048*Math.sin(time*.66),.43,.99,.71)
    gates.children.forEach((plate,i)=>{plate.position.x=(i-1)*gap})
    incoming.material.opacity = tourValue(tour,.40,.87,.55,.16)
    outgoing.material.opacity = tourValue(tour,.77,.47,.60,1)
    glass.opacity = tourValue(tour,.12,.09,.24,.11)
    curves.forEach((curve,i)=>{
      const base = (time * (i%3===0 ? .19 : .27) + i*.271) % 1
      const along = tourValue(tour,base,.08+.21*base,.46+.12*base,i%3===0?.80+.19*base:.98)
      curve.getPoint(along, sample)
      const size = tourValue(tour,1,1.22,1.24,i%3===0?1.55:.22)
      matrix.makeScale(size,size,size).setPosition(sample)
      packets.setMatrixAt(i,matrix)
    })
    packets.instanceMatrix.needsUpdate = true
  }}
}

export function createNetworkPlate(kind: 'graph' | 'filter') {
  return kind === 'graph' ? network() : filter()
}

