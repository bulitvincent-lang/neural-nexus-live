import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const VEIL_VERT = /* glsl */ `
uniform float uTime;
uniform float uActivity;
uniform float uPhase;
uniform float uRadius;
uniform float uArc;
uniform float uTilt;
uniform float uWave;
varying vec2 vUv;
varying float vFold;
void main() {
  vUv = uv;
  float t = uTime * (0.10 + 0.42 * uActivity) + uPhase;
  // the veil is a curved sheet wrapped around the orb
  float theta = (uv.x - 0.5) * uArc + t * 0.55;
  float drift = sin(uv.x * 6.0 + t * 1.5) * (0.05 + 0.13 * uActivity)
              + sin(uv.x * 13.0 - t * 0.9) * (0.02 + 0.06 * uActivity);
  float r = uRadius + drift + uWave * 0.12;
  float h = (uv.y - 0.5) * (1.35 + 0.35 * uActivity);
  h += sin(uv.x * 8.0 + t * 1.1) * 0.10;
  vec3 p = vec3(cos(theta) * r, h, sin(theta) * r);
  // tilt the sheet so veils cross each other in depth
  float c = cos(uTilt), s = sin(uTilt);
  p = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
  vFold = drift;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const VEIL_FRAG = /* glsl */ `
uniform float uTime;
uniform float uActivity;
uniform float uGlow;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uPhase;
varying vec2 vUv;
varying float vFold;
void main() {
  // soft vertical falloff = luminous curtain, brightest at the base
  float vertical = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.12, vUv.y);
  float edges = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
  float strands = 0.55 + 0.45 * sin(vUv.x * 60.0 + uTime * (0.6 + uActivity * 2.2) + uPhase * 4.0);
  vec3 col = mix(uColorA, uColorB, clamp(vUv.y * 1.3 + vFold * 2.0, 0.0, 1.0));
  float a = vertical * edges * strands * (0.12 + 0.30 * uActivity + 0.14 * uGlow);
  gl_FragColor = vec4(col * (0.75 + uGlow * 0.8), clamp(a, 0.0, 0.7));
}
`;

const HAZE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const HAZE_FRAG = /* glsl */ `
uniform float uActivity;
varying vec3 vN;
varying vec3 vV;
void main() {
  float fres = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.6);
  vec3 col = mix(vec3(0.035, 0.85, 1.0), vec3(1.0, 0.31, 0.85), 0.4 + 0.4 * uActivity);
  gl_FragColor = vec4(col, fres * (0.08 + 0.16 * uActivity));
}
`;

const VEILS = [
  { radius: 0.62, arc: 4.2, tilt: 0.18, phase: 0.0, a: "#09d8ff", b: "#6b62ff" },
  { radius: 0.78, arc: 3.4, tilt: -0.24, phase: 1.7, a: "#6b62ff", b: "#ff4fd8" },
  { radius: 0.92, arc: 5.0, tilt: 0.32, phase: 3.1, a: "#09d8ff", b: "#ffae55" },
  { radius: 1.02, arc: 2.8, tilt: -0.12, phase: 4.6, a: "#dffbff", b: "#ff4fd8" },
  { radius: 0.7, arc: 5.6, tilt: 0.42, phase: 5.9, a: "#ff4fd8", b: "#09d8ff" },
  { radius: 0.86, arc: 3.9, tilt: -0.36, phase: 2.4, a: "#ffae55", b: "#6b62ff" },
] as const;

export function AuroraOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 8);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);

  const veils = detail < 0.7 ? VEILS.slice(0, 4) : VEILS;
  const segX = detail < 0.7 ? 60 : 120;

  const uniformSets = useMemo(
    () =>
      veils.map((v) => ({
        uTime: { value: 0 },
        uActivity: { value: 0 },
        uGlow: { value: 0.3 },
        uPhase: { value: v.phase },
        uRadius: { value: v.radius },
        uArc: { value: v.arc },
        uTilt: { value: v.tilt },
        uWave: { value: 0 },
        uColorA: { value: new THREE.Color(v.a) },
        uColorB: { value: new THREE.Color(v.b) },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [veils.length],
  );

  const hazeUniforms = useMemo(() => ({ uActivity: { value: 0 } }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    uniformSets.forEach((u, i) => {
      u.uTime.value = clock.current + i * 3.3;
      u.uActivity.value = p.activityLevel;
      u.uGlow.value = p.glowIntensity;
      u.uWave.value = p.waveStrength * (0.5 + 0.5 * Math.sin(i * 1.7));
    });
    hazeUniforms.uActivity.value = p.activityLevel;
    if (group.current) {
      group.current.rotation.y += dt * (0.02 + p.rotationSpeed * 0.4);
      group.current.rotation.x = Math.sin(clock.current * 0.05) * 0.07;
    }
  });

  return (
    <group ref={group}>
      {veils.map((v, i) => (
        <mesh key={v.phase} frustumCulled={false}>
          <planeGeometry args={[1, 1, segX, 10]} />
          <shaderMaterial
            vertexShader={VEIL_VERT}
            fragmentShader={VEIL_FRAG}
            uniforms={uniformSets[i]}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <shaderMaterial
          vertexShader={HAZE_VERT}
          fragmentShader={HAZE_FRAG}
          uniforms={hazeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default AuroraOrb;
