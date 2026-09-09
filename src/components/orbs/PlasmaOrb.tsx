import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const ARC_VERT = /* glsl */ `
attribute float aT;        // 0..1 along the filament
attribute float aFil;      // filament id
attribute float aSeed;
attribute vec3 aSideA;     // two perpendicular axes for the jitter
attribute vec3 aSideB;
uniform float uTime;
uniform float uActivity;
uniform float uDensity;
uniform float uBurst;
varying float vA;
varying float vT;
varying float vFil;

float h(float x) { return fract(sin(x * 43758.5453) * 12345.6789); }

void main() {
  float env = sin(aT * 3.14159);                       // arcs anchored at both ends
  float amp = (0.05 + 0.16 * uActivity + 0.22 * uBurst) * env;
  float sp = 2.2 + 5.0 * uActivity;
  vec3 p = position;
  p += aSideA * sin(aT * 11.0 + uTime * sp + aSeed * 12.0) * amp;
  p += aSideB * cos(aT * 8.0 - uTime * sp * 0.8 + aSeed * 7.0) * amp;
  p += normalize(position) * sin(aT * 17.0 + uTime * sp * 1.4) * amp * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // each filament switches on with the field density
  float gate = step(h(aFil * 1.37), 0.48 + uDensity * 0.48);
  float flicker = 0.58 + 0.42 * pow(abs(sin(uTime * (3.0 + h(aFil) * 9.0) + aFil)), 2.0);
  vA = gate * env * flicker * (0.42 + 0.62 * uActivity + uBurst * 0.6);
  vT = aT;
  vFil = aFil;
}
`;

const ARC_FRAG = /* glsl */ `
varying float vA;
varying float vT;
varying float vFil;
void main() {
  vec3 hot = vec3(1.0, 0.72, 0.98);
  vec3 cold = vec3(0.42, 0.86, 1.0);
  vec3 white = vec3(1.0);
  vec3 col = mix(cold, hot, fract(vFil * 0.271));
  col = mix(col, white, smoothstep(0.35, 0.5, abs(vT - 0.5)) * 0.35);
  gl_FragColor = vec4(col * (0.65 + vA * 0.7), clamp(vA, 0.0, 0.9));
}
`;

const FIELD_VERT = /* glsl */ `
uniform float uTime;
uniform float uActivity;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 n = normalize(position);
  vec3 p = n * (1.0 + 0.02 * sin(uTime * 1.2 + n.y * 6.0) * (0.4 + uActivity));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * n);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FIELD_FRAG = /* glsl */ `
uniform float uActivity;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
void main() {
  float fres = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.2);
  vec3 col = mix(vec3(0.28, 0.55, 1.0), vec3(1.0, 0.6, 0.95), uActivity);
  gl_FragColor = vec4(col * (0.45 + uGlow * 0.4), fres * (0.08 + 0.24 * uActivity));
}
`;

const CORE_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uActivity;
uniform float uSize;
varying float vI;
void main() {
  vec3 p = position * (1.0 + 0.09 * sin(uTime * 2.0 + aSeed * 6.28) * (0.3 + uActivity));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vI = 0.3 + 0.9 * uActivity;
  gl_PointSize = uSize * (65.0 / -mv.z);
}
`;

const CORE_FRAG = /* glsl */ `
varying float vI;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(mix(vec3(0.6, 0.9, 1.0), vec3(1.0, 0.85, 1.0), vI) * (0.6 + vI * 0.4), a * a * vI * 0.4);
}
`;

function randomOnSphere(v: THREE.Vector3) {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return v.set(Math.cos(th) * r, u, Math.sin(th) * r);
}

export function PlasmaOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 10);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const burst = useRef(0);
  const lastWave = useRef(0);

  const data = useMemo(() => {
    const filaments = detail < 0.7 ? 90 : 180;
    const steps = 22;
    const segsPerFil = steps - 1;
    const verts = filaments * segsPerFil * 2;
    const pos = new Float32Array(verts * 3);
    const t = new Float32Array(verts);
    const fil = new Float32Array(verts);
    const seed = new Float32Array(verts);
    const sideA = new Float32Array(verts * 3);
    const sideB = new Float32Array(verts * 3);

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();
    const s1 = new THREE.Vector3();
    const s2 = new THREE.Vector3();
    let w = 0;

    for (let f = 0; f < filaments; f++) {
      randomOnSphere(a);
      randomOnSphere(b);
      // keep arcs reasonably short so they read as discharges, not chords
      b.lerp(a, 0.35 + Math.random() * 0.35).normalize();
      s1.copy(a).cross(b).normalize();
      if (!Number.isFinite(s1.x) || s1.lengthSq() < 0.001) s1.set(0, 1, 0);
      s2.copy(a).add(b).normalize().cross(s1).normalize();
      const fSeed = Math.random();
      const bulge = 1.0 + Math.random() * 0.16;

      for (let i = 0; i < segsPerFil; i++) {
        const ta = i / segsPerFil;
        const tb = (i + 1) / segsPerFil;
        p0.copy(a).lerp(b, ta).normalize().multiplyScalar(bulge * (0.94 + 0.12 * Math.sin(ta * Math.PI)));
        p1.copy(a).lerp(b, tb).normalize().multiplyScalar(bulge * (0.94 + 0.12 * Math.sin(tb * Math.PI)));
        for (const [pt, tv] of [
          [p0, ta],
          [p1, tb],
        ] as const) {
          pos[w * 3] = pt.x;
          pos[w * 3 + 1] = pt.y;
          pos[w * 3 + 2] = pt.z;
          t[w] = tv;
          fil[w] = f;
          seed[w] = fSeed;
          sideA[w * 3] = s1.x;
          sideA[w * 3 + 1] = s1.y;
          sideA[w * 3 + 2] = s1.z;
          sideB[w * 3] = s2.x;
          sideB[w * 3 + 1] = s2.y;
          sideB[w * 3 + 2] = s2.z;
          w++;
        }
      }
    }

    const C = Math.round(700 * detail);
    const corePos = new Float32Array(C * 3);
    const coreSeed = new Float32Array(C);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < C; i++) {
      randomOnSphere(tmp).multiplyScalar(0.12 + Math.pow(Math.random(), 1.6) * 0.34);
      corePos[i * 3] = tmp.x;
      corePos[i * 3 + 1] = tmp.y;
      corePos[i * 3 + 2] = tmp.z;
      coreSeed[i] = Math.random();
    }

    return { pos, t, fil, seed, sideA, sideB, corePos, coreSeed };
  }, [detail]);

  const arcUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uDensity: { value: 0.1 },
      uBurst: { value: 0 },
    }),
    [],
  );
  const fieldUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uActivity: { value: 0 }, uGlow: { value: 0.3 } }),
    [],
  );
  const coreUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uActivity: { value: 0 }, uSize: { value: 2.4 } }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;

    // discharges: a short burst each time a wave crosses the field
    if (p.waveStrength > lastWave.current + 0.25) burst.current = 1;
    lastWave.current = p.waveStrength;
    burst.current *= Math.exp(-dt * 3.4);
    if (p.disturbance > 0.4 && Math.random() < 0.08) burst.current = Math.max(burst.current, 0.7);

    arcUniforms.uTime.value = clock.current;
    arcUniforms.uActivity.value = p.activityLevel;
    arcUniforms.uDensity.value = p.connectionDensity;
    arcUniforms.uBurst.value = burst.current;
    fieldUniforms.uTime.value = clock.current;
    fieldUniforms.uActivity.value = p.activityLevel;
    fieldUniforms.uGlow.value = p.glowIntensity;
    coreUniforms.uTime.value = clock.current;
    coreUniforms.uActivity.value = p.activityLevel;
    coreUniforms.uSize.value = 2.0 + p.glowIntensity * 2.0;

    if (group.current) {
      group.current.rotation.y += dt * (0.05 + p.rotationSpeed * 0.9);
      group.current.rotation.x = Math.sin(clock.current * 0.11) * 0.1;
    }
  });

  return (
    <group ref={group}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-aT" args={[data.t, 1]} />
          <bufferAttribute attach="attributes-aFil" args={[data.fil, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
          <bufferAttribute attach="attributes-aSideA" args={[data.sideA, 3]} />
          <bufferAttribute attach="attributes-aSideB" args={[data.sideB, 3]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={ARC_VERT}
          fragmentShader={ARC_FRAG}
          uniforms={arcUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <mesh>
        <icosahedronGeometry args={[1.02, 4]} />
        <shaderMaterial
          vertexShader={FIELD_VERT}
          fragmentShader={FIELD_FRAG}
          uniforms={fieldUniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.corePos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.coreSeed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default PlasmaOrb;
