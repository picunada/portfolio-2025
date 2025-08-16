'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

type MinimalGlobeProps = {
  radius?: number
  latLines?: number
  lonLines?: number
  lineColor?: string
  lineOpacity?: number
  lineWidth?: number
  worldUnits?: boolean
  showEye?: boolean
  eyeColor?: string
  lightColor?: string
  pupilColor?: string
  eyeIrisRadius?: number
  eyePupilRadius?: number
  pupilLerp?: number
  rotationLerp?: number
  trackGlobalPointer?: boolean
  maxYawDeg?: number
  maxPitchDeg?: number
  pupilOffsetScale?: number
  floorOpacity?: number
  baseRollDeg?: number
}

function Floating({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    t.current += delta
    if (!ref.current) return
    ref.current.position.y = Math.sin(t.current) * 0.08      // bob
    ref.current.rotation.z = Math.sin(t.current * 0.5) * 0.03 // gentle sway
  })
  return <group ref={ref}>{children}</group>
}

type SuperellipseProps = ThreeElements['mesh'] & {
  a?: number        // полуось X
  b?: number        // полуось Y
  n?: number        // степень (острота углов): 1.2–1.8
  segments?: number // плотность дискретизации
  color?: string
  depth?: number    // >0 чтобы экструдировать в 3D
}

export function Superellipse({
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 256,
  color = '#ffffff',
  depth = 0,
  ...rest
}: SuperellipseProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const points: THREE.Vector2[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      points.push(new THREE.Vector2(x, y))
    }
    shape.setFromPoints(points)
    if (depth > 0) {
      return new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false })
    }
    return new THREE.ShapeGeometry(shape)
  }, [a, b, n, segments, depth])

  return (
    <mesh geometry={geometry} {...rest}>
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

type SuperellipseOnGlobeProps = {
  radius: number
  a?: number
  b?: number
  n?: number
  segments?: number
  color?: string
  lineWidth?: number
  worldUnits?: boolean
  opacity?: number
  offset?: number
  lonScaleDeg?: number
  latScaleDeg?: number
  centerLonDeg?: number
  centerLatDeg?: number
  angleDeg?: number
}

/**
 * Projects a 2D superellipse onto the sphere as a polyline.
 * - x controls longitude, y controls latitude, both scaled by lonScale/latScale.
 * - Use centerLonDeg/centerLatDeg to place the shape on the globe.
 * - angleDeg rotates the superellipse in its 2D param domain before projection.
 */
export function SuperellipseOnGlobe({
  radius,
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 512,
  color = '#ffffff',
  lineWidth = 1.5,
  worldUnits = true,
  opacity = 1,
  offset = 0.002,
  lonScaleDeg = 180,
  latScaleDeg = 90,
  centerLonDeg = 0,
  centerLatDeg = 0,
  angleDeg = 0,
}: SuperellipseOnGlobeProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const lonScale = THREE.MathUtils.degToRad(lonScaleDeg)
    const latScale = THREE.MathUtils.degToRad(latScaleDeg)
    const lonCenter = THREE.MathUtils.degToRad(centerLonDeg)
    const latCenter = THREE.MathUtils.degToRad(centerLatDeg)
    const ang = THREE.MathUtils.degToRad(angleDeg)
    const cosA = Math.cos(ang)
    const sinA = Math.sin(ang)
    const R = radius + offset
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      // Rotate in param space to control tilt
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA
      const xNorm = xr / a
      const yNorm = yr / b
      const lon = lonCenter + xNorm * lonScale
      const lat = latCenter + yNorm * latScale
      const cosLat = Math.cos(lat)
      const vx = R * cosLat * Math.sin(lon)
      const vy = R * Math.sin(lat)
      const vz = R * cosLat * Math.cos(lon)
      pts.push(new THREE.Vector3(vx, vy, vz))
    }
    return pts
  }, [radius, a, b, n, segments, lonScaleDeg, latScaleDeg, centerLonDeg, centerLatDeg, angleDeg, offset])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      worldUnits={worldUnits}
      transparent
      opacity={opacity}
    />
  )
}

type SuperellipseFillOnGlobeProps = {
  radius: number
  a?: number
  b?: number
  n?: number
  segments?: number
  fillColor?: string
  fillOpacity?: number
  offset?: number
  lonScaleDeg?: number
  latScaleDeg?: number
  centerLonDeg?: number
  centerLatDeg?: number
  angleDeg?: number
}

/**
 * Filled background for the superellipse, projected onto the sphere.
 * Triangulates in param space, then maps vertices to the globe.
 */
export function SuperellipseFillOnGlobe({
  radius,
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 256,
  fillColor = '#ffffff',
  fillOpacity = 0.12,
  offset = 0.0008,
  lonScaleDeg = 180,
  latScaleDeg = 90,
  centerLonDeg = 0,
  centerLatDeg = 0,
  angleDeg = 0,
}: SuperellipseFillOnGlobeProps) {
  const geometry = useMemo(() => {
    const contour2D: THREE.Vector2[] = []
    const lonScale = THREE.MathUtils.degToRad(lonScaleDeg)
    const latScale = THREE.MathUtils.degToRad(latScaleDeg)
    const lonCenter = THREE.MathUtils.degToRad(centerLonDeg)
    const latCenter = THREE.MathUtils.degToRad(centerLatDeg)
    const ang = THREE.MathUtils.degToRad(angleDeg)
    const cosA = Math.cos(ang)
    const sinA = Math.sin(ang)
    const R = radius + offset

    // Build 2D param-space polygon (normalized domain)
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA
      const xNorm = xr / a
      const yNorm = yr / b
      contour2D.push(new THREE.Vector2(xNorm, yNorm))
    }

    // Triangulate in 2D param space
    const triangles = THREE.ShapeUtils.triangulateShape(contour2D, [])

    // Map unique vertices to 3D on the sphere
    const positions: number[] = []
    for (let k = 0; k < triangles.length; k++) {
      const tri = triangles[k]
      for (let v = 0; v < 3; v++) {
        const idx = tri[v]
        const p = contour2D[idx]
        const lon = lonCenter + p.x * lonScale
        const lat = latCenter + p.y * latScale
        const cosLat = Math.cos(lat)
        const vx = R * cosLat * Math.sin(lon)
        const vy = R * Math.sin(lat)
        const vz = R * cosLat * Math.cos(lon)
        positions.push(vx, vy, vz)
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.computeVertexNormals()
    return geom
  }, [radius, a, b, n, segments, lonScaleDeg, latScaleDeg, centerLonDeg, centerLatDeg, angleDeg, offset])

  return (
    <mesh receiveShadow={false} castShadow={false} geometry={geometry} renderOrder={0}>
      <meshBasicMaterial
        color={fillColor}
        transparent
        opacity={fillOpacity}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

type SuperellipseDecalCommon = {
  radius: number
  planeWidth: number // world units across (arc-length near center)
  planeHeight: number
  a?: number
  b?: number
  n?: number
  segments?: number
  centerLonDeg?: number
  centerLatDeg?: number
  angleDeg?: number // rotation in the tangent plane
  offset?: number
}

function computeTangentFrame(centerLonDeg: number, centerLatDeg: number) {
  const lon = THREE.MathUtils.degToRad(centerLonDeg)
  const lat = THREE.MathUtils.degToRad(centerLatDeg)
  const cosLat = Math.cos(lat)
  const sinLat = Math.sin(lat)
  const sinLon = Math.sin(lon)
  const cosLon = Math.cos(lon)
  // Unit center direction (y is up)
  const u0 = new THREE.Vector3(
    cosLat * sinLon,
    sinLat,
    cosLat * cosLon
  ).normalize()
  // Robust tangent basis
  const globalUp = new THREE.Vector3(0, 1, 0)
  let east = new THREE.Vector3().crossVectors(globalUp, u0)
  if (east.lengthSq() < 1e-8) {
    east = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, 1), u0)
  }
  east.normalize()
  const north = new THREE.Vector3().crossVectors(u0, east).normalize()
  return { u0, east, north }
}

export function SuperellipseDecalFillOnGlobe({
  radius,
  planeWidth,
  planeHeight,
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 256,
  centerLonDeg = 0,
  centerLatDeg = 0,
  angleDeg = 0,
  offset = 0.0006,
  fillColor = '#ffffff',
  fillOpacity = 0.12,
}: SuperellipseDecalCommon & { fillColor?: string; fillOpacity?: number }) {
  const geometry = useMemo(() => {
    const { u0, east, north } = computeTangentFrame(centerLonDeg, centerLatDeg)
    const cosA = Math.cos(THREE.MathUtils.degToRad(angleDeg))
    const sinA = Math.sin(THREE.MathUtils.degToRad(angleDeg))
    const halfW = planeWidth / 2
    const halfH = planeHeight / 2

    // Build 2D polygon in tangent plane (u,v)
    const poly2D: THREE.Vector2[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA
      const u = (xr / a) * halfW
      const v = (yr / b) * halfH
      poly2D.push(new THREE.Vector2(u, v))
    }

    // Triangulate planar polygon
    const triangles = THREE.ShapeUtils.triangulateShape(poly2D, [])

    // Exponential map from tangent plane to sphere
    const positions: number[] = []
    for (let k = 0; k < triangles.length; k++) {
      const tri = triangles[k]
      for (let vIdx = 0; vIdx < 3; vIdx++) {
        const p = poly2D[tri[vIdx]]
        const u = p.x
        const v = p.y
        const sLen = Math.hypot(u, v)
        const dir = new THREE.Vector3()
        if (sLen > 1e-8) {
          dir.copy(east).multiplyScalar(u).addScaledVector(north, v).normalize()
        } else {
          dir.copy(north) // arbitrary; won't matter when sLen ~ 0
        }
        let theta = sLen / radius
        const maxTheta = Math.PI * 0.5 - 1e-4
        if (theta > maxTheta) theta = maxTheta
        const cosT = Math.cos(theta)
        const sinT = Math.sin(theta)
        const unit = new THREE.Vector3().copy(u0).multiplyScalar(cosT).addScaledVector(dir, sinT)
        const R = radius + offset
        positions.push(unit.x * R, unit.y * R, unit.z * R)
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geom
  }, [radius, planeWidth, planeHeight, a, b, n, segments, centerLonDeg, centerLatDeg, angleDeg, offset])

  const isTransparent = fillOpacity < 1

  return (
    <mesh receiveShadow={false} castShadow={false} geometry={geometry} renderOrder={0}>
      <meshBasicMaterial
        color={fillColor}
        transparent={isTransparent}
        opacity={fillOpacity}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        depthWrite
        toneMapped={false}
      />
    </mesh>
  )
}

export function SuperellipseDecalOutlineOnGlobe({
  radius,
  planeWidth,
  planeHeight,
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 512,
  centerLonDeg = 0,
  centerLatDeg = 0,
  angleDeg = 0,
  offset = 0.001,
  color = '#ffffff',
  lineWidth = 1.5,
  worldUnits = true,
  opacity = 1,
}: SuperellipseDecalCommon & { color?: string; lineWidth?: number; worldUnits?: boolean; opacity?: number }) {
  const points = useMemo(() => {
    const { u0, east, north } = computeTangentFrame(centerLonDeg, centerLatDeg)
    const cosA = Math.cos(THREE.MathUtils.degToRad(angleDeg))
    const sinA = Math.sin(THREE.MathUtils.degToRad(angleDeg))
    const halfW = planeWidth / 2
    const halfH = planeHeight / 2
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA
      const u = (xr / a) * halfW
      const v = (yr / b) * halfH
      const sLen = Math.hypot(u, v)
      const dir = new THREE.Vector3()
      if (sLen > 1e-8) {
        dir.copy(east).multiplyScalar(u).addScaledVector(north, v).normalize()
      } else {
        dir.copy(north)
      }
      let theta = sLen / radius
      const maxTheta = Math.PI * 0.5 - 1e-4
      if (theta > maxTheta) theta = maxTheta
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      const unit = new THREE.Vector3().copy(u0).multiplyScalar(cosT).addScaledVector(dir, sinT)
      const R = radius + offset
      pts.push(new THREE.Vector3(unit.x * R, unit.y * R, unit.z * R))
    }
    return pts
  }, [radius, planeWidth, planeHeight, a, b, n, segments, centerLonDeg, centerLatDeg, angleDeg, offset])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      worldUnits={worldUnits}
      depthTest
      transparent
      opacity={opacity}
      renderOrder={1}
    />
  )
}

type SuperellipseDecalGlowProps = {
  radius: number
  planeWidth: number
  planeHeight: number
  a?: number
  b?: number
  n?: number
  segments?: number
  centerLonDeg?: number
  centerLatDeg?: number
  angleDeg?: number
  offset?: number
  color?: string
  glowScale?: number // scales the contour outwards in tangent plane; 0.1–0.3
  innerAlpha?: number // alpha at inner rim
}

// Soft glow band around the superellipse edge (additive overlay)
export function SuperellipseDecalGlowOnGlobe({
  radius,
  planeWidth,
  planeHeight,
  a = 1,
  b = 0.6,
  n = 1.4,
  segments = 256,
  centerLonDeg = 0,
  centerLatDeg = 0,
  angleDeg = 0,
  offset = 0.0008,
  color = '#6e8bff',
  glowScale = 0.18,
  innerAlpha = 0.35,
  animate = true,
  speed = 0.8,
  amplitude = 0.2,
}: SuperellipseDecalGlowProps & { animate?: boolean; speed?: number; amplitude?: number }) {
  const geometry = useMemo(() => {
    const { u0, east, north } = computeTangentFrame(centerLonDeg, centerLatDeg)
    const cosA = Math.cos(THREE.MathUtils.degToRad(angleDeg))
    const sinA = Math.sin(THREE.MathUtils.degToRad(angleDeg))
    const halfW = planeWidth / 2
    const halfH = planeHeight / 2

    const inner: THREE.Vector2[] = []
    const outer: THREE.Vector2[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      const xr = x * cosA - y * sinA
      const yr = x * sinA + y * cosA
      const scale = 1 + glowScale
      inner.push(new THREE.Vector2((xr / a) * halfW, (yr / b) * halfH))
      outer.push(new THREE.Vector2((xr / a) * halfW * scale, (yr / b) * halfH * scale))
    }

    const positions: number[] = []
    const colors: number[] = []
    const col = new THREE.Color(color)
    const R = radius + offset

    const pushPoint = (p: THREE.Vector2, alpha: number) => {
      const u = p.x
      const v = p.y
      const sLen = Math.hypot(u, v)
      const dir = new THREE.Vector3()
      if (sLen > 1e-8) dir.copy(east).multiplyScalar(u).addScaledVector(north, v).normalize()
      else dir.copy(north)
      let theta = sLen / radius
      const maxTheta = Math.PI * 0.5 - 1e-4
      if (theta > maxTheta) theta = maxTheta
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      const unit = new THREE.Vector3().copy(u0).multiplyScalar(cosT).addScaledVector(dir, sinT)
      positions.push(unit.x * R, unit.y * R, unit.z * R)
      colors.push(col.r, col.g, col.b, alpha)
    }

    // Build triangle strip band (inner->outer)
    for (let i = 0; i < inner.length - 1; i++) {
      const i0 = i
      const i1 = i + 1
      const p0 = inner[i0]
      const p1 = inner[i1]
      const q0 = outer[i0]
      const q1 = outer[i1]
      // tri 1: p0, q0, p1
      pushPoint(p0, innerAlpha)
      pushPoint(q0, 0)
      pushPoint(p1, innerAlpha)
      // tri 2: p1, q0, q1
      pushPoint(p1, innerAlpha)
      pushPoint(q0, 0)
      pushPoint(q1, 0)
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
    return geom
  }, [radius, planeWidth, planeHeight, a, b, n, segments, centerLonDeg, centerLatDeg, angleDeg, offset, color, glowScale, innerAlpha])

  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((state) => {
    if (!animate || !materialRef.current) return
    const t = state.clock.getElapsedTime()
    const base = 1
    const osc = 1 + amplitude * Math.sin(t * speed)
    materialRef.current.opacity = base * osc
    materialRef.current.needsUpdate = true
  })

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshBasicMaterial ref={materialRef} vertexColors transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
  )
}

export function MinimalGlobe({
  radius = 1,
  latLines = 9,
  lonLines = 12,
  lineColor = '#6e8bff',
  lineOpacity = 0.7,
  lineWidth = 1.5,
  worldUnits = true,
  showEye = true,
  eyeColor = '#9ab9ff',
  lightColor = '#9ab9ff',
  pupilColor = '#0b0b0b',
  eyeIrisRadius = 0.24,
  eyePupilRadius = 0.12,
  pupilLerp = 0.3,
  rotationLerp = 0.15,
  trackGlobalPointer = true,
  maxYawDeg = 45,
  maxPitchDeg = 30,
  pupilOffsetScale = 0.75,
  floorOpacity = 0.12,
  baseRollDeg = 8,
}: MinimalGlobeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pointerClientRef = useRef<{ x: number; y: number } | null>(null)
  const pupilOffsetRef = useRef(new THREE.Vector2(0, 0))
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const appearRef = useRef(0)

  useEffect(() => {
    if (!trackGlobalPointer) return
    const handleMove = (e: MouseEvent) => {
      pointerClientRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [trackGlobalPointer])

  // useFrame((_, delta) => {
  //   if (!groupRef.current) return
  //   groupRef.current.rotation.y += delta * 0.2
  // })

  const { latitudeCircles, longitudeCircles } = useMemo(() => {
    const latCircles: THREE.Vector3[][] = []
    const lonCircles: THREE.Vector3[][] = []

    const samplesPerCircle = 256
    const lineRadius = radius + 0.001

    // Latitude lines (exclude poles)
    for (let i = 1; i <= latLines; i += 1) {
      const phi = -Math.PI / 2 + (i * Math.PI) / (latLines + 1) // (-90, 90)
      const y = lineRadius * Math.sin(phi)
      const rAtLat = lineRadius * Math.cos(phi)
      const points: THREE.Vector3[] = []
      for (let s = 0; s <= samplesPerCircle; s += 1) {
        const theta = (s / samplesPerCircle) * Math.PI * 2
        const x = rAtLat * Math.cos(theta)
        const z = rAtLat * Math.sin(theta)
        points.push(new THREE.Vector3(x, y, z))
      }
      latCircles.push(points)
    }

    // Longitude lines (great circles through poles)
    for (let j = 0; j < lonLines; j += 1) {
      const lambda = (j / lonLines) * Math.PI * 2 // rotation around Y
      const sinL = Math.sin(lambda)
      const cosL = Math.cos(lambda)
      const points: THREE.Vector3[] = []
      for (let s = 0; s <= samplesPerCircle; s += 1) {
        const t = (s / samplesPerCircle) * Math.PI * 2
        const y = lineRadius * Math.sin(t)
        const zBase = lineRadius * Math.cos(t)
        const x = zBase * sinL
        const z = zBase * cosL
        points.push(new THREE.Vector3(x, y, z))
      }
      lonCircles.push(points)
    }

    return { latitudeCircles: latCircles, longitudeCircles: lonCircles }
  }, [radius, latLines, lonLines])

  // Rotate whole globe to face cursor; pupil stays centered within iris
  useFrame((state) => {
    if (!groupRef.current) return
    const { pointer, gl } = state
    let px = pointer.x
    let py = pointer.y
    if (trackGlobalPointer && pointerClientRef.current) {
      const rect = gl.domElement.getBoundingClientRect()
      const nx = (pointerClientRef.current.x - rect.left) / rect.width
      const ny = (pointerClientRef.current.y - rect.top) / rect.height
      px = nx * 2 - 1
      py = -(ny * 2 - 1)
    }
    // Clamp NDC symmetrically so extreme outside positions don't cause unstable targets
    px = THREE.MathUtils.clamp(px, -1.2, 1.2)
    py = THREE.MathUtils.clamp(py, -1.2, 1.2)
    // Directly map canvas-normalized pointer to yaw/pitch
    const maxYaw = THREE.MathUtils.degToRad(maxYawDeg)
    const maxPitch = THREE.MathUtils.degToRad(maxPitchDeg)
    const yawClamped = THREE.MathUtils.clamp(px, -1, 1) * maxYaw
    const pitchClamped = THREE.MathUtils.clamp(py, -1, 1) * maxPitch

    // Stable, continuous yaw/pitch interpolation with angle unwrapping
    const unwrap = (target: number, current: number) => {
      const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
      return current + delta
    }
    const yawUnwrapped = unwrap(yawClamped, yawRef.current)
    const pitchUnwrapped = unwrap(pitchClamped, pitchRef.current)
    yawRef.current = THREE.MathUtils.lerp(yawRef.current, yawUnwrapped, rotationLerp)
    pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, pitchUnwrapped, rotationLerp)

    const rollRad = THREE.MathUtils.degToRad(baseRollDeg)
    const euler = new THREE.Euler(-pitchRef.current, yawRef.current, rollRad, 'YXZ')
    groupRef.current.setRotationFromEuler(euler)

    // Smooth scale-in on mount
    if (appearRef.current < 1) {
      const dt = state.clock.getDelta()
      appearRef.current = Math.min(1, appearRef.current + dt * 1.5)
      const easeOut = 1 - Math.pow(1 - appearRef.current, 3)
      const s = THREE.MathUtils.lerp(0.9, 1, easeOut)
      groupRef.current.scale.setScalar(s)
    }

    // Subtle pupil offset toward pointer within iris
    const aim2 = new THREE.Vector2(px, py)
    const len = aim2.length()
    if (len > 1) aim2.multiplyScalar(1 / len)
    const maxOffset = Math.max(0, eyeIrisRadius - eyePupilRadius - 0.001)
    const targetOffset = aim2.multiplyScalar(maxOffset * pupilOffsetScale)
    pupilOffsetRef.current.lerp(targetOffset, pupilLerp)
  })

  const Eye = () => {
    const pupilRef = useRef<THREE.Mesh>(null)
    useFrame(() => {
      const o = pupilOffsetRef.current
      if (pupilRef.current) {
        pupilRef.current.position.set(o.x, o.y, 0.001)
      }
    })
    return (
      <group position={[0, 0, radius + 0.5]}>
        <group ref={pupilRef} position={[0, 0, 0.001]}>
          <mesh>
            <circleGeometry args={[eyePupilRadius, 64]} />
            <meshBasicMaterial color={eyeColor} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <pointLight
          position={[0, 0, 0.01]}
          intensity={12}
          distance={4}
          decay={2}
          color={lightColor}
          castShadow
          shadow-bias={-0.0005}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      </group>
    )
  }

  const LineCircle = ({ points }: { points: THREE.Vector3[] }) => (
    <Line
      points={points}
      color={lineColor}
      lineWidth={lineWidth}
      worldUnits={worldUnits}
      transparent
      opacity={lineOpacity}
      renderOrder={1}
    />
  )

  return (
    <group>
      {/* Rotating globe */}
      <Floating>
        <group ref={groupRef}>
          <mesh castShadow>
            <sphereGeometry args={[radius, 64, 64]} />
            <meshPhysicalMaterial transparent opacity={0} roughness={0} metalness={0} color="#ffffff" depthWrite={false} />
          </mesh>

          {/* Decal-style superellipse that wraps on the sphere */}
          <SuperellipseDecalFillOnGlobe
            radius={radius}
            planeWidth={radius * 1.2}
            planeHeight={radius * 0.5}
            a={2}
            b={0.6}
            n={1.5}
            segments={384}
            fillColor={"#171717"}
            fillOpacity={1}
            centerLonDeg={0}
            centerLatDeg={0}
            angleDeg={0}
            offset={0.5}
          />
          <SuperellipseDecalGlowOnGlobe
            radius={radius}
            planeWidth={radius * 1.2}
            planeHeight={radius * 0.5}
            a={2}
            b={0.6}
            n={1.5}
            segments={384}
            centerLonDeg={0}
            centerLatDeg={0}
            angleDeg={0}
            offset={0.5}
            color={lineColor}
            glowScale={0.3}
            innerAlpha={0.4}
            animate
            speed={1.6}
            amplitude={0.18}
          />

          {latitudeCircles.map((points, idx) => (
            <LineCircle key={`lat-${idx}`} points={points} />
          ))}

          {longitudeCircles.map((points, idx) => (
            <LineCircle key={`lon-${idx}`} points={points} />
          ))}
          <SuperellipseDecalOutlineOnGlobe
            radius={radius}
            planeWidth={radius * 1.2}
            planeHeight={radius * 0.5}
            a={2}
            b={0.6}
            n={1.5}
            segments={512}
            color={lineColor}
            lineWidth={lineWidth}
            worldUnits={worldUnits}
            opacity={1}
            centerLonDeg={0}
            centerLatDeg={0}
            angleDeg={0}
            offset={0.5}
          />

          <mesh castShadow>
            <sphereGeometry args={[radius + 0.03, 64, 64]} />
            <meshBasicMaterial color={lineColor} transparent opacity={0.12} depthWrite={false} />
          </mesh>

          {showEye ? <Eye /> : null}
        </group>
      </Floating>


      {/* Transparent floor/ceiling (receives light and shadows) */}
      <group>
        <mesh
          rotation={[-Math.PI / 2, 0.15, 0]}
          position={[0, -radius - 0.6, 0]}
        >
          <planeGeometry args={[radius * 24, radius * 12, 1, 1]} />
          <meshStandardMaterial
            color="#171717"
            transparent
            opacity={floorOpacity}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <mesh
          rotation={[Math.PI / 2, 1, 0]}
          position={[0, radius + 2, 0]}
        >
          <planeGeometry args={[radius * 24, radius * 24, 2, 2]} />
          <meshStandardMaterial
            color="#171717"
            transparent
            opacity={floorOpacity}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <mesh
          rotation={[Math.PI / 2, -1, 0]}
          position={[0, radius + 2, 0]}
        >
          <planeGeometry args={[radius * 24, radius * 24, 2, 2]} />
          <meshStandardMaterial
            color="#171717"
            transparent
            opacity={floorOpacity}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <mesh
          rotation={[0, 0, -1]}
          position={[0, 0, -2]}
        >
          <planeGeometry args={[radius * 24, radius * 24, 2, 2]} />
          <meshStandardMaterial
            color="#171717"
            transparent
            opacity={floorOpacity}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  )
}


