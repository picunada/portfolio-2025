'use client'

import { motion } from "motion/react";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense } from "react";
import { MinimalGlobe } from "./globe";
import * as THREE from 'three'
import { EffectComposer, SMAA } from "@react-three/postprocessing";

function Antialiasing() {
  const { gl } = useThree();
  const context = gl.getContext();
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext;
  const samples = isWebGL2 ? 4 : 0;
  return (
    <EffectComposer multisampling={samples}>
      <SMAA enabled={!isWebGL2} />
    </EffectComposer>
  );
}

export default function ThreeDCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: false, stencil: true }}
        camera={{ position: [0, 0, 9], fov: 60 }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => (gl.shadowMap.type = THREE.PCFSoftShadowMap)}
      >
        <color attach="background" args={["#0b0b10"]} />
        <ambientLight intensity={0.4} />
        <directionalLight castShadow position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <MinimalGlobe radius={1} latLines={9} lonLines={9} floorOpacity={0.12} lineOpacity={1} lineWidth={0.01} maxYawDeg={24} maxPitchDeg={24} rotationLerp={0.03} lightColor="#3baaff" />
        </Suspense>
        <Antialiasing />
      </Canvas>
    </motion.div>
  )
}
