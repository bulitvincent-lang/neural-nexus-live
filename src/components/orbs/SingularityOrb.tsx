import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const MATTER_VERT = /* glsl */ `
attribute float aSeed;
attribute float aRadius;
attribute float aTilt;
attribute float aPhase;
uniform float uTime;
uniform float uActivity;
uniform float uConverge;
uniform float uSize;
varying float vI;
varying float vR;
void main() {
  // keplerian orbit, faster near the core, pulled inward on convergence
  float pull = 0.30 * uConverge + 0.10 * uActivity;
  float r = mix(aRadius, 0.34, pull) * (1.0 + 0.02 * sin(uTime * 1.3 + aSeed * 6.28));
  float w = (0.35 + 1.9 * uActivity) / pow(r, 1.35);
  float a = aPhase + uTime * w;
  vec3 p = vec3(cos(a) * r, 0.0, sin(a) * r);
  // tilt each orbit -> a real volumetric disc
  float c = cos(aTilt), s = sin(aTilt);
  p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  p.y += sin(a * 2.0 + aSeed * 6.0) * 0.02 * (1.0 - uConverge);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float heat = clamp((0.95 - r) * 1.5, 0.0, 1.0);
  vI = (0.28 + 0.85 * uActivity) * (0.35 + heat) + uConverge * 0.4;
  vR = r;
  gl_PointSize = uSize * (0.6 + heat) * (75.0 / -mv.z);
}
`;

const MATTER_FRAG = /* glsl */ `
varying float vI;
varying float vR;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  vec3 hot = vec3(1.0, 0.78, 0.42);
  vec3 cool = vec3(0.48, 0.42, 1.0);
  vec3 col = mix(hot, cool, clamp((vR - 0.35) * 1.2, 0.0, 1.0));
  gl_FragColor = vec4(col * (0.55 + vI * 0.55), a * a * clamp(vI, 0.0, 1.0) * 0.4);
}
`;

const RING_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAG = /* glsl */ `
uniform float uTime;
uniform float uActivity;
uniform float uGlow;
varying vec2 vUv;
void main() {
  float band = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
  float streak = 0.6 + 0.4 * sin(vUv.x * 42.0 - uTime * (2.0 + 6.0 * uActivity));
  float doppler = 0.55 + 0.45 * sin(vUv.x * 6.2831);
  vec3 hot = vec3(1.0, 0.86, 0.58);
  vec3 warm = vec3(1.0, 0.52, 0.24);
  vec3 col = mix(warm, hot, streak * doppler);
  float a = band * (0.35 + 0.55 * uActivity + 0.25 * uGlow) * (0.45 + 0.55 * doppler);
  gl_FragColor = vec4(col * (0.65 + uGlow * 0.35), clamp(a * 0.7, 0.0, 0.85));
}
`;

export function SingularityOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 8);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);

  const data = useMemo(() => {
    const N = Math.round(5200 * detail);
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const radius = new Float32Array(N);
    const tilt = new Float32Array(N);
    const phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      radius[i] = 0.42 + Math.pow(Math.random(), 0.75) * 0.72;
      seed[i] = Math.random();
      tilt[i] = (Math.random() - 0.5) * 0.7;
      phase[i] = Math.random() * Math.PI * 2;
    }
    return { N, pos, seed, radius, tilt, phase };
  }, [detail]);

  const matterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uConverge: { value: 0 },
      uSize: { value: 2.2 },
    }),
    [],
  );
  const ringUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uActivity: { value: 0 }, uGlow: { value: 0.3 } }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    matterUniforms.uTime.value = clock.current;
    matterUniforms.uActivity.value = p.activityLevel;
    matterUniforms.uConverge.value = Math.min(1, p.convergenceLevel + p.waveStrength * 0.4);
    matterUniforms.uSize.value = 1.9 + p.glowIntensity * 1.4;
    ringUniforms.uTime.value = clock.current;
    ringUniforms.uActivity.value = p.activityLevel;
    ringUniforms.uGlow.value = p.glowIntensity;
    if (core.current) {
      const s = 0.34 - p.convergenceLevel * 0.02;
      core.current.scale.setScalar(s / 0.34);
    }
    if (halo.current) halo.current.opacity = 0.05 + p.activityLevel * 0.14;
    if (group.current) {
      group.current.rotation.y += dt * (0.04 + p.rotationSpeed * 0.5);
      group.current.rotation.x = -0.34 + Math.sin(clock.current * 0.07) * 0.06;
    }
  });

  return (
    <group ref={group}>
      {/* dark core: an absence of light at the centre */}
      <mesh ref={core}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshBasicMaterial color="#02030a" />
      </mesh>

      {/* photon ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.035, 24, 220]} />
        <shaderMaterial
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={ringUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* faint lensing halo */}
      <mesh>
        <sphereGeometry args={[0.46, 32, 32]} />
        <meshBasicMaterial
          ref={halo}
          color="#8a7bff"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
          <bufferAttribute attach="attributes-aRadius" args={[data.radius, 1]} />
          <bufferAttribute attach="attributes-aTilt" args={[data.tilt, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.phase, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={MATTER_VERT}
          fragmentShader={MATTER_FRAG}
          uniforms={matterUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default SingularityOrb;
