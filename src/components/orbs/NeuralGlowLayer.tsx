import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Shared luminous neural layer added on top of every paid orb.
 * Continuous glowing links, bright nodes, impulses that physically travel
 * along the connections and a strong local activation under the cursor.
 * Neural keeps its own original renderer and never uses this layer.
 */
export interface GlowState {
  /** 0..1 engine activity */
  activity: number;
  /** 0..1 hover energy */
  hover: number;
  /** cursor position in the orb's local space */
  cursor: THREE.Vector3;
}

const LINE_VERT = /* glsl */ `
uniform float uTime;
uniform float uHover;
uniform vec3 uMouse;
attribute float aPhase;
varying float vGlow;
varying float vPulse;
void main() {
  vec3 p = position;
  float d = distance(p, uMouse);
  float localGlow = (1.0 - smoothstep(0.0, 0.85, d)) * uHover;
  float breathe = 0.5 + 0.5 * sin(uTime * 1.7 + aPhase);
  vGlow = localGlow;
  vPulse = breathe;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const LINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uActivity;
varying float vGlow;
varying float vPulse;
void main() {
  float idle = 0.22 + vPulse * 0.13;
  float intensity = idle + uActivity * 0.55 + vGlow * 2.4;
  float alpha = 0.20 + uActivity * 0.22 + vGlow * 0.62;
  gl_FragColor = vec4(uColor * (0.75 + intensity * 1.5), clamp(alpha, 0.0, 1.0));
}
`;

const NODE_VERT = /* glsl */ `
uniform float uTime;
uniform float uHover;
uniform float uActivity;
uniform vec3 uMouse;
varying float vStrength;
void main() {
  vec3 p = position;
  float d = distance(p, uMouse);
  float proximity = (1.0 - smoothstep(0.0, 0.75, d)) * uHover;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.4 + position.x * 8.0 + position.y * 6.0);
  float strength = 0.3 + proximity * 1.7 + uActivity * 0.6 + pulse * 0.16;
  vStrength = strength;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.2 + strength * 3.2) * (140.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const NODE_FRAG = /* glsl */ `
uniform vec3 uPrimary;
uniform vec3 uSecondary;
varying float vStrength;
void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.24, 0.0, d);
  float halo = smoothstep(0.5, 0.05, d);
  vec3 color = mix(uPrimary, uSecondary, core) * (1.0 + vStrength * 1.6);
  gl_FragColor = vec4(color, halo * min(1.0, 0.35 + vStrength * 0.8));
}
`;

const PULSE_VERT = /* glsl */ `
attribute float aBright;
varying float vB;
void main() {
  vB = aBright;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (4.5 + aBright * 6.0) * (140.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const PULSE_FRAG = /* glsl */ `
uniform vec3 uHot;
uniform vec3 uAccent;
varying float vB;
void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.18, 0.0, d);
  float halo = pow(smoothstep(0.5, 0.0, d), 1.7);
  vec3 col = mix(uAccent, uHot, core);
  col = mix(col, vec3(1.0), 0.30);
  gl_FragColor = vec4(col * (1.5 + vB * 2.0), clamp(core + halo * 0.5, 0.0, 1.0));
}
`;

export type GlowTopology =
  | "spiral"
  | "disc"
  | "membrane"
  | "dendrite"
  | "ring"
  | "facet"
  | "shard"
  | "filament"
  | "ribbon";

/** each orb keeps its own silhouette while sharing the luminous layer */
function shape(topology: GlowTopology, p: THREE.Vector3, i: number) {
  switch (topology) {
    case "disc":
    case "spiral": {
      // flattened galactic disc with swirling arms
      const r = Math.sqrt(p.x * p.x + p.z * p.z);
      const a = Math.atan2(p.z, p.x) + r * 2.4;
      p.set(Math.cos(a) * r, p.y * 0.22 + Math.sin(r * 5.0) * 0.05, Math.sin(a) * r);
      break;
    }
    case "ring": {
      // equatorial belt plus a sparse halo
      if (i % 3 !== 0) p.y *= 0.16;
      break;
    }
    case "ribbon": {
      // wide flowing aurora bands
      p.y += Math.sin(p.x * 3.1 + p.z * 2.2) * 0.16;
      break;
    }
    case "membrane": {
      // rippling liquid surface
      const k = 1 + Math.sin(p.x * 4.2) * 0.05 + Math.cos(p.y * 3.6) * 0.05;
      p.multiplyScalar(k);
      break;
    }
    case "dendrite": {
      // radial branches of different lengths
      p.multiplyScalar(0.62 + ((i * 37) % 11) / 24);
      break;
    }
    case "facet":
    case "shard": {
      // faceted crystal: quantised radius
      const q = 0.72 + Math.round((((i * 53) % 17) / 17) * 4) / 5.2;
      p.multiplyScalar(q);
      break;
    }
    case "filament":
      p.multiplyScalar(0.9 + Math.sin(i * 0.7) * 0.08);
      break;
  }
  return p;
}

function buildGraph(nodeCount: number, radius: number, topology: GlowTopology) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodeCount; i++) {
    const y = 1 - (i / (nodeCount - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const p = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
    const noise = 1 + Math.sin(i * 1.731) * 0.018 + Math.sin(i * 0.417) * 0.012;
    pts.push(shape(topology, p.multiplyScalar(radius * noise), i));
  }

  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const cand: { j: number; d: number }[] = [];
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      cand.push({ j, d: pts[i]!.distanceToSquared(pts[j]!) });
    }
    cand.sort((a, b) => a.d - b.d);
    const links = i % 4 === 0 ? 4 : 3;
    for (let k = 0; k < links; k++) {
      const j = cand[k]!.j;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([Math.min(i, j), Math.max(i, j)]);
    }
  }

  const nodes = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => {
    nodes[i * 3] = p.x;
    nodes[i * 3 + 1] = p.y;
    nodes[i * 3 + 2] = p.z;
  });

  const edges = new Float32Array(pairs.length * 6);
  const phases = new Float32Array(pairs.length * 2);
  pairs.forEach(([a, b], i) => {
    const pa = pts[a]!;
    const pb = pts[b]!;
    const o = i * 6;
    edges[o] = pa.x;
    edges[o + 1] = pa.y;
    edges[o + 2] = pa.z;
    edges[o + 3] = pb.x;
    edges[o + 4] = pb.y;
    edges[o + 5] = pb.z;
    const ph = (Math.sin(i * 12.9898) * 43758.5453) % (Math.PI * 2);
    phases[i * 2] = ph;
    phases[i * 2 + 1] = ph;
  });

  return { pts, nodes, edges, phases, pairs };
}

export function NeuralGlowLayer({
  state,
  topology,
  primary,
  secondary,
  hot,
  radius = 0.99,
  nodeCount = 190,
  pulses = 42,
}: {
  state: GlowState;
  topology: GlowTopology;
  primary: string;
  secondary: string;
  hot: string;
  radius?: number;
  nodeCount?: number;
  pulses?: number;
}) {
  const graph = useMemo(
    () => buildGraph(nodeCount, radius, topology),
    [nodeCount, radius, topology],
  );

  const col = useMemo(
    () => ({
      primary: new THREE.Color(primary),
      secondary: new THREE.Color(secondary),
      hot: new THREE.Color(hot),
    }),
    [primary, secondary, hot],
  );

  const lineU = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uActivity: { value: 0 },
      uMouse: { value: new THREE.Vector3(9, 9, 9) },
      uColor: { value: col.primary },
    }),
    [col],
  );

  const nodeU = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uActivity: { value: 0 },
      uMouse: { value: new THREE.Vector3(9, 9, 9) },
      uPrimary: { value: col.primary },
      uSecondary: { value: col.secondary },
    }),
    [col],
  );

  const pulseU = useMemo(
    () => ({ uHot: { value: col.hot }, uAccent: { value: col.secondary } }),
    [col],
  );

  const routes = useMemo(() => {
    let s = 7;
    const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    return new Array(pulses).fill(null).map(() => ({
      edge: Math.floor(rnd() * graph.pairs.length),
      offset: rnd(),
      speed: 0.22 + rnd() * 0.4,
      bright: 0.3 + rnd() * 0.7,
    }));
  }, [graph, pulses]);

  const pulsePos = useMemo(() => new Float32Array(pulses * 3), [pulses]);
  const pulseBright = useMemo(() => {
    const a = new Float32Array(pulses);
    routes.forEach((r, i) => (a[i] = r.bright));
    return a;
  }, [routes, pulses]);

  const pointsRef = useRef<THREE.Points>(null);
  const t = useRef(0);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;
    const time = t.current;
    const { activity, hover, cursor } = state;

    lineU.uTime.value = time;
    lineU.uHover.value = hover;
    lineU.uActivity.value = activity;
    lineU.uMouse.value.copy(cursor);
    nodeU.uTime.value = time;
    nodeU.uHover.value = hover;
    nodeU.uActivity.value = activity;
    nodeU.uMouse.value.copy(cursor);

    const boost = 1 + activity * 2.2 + hover * 2.4;
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i]!;
      const [a, b] = graph.pairs[r.edge]!;
      tmpA.set(graph.nodes[a * 3]!, graph.nodes[a * 3 + 1]!, graph.nodes[a * 3 + 2]!);
      tmpB.set(graph.nodes[b * 3]!, graph.nodes[b * 3 + 1]!, graph.nodes[b * 3 + 2]!);
      const p = (time * r.speed * boost + r.offset) % 1;
      tmpA.lerp(tmpB, p);
      pulsePos[i * 3] = tmpA.x;
      pulsePos[i * 3 + 1] = tmpA.y;
      pulsePos[i * 3 + 2] = tmpA.z;
    }
    const attr = pointsRef.current?.geometry.attributes["position"] as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <group>
      {/* glowing connection web */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.edges, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[graph.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={LINE_VERT}
          fragmentShader={LINE_FRAG}
          uniforms={lineU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* bright nodes */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.nodes, 3]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          uniforms={nodeU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* impulses travelling through the network */}
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePos, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[pulseBright, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={PULSE_VERT}
          fragmentShader={PULSE_FRAG}
          uniforms={pulseU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default NeuralGlowLayer;
