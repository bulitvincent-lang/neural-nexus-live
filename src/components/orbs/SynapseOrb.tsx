import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

const BRANCH_VERT = /* glsl */ `
attribute float aGrow;    // 0..1 birth order
attribute float aDepth;   // 0..1 depth in the tree
attribute float aSeed;
uniform float uTime;
uniform float uGrowth;
uniform float uActivity;
varying float vA;
varying float vDepth;
void main() {
  vec3 p = position;
  float sway = (0.008 + 0.02 * uActivity) * aDepth;
  p += vec3(
    sin(uTime * 0.8 + aSeed * 6.28) * sway,
    cos(uTime * 0.7 + aSeed * 4.11) * sway,
    sin(uTime * 0.6 + aSeed * 2.77) * sway
  );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float alive = smoothstep(uGrowth, uGrowth - 0.12, aGrow);
  float breathe = 0.62 + 0.38 * sin(uTime * (0.9 + aSeed) + aSeed * 9.0);
  vA = alive * (0.26 + 0.6 * uActivity + 0.18 * breathe) * (1.15 - aDepth * 0.45);
  vDepth = aDepth;
}
`;

const BRANCH_FRAG = /* glsl */ `
varying float vA;
varying float vDepth;
void main() {
  vec3 base = vec3(0.42, 0.95, 0.72);
  vec3 tip = vec3(0.78, 1.0, 0.58);
  gl_FragColor = vec4(mix(base, tip, vDepth), clamp(vA, 0.0, 0.9));
}
`;

const PULSE_VERT = /* glsl */ `
attribute float aEnergy;
uniform float uSize;
varying float vE;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vE = aEnergy;
  gl_PointSize = uSize * (0.6 + aEnergy) * (70.0 / -mv.z);
}
`;

const PULSE_FRAG = /* glsl */ `
varying float vE;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(vec3(0.55, 1.0, 0.78), vec3(1.0), 0.35 * vE);
  gl_FragColor = vec4(col * (0.55 + vE * 0.5), a * a * clamp(vE, 0.0, 1.0) * 0.55);
}
`;

interface Seg {
  a: THREE.Vector3;
  b: THREE.Vector3;
  depth: number;
  children: number[];
  order: number;
}

function buildDendrites(trunks: number, maxDepth: number) {
  const segs: Seg[] = [];
  const push = (a: THREE.Vector3, b: THREE.Vector3, depth: number, parent: number) => {
    const idx = segs.length;
    segs.push({ a, b, depth, children: [], order: 0 });
    if (parent >= 0) segs[parent].children.push(idx);
    return idx;
  };

  const grow = (from: THREE.Vector3, dir: THREE.Vector3, depth: number, parent: number) => {
    if (depth > maxDepth) return;
    // short segments that shorten with depth: the classic dendritic taper
    const len = 0.3 * Math.pow(0.76, depth) * (0.8 + Math.random() * 0.45);
    const to = from.clone().addScaledVector(dir, len);
    if (to.length() > 1.0) to.setLength(0.94 + Math.random() * 0.06);
    const idx = push(from.clone(), to, depth, parent);
    const branches = depth === 0 ? 2 : Math.random() < 0.7 ? 2 : 3;
    for (let i = 0; i < branches; i++) {
      // wide, evenly spread bifurcation angles instead of a straight tuft
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .cross(dir)
        .normalize();
      const angle = 0.45 + Math.random() * 0.45;
      const next = dir
        .clone()
        .applyAxisAngle(axis, i % 2 === 0 ? angle : -angle)
        .normalize();
      grow(to, next, depth + 1, idx);
    }
  };

  for (let i = 0; i < trunks; i++) {
    // fibonacci sphere: trunks leave the soma in every direction, evenly
    const y = 1 - (2 * (i + 0.5)) / trunks;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963;
    const dir = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).normalize();
    grow(new THREE.Vector3().addScaledVector(dir, 0.07), dir, 0, -1);
  }


  segs.forEach((s, i) => {
    s.order = i / Math.max(1, segs.length - 1);
  });
  return segs;
}

export function SynapseOrb({ engineRef, detail = 1 }: OrbViewProps) {
  const engine = useOrbEngine(engineRef, 9);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const growth = useRef(0.35);

  const data = useMemo(() => {
    const segs = buildDendrites(detail < 0.7 ? 12 : 18, detail < 0.7 ? 5 : 6);
    const E = segs.length;
    const pos = new Float32Array(E * 6);
    const grow = new Float32Array(E * 2);
    const depth = new Float32Array(E * 2);
    const seed = new Float32Array(E * 2);
    segs.forEach((s, i) => {
      pos.set([s.a.x, s.a.y, s.a.z, s.b.x, s.b.y, s.b.z], i * 6);
      grow[i * 2] = s.order;
      grow[i * 2 + 1] = s.order;
      const d = s.depth / 5;
      depth[i * 2] = d;
      depth[i * 2 + 1] = d;
      const sd = Math.random();
      seed[i * 2] = sd;
      seed[i * 2 + 1] = sd;
    });

    const P = Math.round(220 * detail);
    const pulses = {
      seg: new Int32Array(P),
      t: new Float32Array(P),
      speed: new Float32Array(P),
      energy: new Float32Array(P),
      pos: new Float32Array(P * 3),
      energyAttr: new Float32Array(P),
      count: P,
    };
    return { segs, pos, grow, depth, seed, pulses };
  }, [detail]);

  const branchUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uGrowth: { value: 0.4 }, uActivity: { value: 0 } }),
    [],
  );
  const pulseUniforms = useMemo(() => ({ uSize: { value: 3.2 } }), []);
  const pulseGeo = useRef<THREE.BufferGeometry>(null);

  const spawn = (segIdx: number, energy: number, speed: number) => {
    const p = data.pulses;
    for (let i = 0; i < p.count; i++) {
      if (p.energy[i] <= 0.001) {
        p.seg[i] = segIdx;
        p.t[i] = 0;
        p.energy[i] = energy;
        p.speed[i] = speed;
        return;
      }
    }
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    const { segs, pulses } = data;

    // temporary growth: new ramifications appear while the AI works
    const target = 0.34 + p.activityLevel * 0.62 + p.waveStrength * 0.1;
    growth.current += (target - growth.current) * (1 - Math.exp(-dt / (target > growth.current ? 0.5 : 2.6)));
    branchUniforms.uTime.value = clock.current;
    branchUniforms.uGrowth.value = growth.current;
    branchUniforms.uActivity.value = p.activityLevel;
    pulseUniforms.uSize.value = 2.2 + p.glowIntensity * 1.2;

    // synaptic firing from the trunks
    let toSpawn = (2 + p.pulseCount * 34) * dt;
    while (toSpawn > 0) {
      if (toSpawn < 1 && Math.random() > toSpawn) break;
      toSpawn -= 1;
      const root = (Math.random() * Math.min(segs.length, 24)) | 0;
      spawn(root, 0.45 + Math.random() * 0.55, 0.6 + p.pulseSpeed * 1.6);
    }

    for (let i = 0; i < pulses.count; i++) {
      if (pulses.energy[i] <= 0.001) {
        pulses.energyAttr[i] = 0;
        continue;
      }
      const seg = segs[pulses.seg[i]];
      const len = Math.max(0.02, seg.a.distanceTo(seg.b));
      pulses.t[i] += (pulses.speed[i] * dt) / len;
      if (pulses.t[i] >= 1) {
        const alive = seg.children.filter((c) => segs[c].order <= growth.current);
        const energy = pulses.energy[i] * 0.82;
        pulses.energy[i] = 0;
        pulses.energyAttr[i] = 0;
        if (alive.length && energy > 0.1) {
          spawn(alive[(Math.random() * alive.length) | 0], energy, pulses.speed[i]);
          if (alive.length > 1 && Math.random() < 0.35 + p.networkEntropy * 0.4) {
            spawn(alive[(Math.random() * alive.length) | 0], energy * 0.7, pulses.speed[i]);
          }
        }
        continue;
      }
      const t = pulses.t[i];
      pulses.pos[i * 3] = seg.a.x + (seg.b.x - seg.a.x) * t;
      pulses.pos[i * 3 + 1] = seg.a.y + (seg.b.y - seg.a.y) * t;
      pulses.pos[i * 3 + 2] = seg.a.z + (seg.b.z - seg.a.z) * t;
      pulses.energyAttr[i] = Math.min(1, pulses.energy[i] * (0.6 + 0.7 * p.glowIntensity));
    }

    if (pulseGeo.current) {
      (pulseGeo.current.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      (pulseGeo.current.getAttribute("aEnergy") as THREE.BufferAttribute).needsUpdate = true;
    }
    if (group.current) {
      group.current.rotation.y += dt * (0.03 + p.rotationSpeed * 0.5);
      group.current.rotation.x = Math.sin(clock.current * 0.08) * 0.14;
    }
  });

  return (
    <group ref={group} scale={0.78}>
      {/* soma: the structure has a living centre */}
      <mesh>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshBasicMaterial
          color="#dbfff0"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshBasicMaterial
          color="#3ce0a0"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-aGrow" args={[data.grow, 1]} />
          <bufferAttribute attach="attributes-aDepth" args={[data.depth, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={BRANCH_VERT}
          fragmentShader={BRANCH_FRAG}
          uniforms={branchUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points frustumCulled={false}>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[data.pulses.pos, 3]} />
          <bufferAttribute attach="attributes-aEnergy" args={[data.pulses.energyAttr, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={PULSE_VERT}
          fragmentShader={PULSE_FRAG}
          uniforms={pulseUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default SynapseOrb;
