import * as THREE from 'three'
import { neutralTour, tourValue, type TourMix } from './plateTypes'

// All masks are drawn in package coordinates. The artwork is a procedural
// study of a die and carrier rather than a photomicrograph of fabricated silicon.
function artwork(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is required to create the package masks')
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function dieMask() {
  return artwork(960, 696, ctx => {
    ctx.fillStyle = '#382f31'
    ctx.fillRect(0, 0, 960, 696)
    const metal = ['#b19870', '#ad9986', '#a09aa8', '#aeb3a9', '#a09078', '#a1a7b2']
    let seed = 23017
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    function bank(x: number, y: number, w: number, h: number, tone: number, dense: boolean) {
      ctx.fillStyle = '#352f34'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = metal[tone % metal.length]
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
      const pitch = dense ? 5 : 9
      for (let row = y + 5; row < y + h - 4; row += pitch) {
        let end = x + 5
        while (end < x + w - 5) {
          const span = Math.min(x + w - 5 - end, (dense ? 4 : 10) + random() * (dense ? 15 : 26))
          ctx.fillStyle = metal[(tone + Math.floor(random() * 3)) % metal.length]
          ctx.globalAlpha = .43 + random() * .55
          ctx.fillRect(end, row, span, pitch - (dense ? 1.25 : 2.6))
          end += span + 2
        }
      }
      ctx.globalAlpha = 1
      for (let col = x + 18; col < x + w - 4; col += 37) {
        ctx.fillStyle = '#d7b984aa'
        ctx.fillRect(col, y + 3, 1.3, h - 6)
      }
    }
    for (const side of [0, 1]) {
      const left = 44 + side * 459
      // A repeated memory macro contrasts with the irregular standard cells.
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          bank(left + col * 139, 40 + row * 42, 132, 35, side ? 1 : 4, true)
        }
      }
      let y = 222
      for (const height of [110, 123, 108, 58]) {
        let x = left
        const cuts = [110 + random() * 88, 99 + random() * 70]
        for (const [index, width] of [...cuts, 408 - cuts[0] - cuts[1]].entries()) {
          bank(x, y, width, height, (index + Math.floor(random() * 6)) % 6, random() > .5)
          x += width + 5
        }
        y += height + 8
      }
    }
    // Diagonal interconnect bends and long trunk lines keep the layout legible
    // after mipmapping in the smaller project cards.
    ctx.lineWidth = 2.3
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = i % 3 === 0 ? '#a7c4c6' : '#c6a479'
      ctx.beginPath()
      ctx.moveTo(461 + i * 4, 27)
      ctx.lineTo(461 + i * 4, 315 + i * 4)
      ctx.lineTo(470 + i * 4, 324 + i * 4)
      ctx.lineTo(470 + i * 4, 662)
      ctx.stroke()
    }
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#cbac7e', '#565958', '#c6b29b'][i]
      ctx.lineWidth = 2
      ctx.strokeRect(10 + i * 4, 10 + i * 4, 940 - i * 8, 676 - i * 8)
    }
    ctx.fillStyle = '#e4c9a2'
    for (let x = 30; x < 940; x += 16) {
      ctx.fillRect(x, 5, 6, 5)
      ctx.fillRect(x, 686, 6, 5)
    }
    for (let y = 30; y < 670; y += 16) {
      ctx.fillRect(5, y, 5, 6)
      ctx.fillRect(949, y, 5, 6)
    }
  })
}

function boardMask() {
  return artwork(1040, 820, ctx => {
    ctx.fillStyle = '#1c2527'
    ctx.fillRect(0, 0, 1040, 820)
    for (let flip = 0; flip < 4; flip++) {
      ctx.save()
      ctx.translate(520, 410)
      ctx.rotate(flip * Math.PI / 2)
      const longSide = flip % 2 === 0
      const extent = longSide ? 395 : 505
      const count = longSide ? 35 : 27
      for (let i = -count; i <= count; i++) {
        const x = i * 13
        const insetX = x * .84
        const shoulder = extent - 20 - (Math.abs(i) % 7) * 5
        ctx.strokeStyle = i % 7 === 0 ? '#91a49a' : i % 3 === 0 ? '#a57f60' : '#776c59'
        ctx.lineWidth = i % 7 === 0 ? 2.7 : 1.45
        ctx.beginPath()
        ctx.moveTo(x, extent - 4)
        ctx.lineTo(x, shoulder)
        ctx.lineTo(insetX, shoulder - Math.abs(x - insetX))
        ctx.lineTo(insetX, extent - 145)
        ctx.stroke()
        ctx.fillStyle = i % 4 === 0 ? '#caa47b' : '#92938a'
        ctx.fillRect(x - 2.9, extent - 5, 5.8, 8)
      }
      ctx.restore()
    }
    ctx.strokeStyle = '#998268'
    ctx.lineWidth = 2
    ctx.strokeRect(13, 13, 1014, 794)
  })
}

function beveledPath(w: number, d: number, corner: number, hole = false) {
  const x = w / 2, z = d / 2
  const points = [
    [-x + corner, -z], [x - corner, -z], [x, -z + corner], [x, z - corner],
    [x - corner, z], [-x + corner, z], [-x, z - corner], [-x, -z + corner],
  ]
  if (hole) points.reverse()
  return points.map(([a, b]) => new THREE.Vector2(a, b))
}

function layer(w: number, d: number, h: number, chamfer: number, bevel: number,
  mat: THREE.Material, cavity?: { w: number; d: number; z: number }) {
  const shape = new THREE.Shape(beveledPath(w, d, chamfer))
  if (cavity) {
    const contour = beveledPath(cavity.w, cavity.d, .075, true)
    for (const point of contour) point.y -= cavity.z
    shape.holes.push(new THREE.Path(contour))
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: h, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 3, steps: 1, curveSegments: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function topFace(w: number, d: number, map: THREE.Texture, metallic: number, rough: number) {
  const geometry = new THREE.PlaneGeometry(w, d)
  geometry.rotateX(-Math.PI / 2)
  const face = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map, metalness: metallic, roughness: rough, color: '#ffffff',
  }))
  face.receiveShadow = true
  return face
}

/** Exposed die, interposer, package carrier and perimeter contacts. */
export function createHardware(): { object: THREE.Group; update: (time: number, progress: number, tour?:TourMix) => void } {
  const object = new THREE.Group()
  const copper = new THREE.MeshStandardMaterial({color: '#bc8765', metalness: .72, roughness: .33})
  const ceramic = new THREE.MeshStandardMaterial({color: '#394248', metalness: .38, roughness: .34})
  const graphite = new THREE.MeshStandardMaterial({color: '#21292c', metalness: .32, roughness: .48})
  const silver = new THREE.MeshStandardMaterial({color: '#d3d2c9', metalness: .72, roughness: .27})
  const nickel = new THREE.MeshStandardMaterial({color: '#929d9c', metalness: .72, roughness: .3})
  const gold = new THREE.MeshStandardMaterial({color: '#d2ac7b', metalness: .68, roughness: .36})

  const base = layer(4.12, 3.22, .145, .13, .018, graphite)
  base.position.y = -.48
  const seam = layer(4.14, 3.24, .046, .13, .009, copper)
  seam.position.y = -.32
  const substrate = layer(4.12, 3.22, .12, .13, .016, ceramic)
  substrate.position.y = -.259
  const traces = topFace(4.02, 3.12, boardMask(), .44, .42)
  traces.position.y = -.12
  object.add(base, seam, substrate, traces)

  // Gull-wing leads are one instanced mesh, including their downward bends.
  const profile = new THREE.Shape([
    new THREE.Vector2(0, 0), new THREE.Vector2(.085, 0),
    new THREE.Vector2(.108, -.079), new THREE.Vector2(.192, -.079),
    new THREE.Vector2(.192, -.042), new THREE.Vector2(.14, -.042),
    new THREE.Vector2(.116, .039), new THREE.Vector2(0, .039),
  ])
  const contact = new THREE.ExtrudeGeometry(profile, {
    depth:.039, bevelEnabled:true, bevelThickness:.004, bevelSize:.004, bevelSegments:1, steps:1,
  })
  contact.translate(0, 0, -.0195)
  const leads = new THREE.InstancedMesh(contact, nickel, 112)
  const cursor = new THREE.Object3D()
  let index = 0
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 25; i++) {
      cursor.position.set(sign * 2.045, -.35, (i - 12) * .116)
      cursor.rotation.y = sign > 0 ? 0 : Math.PI
      cursor.updateMatrix()
      leads.setMatrixAt(index++, cursor.matrix)
    }
    for (let i = 0; i < 31; i++) {
      cursor.position.set((i - 15) * .121, -.35, sign * 1.59)
      cursor.rotation.y = -sign * Math.PI / 2
      cursor.updateMatrix()
      leads.setMatrixAt(index++, cursor.matrix)
    }
  }
  leads.castShadow = true
  object.add(leads)

  const packageGroup = new THREE.Group()
  object.add(packageGroup)
  const dieAssembly = new THREE.Group()
  packageGroup.add(dieAssembly)
  const foot = layer(3.44, 2.61, .135, .135, .035, graphite)
  foot.position.y = -.063
  const interposer = layer(3.3, 2.49, .045, .125, .015, copper)
  interposer.position.y = .102
  const wall = layer(3.29, 2.49, .15, .135, .029, ceramic)
  wall.position.y = .17
  const cavityZ = -.095
  const bezel = layer(3.24, 2.46, .093, .14, .041, silver, { w: 2.49, d: 1.76, z: cavityZ })
  bezel.position.y = .362
  const darkWell = layer(2.48, 1.75, .026, .06, .008, graphite)
  darkWell.position.set(0, .34, cavityZ)
  const dieBase = layer(1.99, 1.39, .047, .012, .008, nickel)
  dieBase.position.set(0, .367, cavityZ)
  const die = topFace(1.985, 1.389, dieMask(), .43, .34)
  die.position.set(0, .424, cavityZ)
  const carrierFace = topFace(3.13, 2.33, traces.material.map!, .5, .39)
  carrierFace.position.y = .351
  packageGroup.add(foot, interposer, wall, carrierFace)
  dieAssembly.add(darkWell, dieBase, die, bezel)

  // Bond wires bridge the cutaway between the die and the carrier. Their
  // arched cross sections catch the same studio lights as the bezel.
  const vertices: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3(), direction = new THREE.Vector3()
  const across = new THREE.Vector3(), up = new THREE.Vector3()
  function bond(x: number, z: number, tx: number, tz: number) {
    const start = vertices.length / 3
    across.set(-(tz - z), 0, tx - x).normalize()
    for (let step = 0; step <= 8; step++) {
      const t = step / 8
      const arch = 4 * t * (1 - t)
      point.set(x + (tx - x) * t, .42 - .036 * t + .082 * arch, z + (tz - z) * t + cavityZ)
      direction.set(tx - x, -.036 + .328 * (1 - 2 * t), tz - z).normalize()
      up.crossVectors(direction, across).normalize()
      for (let j = 0; j < 5; j++) {
        const c = Math.cos(j * Math.PI * .4) * .0065, s = Math.sin(j * Math.PI * .4) * .0065
        vertices.push(point.x + across.x * c + up.x * s, point.y + up.y * s, point.z + across.z * c + up.z * s)
        if (step === 8) continue
        const a = start + step * 5 + j, b = start + step * 5 + (j + 1) % 5
        indices.push(a, b, a + 5, b, b + 5, a + 5)
      }
    }
  }
  for (const sign of [-1, 1]) {
    for (let i = -8; i <= 8; i++) bond(i * .11, sign * .68, i * .125, sign * .84)
    for (let i = -5; i <= 5; i++) bond(sign * .98, i * .121, sign * 1.207, i * .14)
  }
  const wireGeometry = new THREE.BufferGeometry()
  wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  wireGeometry.setIndex(indices)
  wireGeometry.computeVertexNormals()
  dieAssembly.add(new THREE.Mesh(wireGeometry, gold))

  const name = artwork(800, 96, ctx => {
    ctx.fillStyle = '#3a4444'
    ctx.font = 'bold 74px Arial, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('MORPH', 5, 49)
    ctx.fillStyle = '#535e5b'
    for (let i = 0; i < 29; i++) ctx.fillRect(548 + i * 7, 24, i % 4 === 0 ? 3.5 : 2, i % 4 === 0 ? 48 : 29)
  })
  const marking = topFace(1.32, .159, name, .25, .55)
  marking.material.transparent = true
  marking.material.depthWrite = false
  marking.position.set(-.73, .499, 1.018)
  dieAssembly.add(marking)

  const screws = new THREE.InstancedMesh(new THREE.CylinderGeometry(.043, .046, .011, 16), graphite, 4)
  const slots = new THREE.InstancedMesh(new THREE.BoxGeometry(.057, .003, .008), nickel, 4)
  index = 0
  for (const x of [-1.43, 1.43]) for (const z of [-1.01, 1.01]) {
    cursor.rotation.set(0, .61, 0)
    cursor.position.set(x, .499, z)
    cursor.updateMatrix()
    screws.setMatrixAt(index, cursor.matrix)
    cursor.position.y += .007
    cursor.updateMatrix()
    slots.setMatrixAt(index++, cursor.matrix)
  }
  dieAssembly.add(screws, slots)
  object.position.y = .015

  return {
    object,
    update(time, progress, tour=neutralTour) {
      const lift = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(progress, 0, 1), .1, .94)
      const phase = .5 - .5 * Math.cos(time * .62 + 1.15)
      const carrierLift = THREE.MathUtils.smoothstep(phase, 0, .85)
      const dieLift = THREE.MathUtils.smoothstep(phase, .14, 1)
      packageGroup.position.y = tourValue(tour,.04 + .17 * lift + .27 * carrierLift,.56,.27,.32)
      dieAssembly.position.y = tourValue(tour,.02 + .16 * lift + .51 * dieLift,.79,.49,.77)
      dieAssembly.position.x = -.76 * tour[2]
      dieAssembly.position.z = -.25 * tour[2]
      gold.emissive.setRGB(.25*tour[1],.13*tour[1],.04*tour[1])
      object.rotation.y = -.13 + .10 * lift + .06 * Math.sin(time * .26)
    },
  }
}
