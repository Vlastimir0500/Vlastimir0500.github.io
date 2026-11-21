import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createHardware } from './hardware'
import { createDataPlate } from './data'
import { createNetworkPlate } from './network'
import type { PlateKind } from './plateTypes'

function floorGrid(height: number) {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: `
      varying vec2 coordinate;
      void main() {
        coordinate = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      varying vec2 coordinate;
      void main() {
        vec2 lattice = coordinate * 2.;
        vec2 lines = abs(fract(lattice-.5)-.5) / max(fwidth(lattice), vec2(.0001));
        float line = 1.-min(min(lines.x,lines.y),1.);
        float fade = exp(-dot(coordinate,coordinate)*.065);
        gl_FragColor = vec4(.49,.62,.68, line*fade*.23);
      }
    `,
  })
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(22,22),material)
  grid.rotation.x = -Math.PI / 2
  grid.position.y = height
  return grid
}

export function createPlateStage(canvas: HTMLCanvasElement, kind: PlateKind) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  const hardware = kind === 'hardware'
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.04
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-4,4,2.5,-2.5,.1,40)
  const assembly = hardware ? createHardware() : kind === 'graph' || kind === 'filter' ? createNetworkPlate(kind) : createDataPlate(kind)
  scene.add(assembly.object)
  const environment = new RoomEnvironment()
  const prefilter = new THREE.PMREMGenerator(renderer)
  const reflection = prefilter.fromScene(environment, .045)
  scene.environment = reflection.texture
  scene.environmentIntensity = .83
  environment.dispose()
  prefilter.dispose()
  scene.add(new THREE.HemisphereLight(0xd6f0f7,0x493628,1.0))
  const key = new THREE.DirectionalLight(0xffebd2,2.8)
  key.position.set(-3.4,6.6,3.8)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x99d9e1,2.25)
  rim.position.set(3,2.4,-4.2)
  scene.add(rim)

  const groundY = hardware ? -.53 : -1.19
  scene.add(floorGrid(groundY))
  if (hardware) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    key.castShadow = true
    key.shadow.mapSize.set(512,512)
    Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.2,far:16})
    key.shadow.camera.updateProjectionMatrix()
    key.shadow.normalBias = .015
    key.shadow.bias = -.0006
    assembly.object.traverse(child=>{
      if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true }
    })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.ShadowMaterial({ opacity:.4, depthWrite:false }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = groundY + .002
    ground.receiveShadow = true
    scene.add(ground)
  }
  let lastWidth = 0, lastHeight = 0, lastDpr = 0
  const targetHeight = hardware ? .25 : -.03
  const center = new THREE.Vector3(0,targetHeight,0)
  function draw(width:number, height:number, dpr:number, time:number, progress:number, yaw:number, pitch:number) {
    if (width <= 0 || height <= 0) return
    if (width !== lastWidth || height !== lastHeight || dpr !== lastDpr) {
      lastWidth = width
      lastHeight = height
      lastDpr = dpr
      renderer.setPixelRatio(dpr)
      renderer.setSize(width,height,false)
      const ratio = width/height
      const imageWidth = Math.max(hardware ? 6.85 : 5.9, (hardware ? 4.3 : 2.64)*ratio)
      camera.left = -imageWidth/2
      camera.right = imageWidth/2
      camera.top = imageWidth/(2*ratio)
      camera.bottom = -camera.top
      camera.updateProjectionMatrix()
    }
    assembly.update(time,progress)
    const angle = (hardware ? .63 : .23) + yaw + .14*Math.sin(time*.28) + (progress-.5)*.14
    const elevation = THREE.MathUtils.clamp((hardware ? .55 : .22) + pitch + .034*Math.sin(time*.20), .045,1.15)
    const horizontal = Math.cos(elevation)*9
    camera.position.set(Math.sin(angle)*horizontal, targetHeight+Math.sin(elevation)*9, Math.cos(angle)*horizontal)
    camera.lookAt(center)
    renderer.render(scene,camera)
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()
    scene.traverse(child=>{
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
        geometries.add(child.geometry)
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material)
        if (child instanceof THREE.InstancedMesh) child.dispose()
      }
    })
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
      material.dispose()
    }
    textures.forEach(texture=>texture.dispose())
    geometries.forEach(geometry=>geometry.dispose())
    key.shadow.dispose()
    reflection.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
  return { draw, dispose }
}

