import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const NOISE = /* glsl */ `
vec3 hash3(vec3 p){
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                     dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                     dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                     dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                     dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}
`;

const VERT = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uActivity;
uniform float uTurbulence;
uniform float uVortex;
uniform float uWave;
uniform float uWaveRadius;
varying vec3 vNormalW;
varying vec3 vViewW;
varying float vDisp;
varying vec3 vPos;

vec3 fluid(vec3 n) {
  // vortex twist around Y, stronger near the equator
  float tw = uVortex * (1.0 - abs(n.y)) * 1.4;
  float a = tw * 1.6 + uTime * (0.25 + uVortex);
  float c = cos(a), s = sin(a);
  vec3 q = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
  float t = uTime * (0.35 + 0.9 * uActivity);
  float d = 0.0;
  d += snoise(q * 1.7 + vec3(0.0, t * 0.6, 0.0)) * 0.55;
  d += snoise(q * 3.6 - vec3(t * 0.4, 0.0, t * 0.2)) * 0.28;
  d += snoise(q * 7.4 + vec3(t * 0.8)) * 0.13 * uTurbulence;
  // travelling internal wave
  d += uWave * smoothstep(0.22, 0.0, abs(length(n) * 1.0 - uWaveRadius)) * 0.5;
  return n * (1.0 + d * (0.05 + 0.13 * uTurbulence)) + vec3(0.0, d * 0.01, 0.0);
}

void main() {
  vec3 n = normalize(position);
  vec3 p = fluid(n);
  // recompute a smooth normal from two neighbours
  vec3 t1 = normalize(cross(n, vec3(0.0, 1.0, 0.0) + vec3(0.001)));
  vec3 t2 = normalize(cross(n, t1));
  vec3 pa = fluid(normalize(n + t1 * 0.03));
  vec3 pb = fluid(normalize(n + t2 * 0.03));
  vec3 nrm = normalize(cross(pa - p, pb - p));
  if (dot(nrm, n) < 0.0) nrm = -nrm;

  vDisp = length(p) - 1.0;
  vPos = p;
  vNormalW = normalize(normalMatrix * nrm);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewW = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform float uActivity;
uniform float uGlow;
varying vec3 vNormalW;
varying vec3 vViewW;
varying float vDisp;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(vViewW);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);
  float lam = clamp(dot(n, normalize(vec3(0.45, 0.7, 0.55))), 0.0, 1.0);
  vec3 deep = vec3(0.03, 0.16, 0.42);
  vec3 mid = vec3(0.09, 0.62, 0.86);
  vec3 crest = vec3(0.62, 1.0, 0.94);
  vec3 col = mix(deep, mid, lam);
  col = mix(col, crest, clamp(vDisp * 5.0 + fres * 0.55, 0.0, 1.0));
  col += crest * fres * (0.22 + uGlow * 0.35);
  float alpha = 0.30 + fres * 0.5 + lam * 0.22 + uActivity * 0.12;
  gl_FragColor = vec4(col * (0.55 + uGlow * 0.35), clamp(alpha, 0.0, 0.92));
}
`;

export function LiquidOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 8);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uTurbulence: { value: 0 },
      uVortex: { value: 0 },
      uWave: { value: 0 },
      uWaveRadius: { value: 2 },
      uGlow: { value: 0.4 },
    }),
    [],
  );

  const innerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uTurbulence: { value: 0 },
      uVortex: { value: 0 },
      uWave: { value: 0 },
      uWaveRadius: { value: 2 },
      uGlow: { value: 0.4 },
    }),
    [],
  );

  const segments = detail < 0.7 ? 4 : 6;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    for (const u of [uniforms, innerUniforms]) {
      u.uTime.value = clock.current;
      u.uActivity.value = p.activityLevel;
      u.uTurbulence.value = 0.15 + p.activityLevel * 1.1 + p.disturbance * 0.6;
      u.uVortex.value = 0.08 + p.networkEntropy * 0.6 + p.convergenceLevel * 0.7;
      u.uWave.value = p.waveStrength;
      u.uWaveRadius.value = p.waveRadius;
      u.uGlow.value = p.glowIntensity;
    }
    innerUniforms.uTime.value = clock.current * 1.35 + 12;
    if (group.current) {
      group.current.rotation.y += dt * (0.05 + p.rotationSpeed * 0.8);
      group.current.rotation.z = Math.sin(clock.current * 0.06) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1, segments]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* inner body: gives real depth to the liquid */}
      <mesh scale={0.68}>
        <icosahedronGeometry args={[1, Math.max(2, segments - 1)]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={innerUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default LiquidOrb;
