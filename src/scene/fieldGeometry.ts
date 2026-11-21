import * as THREE from 'three'

export type FieldVariant = 0 | 1 | 2

// A thin, rounded section sweeps once around the loop. Its local frame turns
// through half a revolution, joining each face to the opposite face at u = 1.
export function makeFieldGeometry() {
  const segments = 400
  const section: { v: number; h: number; side: number }[] = []
  for (let j = 0; j <= 72; j++) section.push({ v: -1 + j / 36, h: 1, side: 0 })
  for (let j = 1; j <= 10; j++) {
    const a = Math.PI * j / 10
    section.push({ v: 1 + .045 * Math.sin(a), h: Math.cos(a), side: Math.sin(a) })
  }
  for (let j = 1; j <= 72; j++) section.push({ v: 1 - j / 36, h: -1, side: 0 })
  for (let j = 1; j <= 10; j++) {
    const a = Math.PI * j / 10
    section.push({ v: -1 - .045 * Math.sin(a), h: -Math.cos(a), side: Math.sin(a) })
  }

  const positions: number[] = [], uv: number[] = [], edges: number[] = []
  const indices: number[] = [], envelope: number[] = []
  const stride = section.length
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    const theta = Math.PI * 2 * u
    const roll = theta * .5 + .39 * Math.sin(theta - .72) + .38
    const width = .72 + .13 * Math.cos(theta + .65)
    const radius = 1.46 + .08 * Math.cos(2 * theta - .2)
    const lift = .32 * Math.sin(2 * theta - .55)
    for (let j = 0; j < stride; j++) {
      const { v, h, side } = section[j]
      const crown = (.046 + .004 * Math.cos(v * Math.PI * 12)) * (1 - Math.min(1, v * v))
      const normalOffset = h * (.037 + crown)
      const radial = radius + width * v * Math.cos(roll) - normalOffset * Math.sin(roll)
      const x = Math.cos(theta) * radial
      const y = Math.sin(theta) * radial
      const z = lift + width * v * Math.sin(roll) + normalOffset * Math.cos(roll)
      positions.push(x, y, z)
      uv.push(u, v * .5 + .5)
      edges.push(side)
      if (i % 5 === 0 && j % 4 === 0) envelope.push(x, y, z)
      if (i < segments && j < stride - 1) {
        const a = i * stride + j, b = a + stride
        indices.push(a, a + 1, b, b, a + 1, b + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setAttribute('rim', new THREE.Float32BufferAttribute(edges, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  geometry.userData.envelope = new Float32Array(envelope)
  return geometry
}

export function makeFieldMaterial(mode: FieldVariant) {
  const labelPlate = document.createElement('canvas')
  labelPlate.width = 2048
  labelPlate.height = 128
  const ink = labelPlate.getContext('2d')!
  ink.fillStyle = '#000'
  ink.fillRect(0, 0, 2048, 128)
  ink.fillStyle = '#fff'
  ink.font = '500 9px monospace'
  for (let i = 0; i < 8; i++) {
    ink.fillText('MB–01 / ' + String(i * 45).padStart(3, '0') + '°', i * 256 + 6, 28)
  }
  const markings = new THREE.CanvasTexture(labelPlate)
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { study: { value: mode }, markings: { value: markings } },
    vertexShader: `
      attribute float rim;
      varying vec2 bandUV;
      varying float bevel;
      varying vec3 surface;
      void main() {
        bandUV = uv;
        bevel = rim;
        surface = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform int study;
      uniform sampler2D markings;
      varying vec2 bandUV;
      varying float bevel;
      varying vec3 surface;
      float line(float x, float thickness) {
        float pixel = max(.01, fwidth(x));
        float edge = abs(fract(x + .5) - .5);
        float coverage = 1. - smoothstep(thickness - pixel * .5, thickness + pixel * .5, edge);
        return mix(coverage, 2. * thickness, smoothstep(.32, .92, pixel));
      }
      float stripe(float x, float center, float halfWidth) {
        float aa = max(fwidth(x), .0005);
        return 1. - smoothstep(halfWidth - aa, halfWidth + aa, abs(x - center));
      }
      void main() {
        float u = bandUV.x, v = bandUV.y;
        float width = abs(v - .5) * 2.;
        vec3 n = normalize(surface);
        if (n.z < 0.) n = -n;
        vec3 r = reflect(vec3(0., 0., -1.), n);
        float key = .5 + .5 * dot(n, normalize(vec3(-.45,.78,.65)));
        float rimLight = pow(1.-abs(n.z), 1.65);
        // Broad overhead softboxes and a narrow strip light reflected in the metal.
        float softbox = exp(-pow((dot(r, normalize(vec3(-.28,.86,.42))) - .43) * 3.1, 2.));
        float narrow = exp(-pow((dot(r, normalize(vec3(.88,.18,.38))) - .35) * 8., 2.));
        float horizon = smoothstep(-.7,.65,r.y);
        float lighting = clamp(.07 + .22 * key + .40 * softbox + .25 * narrow + .15 * horizon + .20 * rimLight, .05, 1.13);
        vec3 darkSteel = vec3(.058,.086,.099);
        vec3 titanium = mix(darkSteel, vec3(.89,.89,.845), pow(lighting, 1.55));
        float brushing = .5 + .5 * sin(96. * v + 2. * sin(u * 12.5664));
        titanium *= .94 + .06 * brushing;
        vec3 copper = mix(vec3(.17,.070,.033), vec3(.95,.67,.43), lighting);
        vec3 teal = mix(vec3(.053,.14,.16), vec3(.55,.83,.83), lighting);
        float nearEdge = smoothstep(.959,.984,width);
        float fillet = clamp(nearEdge + bevel,0.,1.);
        float channels = line(v * 57.,.105) * (1.-smoothstep(.65,.75,width));
        float primaryRibs = line(v * 16.,.055);
        float milled = line(v * 180.,.075);
        float panels = line(u * 38. + floor(v * 8.) * .5,.025)
                     * smoothstep(.50,.67,width) * (1.-smoothstep(.86,.90,width));
        float edgeRail = stripe(width,.84,.017) + stripe(width,.92,.006);
        float graduations = line(u * 310., .10) * stripe(width,.776,.022)
                          + line(u * 62.,.065) * stripe(width,.748,.048);
        float apertures = stripe(width,.875,.009) * line(u * 64.,.14);
        vec3 color = titanium * (1.-.18*channels-.25*primaryRibs-.08*milled);
        color += vec3(.13,.15,.16) * line(v*57.+.17,.06) * lighting;
        color = mix(color,copper,clamp(edgeRail*.92 + fillet*.85,0.,1.));
        color = mix(color,vec3(.035,.065,.077),clamp(panels*.85 + apertures*.9,0.,1.));
        color += teal * graduations * .47;
        if (study == 1) {
          float contour = line(v*49.,.085) + .41*line(u*120.,.065);
          color = vec3(.025,.053,.065) + teal * contour * (.56 + lighting*.63);
          color += copper * (edgeRail + graduations*.55) + fillet * titanium * .47;
        } else if (study == 2) {
          float ribs = line(u*104.,.14);
          float rails = line(v*10.,.075);
          float window = smoothstep(.09,.18,abs(fract(u*104.)-.5));
          color = mix(vec3(.024,.043,.053), titanium*(.65+.35*window), clamp(ribs+rails,0.,1.));
          color += copper * (edgeRail + fillet*.66) + teal * graduations * .54;
        }
        float etching = texture2D(markings, bandUV).r;
        color *= 1. - .34 * line(bevel * 4., .085) * bevel;
        color = mix(color, lighting > .53 ? vec3(.085,.12,.13) : vec3(.75,.79,.77), etching * .82);
        gl_FragColor = vec4(color, 1.);
      }
    `,
  })
  material.addEventListener('dispose', () => markings.dispose())
  return material
}

const rotationMatrix = new THREE.Matrix4()
export function poseField(object: THREE.Mesh, progress: number, time: number, width: number, height: number, pointer: THREE.Vector2) {
  const p = THREE.MathUtils.clamp(progress, 0, 1)
  object.rotation.set(.58 + .07 * Math.sin(time * .15) + p * .44 + pointer.y * .035,
    .60 + .11 * Math.sin(time * .14) - p * .48 + pointer.x * .055, .20 - p * .64, 'ZXY')
  const m = rotationMatrix.makeRotationFromEuler(object.rotation).elements
  const envelope: Float32Array = object.geometry.userData.envelope
  let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity
  for (let i = 0; i < envelope.length; i += 3) {
    const x = envelope[i], y = envelope[i + 1], z = envelope[i + 2]
    const sx = m[0]*x + m[4]*y + m[8]*z
    const sy = m[1]*x + m[5]*y + m[9]*z
    left = Math.min(left,sx); right = Math.max(right,sx)
    bottom = Math.min(bottom,sy); top = Math.max(top,sy)
  }
  const scale = Math.min(.91 * width/(right-left), .89 * height/(top-bottom))
  object.scale.setScalar(scale)
  object.position.set(-scale*(left+right)/2, -scale*(top+bottom)/2, 0)
}

