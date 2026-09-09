import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const VERT = /* glsl */ `
attribute float aSeed;
attribute float aArm;
attribute float aType;   // 0 arm star, 1 core, 2 dust
uniform float uTime;
uniform float uActivity;
uniform float uConverge;
uniform float uSize;
varying float vI;
varying float vArm;
varying float vType;

void main() {
  vec3 p = position;
  float r = length(p.xz) + 0.001;
  // differential rotation: inner stars orbit faster
  float spin = uTime * (0.22 + uActivity * 1.15) / (0.22 + r * 1.5);
  float c = cos(spin), s = sin(spin);
  p.xz = mat2(c, -s, s, c) * p.xz;
  p.y += sin(uTime * 0.7 + aSeed * 6.2831) * 0.012 * (1.0 + uActivity * 2.0);
  // gravitational convergence when the AI concludes
  p *= 1.0 - 0.10 * uConverge * (aType < 0.5 ? 1.0 : 0.2);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.6 + 0.4 * sin(uTime * (1.4 + aSeed * 3.0) + aSeed * 12.0);
  float core = aType > 0.5 && aType < 1.5 ? 1.0 : 0.0;
  float dust = aType > 1.5 ? 1.0 : 0.0;
  vI = mix(twinkle * (0.42 + 0.75 * uActivity), 1.0, core) * (1.0 - dust * 0.78);
  vArm = aArm;
  vType = aType;
  float base = uSize * (core > 0.5 ? 1.5 : dust > 0.5 ? 1.2 : 0.85);
  gl_PointSize = base * (0.85 + 0.4 * uActivity) * (150.0 / -mv.z);
}

`;

const FRAG = /* glsl */ `
varying float vI;
varying float vArm;
varying float vType;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 cold = vec3(0.42, 0.68, 1.0);
  vec3 warm = vec3(1.0, 0.83, 0.58);
  vec3 violet = vec3(0.62, 0.48, 1.0);
  vec3 col = mix(cold, violet, fract(vArm * 0.37));
  if (vType > 0.5 && vType < 1.5) col = mix(warm, vec3(1.0), 0.45);
  if (vType > 1.5) col = mix(violet, cold, 0.5) * 0.7;
  gl_FragColor = vec4(col * (0.35 + vI * 0.75), a * vI * 0.42);
}
`;

export function GalaxyOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 10);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);

  const data = useMemo(() => {
    const arms = 3;
    const stars = Math.round(5200 * detail);
    const coreCount = Math.round(800 * detail);
    const dust = Math.round(1600 * detail);

    const total = stars + coreCount + dust;
    const pos = new Float32Array(total * 3);
    const seed = new Float32Array(total);
    const arm = new Float32Array(total);
    const type = new Float32Array(total);
    let i = 0;

    for (let s = 0; s < stars; s++, i++) {
      const a = s % arms;
      const t = Math.pow(Math.random(), 0.62);
      const r = 0.24 + t * 1.05;
      const theta = (a / arms) * Math.PI * 2 + t * 3.4 + (Math.random() - 0.5) * (0.5 - t * 0.28);
      const thick = (1.02 - t) * 0.09;
      pos[i * 3] = Math.cos(theta) * r + (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 1] = (Math.random() - 0.5) * thick * 2;
      pos[i * 3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * 0.05;
      seed[i] = Math.random();
      arm[i] = a;
      type[i] = 0;
    }
    for (let s = 0; s < coreCount; s++, i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 1.9) * 0.26;
      const pr = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(th) * pr * rr;
      pos[i * 3 + 1] = u * rr * 0.7;
      pos[i * 3 + 2] = Math.sin(th) * pr * rr;
      seed[i] = Math.random();
      arm[i] = 0;
      type[i] = 1;
    }
    for (let s = 0; s < dust; s++, i++) {
      const t = Math.pow(Math.random(), 0.5);
      const r = 0.3 + t * 1.25;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.16 * (1.1 - t);
      pos[i * 3 + 2] = Math.sin(theta) * r;
      seed[i] = Math.random();
      arm[i] = Math.random() * 3;
      type[i] = 2;
    }
    return { pos, seed, arm, type };
  }, [detail]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uConverge: { value: 0 },
      uSize: { value: 1.7 },
    }),
    [],
  );

  const coreMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    uniforms.uTime.value = clock.current;
    uniforms.uActivity.value = p.activityLevel;
    uniforms.uConverge.value = p.convergenceLevel;
    uniforms.uSize.value = 1.55 + p.glowIntensity * 0.9;
    if (coreMat.current) {
      coreMat.current.opacity = 0.14 + p.activityLevel * 0.4 + p.waveStrength * 0.25;
    }
    if (group.current) {
      group.current.rotation.y += dt * (0.05 + p.rotationSpeed * 0.6);
      group.current.rotation.x = -0.42 + Math.sin(clock.current * 0.09) * 0.09;
    }
  });

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
          <bufferAttribute attach="attributes-aArm" args={[data.arm, 1]} />
          <bufferAttribute attach="attributes-aType" args={[data.type, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* luminous core halo */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#ffe6c0"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default GalaxyOrb;
