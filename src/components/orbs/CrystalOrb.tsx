import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const VERT = /* glsl */ `
attribute float aSeed;
attribute float aRadius;
attribute float aCluster;
uniform float uTime;
uniform float uActivity;
uniform float uWave;
uniform float uWaveRadius;
uniform float uClusters[12];
varying vec3 vN;
varying vec3 vV;
varying float vLit;
varying float vSeed;
void main() {
  vec4 ip = instanceMatrix * vec4(position, 1.0);
  // slow crystalline drift, facets breathing outward with activity
  float breathe = 1.0 + (0.012 + 0.03 * uActivity) * sin(uTime * 0.6 + aSeed * 6.2831);
  ip.xyz *= breathe;

  vec4 mv = modelViewMatrix * ip;
  gl_Position = projectionMatrix * mv;

  mat3 im = mat3(instanceMatrix);
  vN = normalize(normalMatrix * (im * normal));
  vV = -mv.xyz;

  int idx = int(mod(aCluster, 12.0));
  float clusterLit = uClusters[idx];
  // geometric propagation: a lit shell travels through the structure
  float front = uWave * smoothstep(0.20, 0.0, abs(aRadius - uWaveRadius));
  float shimmer = 0.5 + 0.5 * sin(uTime * (1.1 + aSeed * 2.0) + aSeed * 20.0);
  vLit = clamp(0.10 + clusterLit * 1.1 + front * 1.2 + uActivity * 0.35 * shimmer, 0.0, 1.6);
  vSeed = aSeed;
}
`;

const FRAG = /* glsl */ `
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
varying float vLit;
varying float vSeed;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.0);
  // hard facet lighting = unmistakable crystal read
  float facet = clamp(dot(n, normalize(vec3(0.4, 0.8, 0.45))), 0.0, 1.0);
  facet = floor(facet * 5.0) / 5.0;
  vec3 ice = vec3(0.80, 0.92, 1.0);
  vec3 violet = vec3(0.55, 0.50, 1.0);
  vec3 col = mix(violet, ice, facet);
  // faked internal refraction: colour splits with the viewing angle
  col += vec3(0.10, 0.03, 0.16) * fres * 2.0;
  col *= 0.34 + vLit * 0.8;
  float a = 0.16 + facet * 0.30 + fres * 0.45 + vLit * 0.30;
  gl_FragColor = vec4(col * (0.6 + uGlow * 0.4), clamp(a * 0.85, 0.0, 0.9));
}
`;

export function CrystalOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 12);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const mesh = useRef<THREE.InstancedMesh>(null);

  const count = detail < 0.7 ? 40 : 64;

  const attrs = useMemo(() => {
    const seed = new Float32Array(count);
    const radius = new Float32Array(count);
    const cluster = new Float32Array(count);
    const matrices: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      // fibonacci shell + a denser inner shard core
       const inner = i % 5 === 0;
      const t = (i + 0.5) / count;
      const y = 1 - 2 * t;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * 2.399963;
       const rad = inner ? 0.22 + Math.random() * 0.18 : 0.58 + Math.random() * 0.16;
      v.set(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(rad);
      e.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      q.setFromEuler(e);
       const size = (inner ? 0.07 : 0.095) * (0.7 + Math.random() * 0.55);
       s.set(size * (0.7 + Math.random() * 0.45), size * (1.15 + Math.random() * 0.8), size);
      m.compose(v.clone(), q.clone(), s.clone());
      matrices.push(m.clone());
      seed[i] = Math.random();
      radius[i] = rad;
      cluster[i] = i % 12;
    }
    return { seed, radius, cluster, matrices };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uWave: { value: 0 },
      uWaveRadius: { value: 2 },
      uGlow: { value: 0.35 },
      uClusters: { value: new Array(12).fill(0.05) },
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;

    if (mesh.current && !mesh.current.userData["seeded"]) {
      attrs.matrices.forEach((m, i) => mesh.current!.setMatrixAt(i, m));
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.userData["seeded"] = true;
    }

    uniforms.uTime.value = clock.current;
    uniforms.uActivity.value = p.activityLevel;
    uniforms.uWave.value = p.waveStrength;
    uniforms.uWaveRadius.value = p.waveRadius;
    uniforms.uGlow.value = p.glowIntensity;
    const cl = uniforms.uClusters.value as number[];
    for (let i = 0; i < 12; i++) {
      cl[i] = p.clusterActivation[i % p.clusterActivation.length] ?? 0.05;
    }

    if (group.current) {
      group.current.rotation.y += dt * (0.03 + p.rotationSpeed * 0.55);
      group.current.rotation.x = Math.sin(clock.current * 0.05) * 0.12;
    }
  });

  return (
    <group ref={group}>
      {/* A single faceted gemstone gives the structure a deliberate silhouette. */}
      <mesh scale={0.72} rotation={[0.2, 0.4, 0.08]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          color="#8178ff"
          roughness={0.08}
          metalness={0.1}
          transmission={0.42}
          thickness={0.7}
          ior={1.7}
          iridescence={0.65}
          transparent
          opacity={0.64}
        />
      </mesh>

      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
        <instancedBufferAttribute attach="attributes-aSeed" args={[attrs.seed, 1]} />
        <instancedBufferAttribute attach="attributes-aRadius" args={[attrs.radius, 1]} />
        <instancedBufferAttribute attach="attributes-aCluster" args={[attrs.cluster, 1]} />
      </instancedMesh>
    </group>
  );
}

export default CrystalOrb;
