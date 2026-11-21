import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeFieldGeometry, makeFieldMaterial, poseField } from './fieldGeometry'
import type { FieldVariant } from './fieldGeometry'

type CanvasProps = {
  progress: RefObject<number>
  variant: FieldVariant
  paused: boolean
  active: boolean
  onReady: () => void
  onLoss: () => void
}

function Engraving({ progress, variant, paused, active, onReady, onLoss }: CanvasProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const { invalidate, gl } = useThree()
  const time = useRef(0)
  const smoothPointer = useMemo(() => new THREE.Vector2(), [])
  const geometry = useMemo(() => makeFieldGeometry(), [])
  const material = useMemo(() => makeFieldMaterial(variant), [variant])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', onLoss)
    return () => canvas.removeEventListener('webglcontextlost', onLoss)
  }, [gl, onLoss])

  useLayoutEffect(() => {
    invalidate()
    const frame = requestAnimationFrame(onReady)
    return () => cancelAnimationFrame(frame)
  }, [geometry, material, invalidate, onReady])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    if (!active) return
    invalidate()
    // Scroll remains directly controllable while automatic rotation is paused.
    if (paused) {
      window.addEventListener('scroll', invalidateOnScroll, { passive: true })
      return () => window.removeEventListener('scroll', invalidateOnScroll)
    }
    let token = 0
    let last = 0
    function draw(now: number) {
      if (now - last >= 1000 / 30) {
        time.current += Math.min((now - last) / 1000, .1)
        last = now
        invalidate()
      }
      token = requestAnimationFrame(draw)
    }
    function invalidateOnScroll() { invalidate() }
    token = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(token)
  }, [active, paused, invalidate])

  useFrame(({ viewport, pointer }) => {
    if (!mesh.current) return
    if (!paused) smoothPointer.lerp(pointer, .05)
    poseField(mesh.current, progress.current, time.current, viewport.width, viewport.height, smoothPointer)
  })

  return <mesh ref={mesh} geometry={geometry} material={material} dispose={null} />
}

export default function FieldCanvas(props: CanvasProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 8], zoom: 90, near: .01, far: 100 }}
      dpr={[1, 1.65]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <Engraving {...props} />
    </Canvas>
  )
}
