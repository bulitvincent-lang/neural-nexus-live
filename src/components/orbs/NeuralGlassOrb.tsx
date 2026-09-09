import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useOrbEngine, type OrbViewProps } from "./useOrbEngine";

/**
 * One realistic "neural network under glass" renderer, shared by every paid orb.
 * Each orb is a variant: its own topology, palette, motion and detail accents,
 * but the same physically-lit glass envelope, dense node field, link web,
 * fine filaments and travelling impulses.
 */

export type Topology =
  | "spiral"
  | "disc"
  | "membrane"
  | "dendrite"
  | "ring"
  | "facet"
  | "filament"
  | "ribbon";

export interface OrbVariant {
  topology: Topology;
  /** node colours: deep, main, hot */
  palette: [string, string, string];
  /** fine filament / highlight colour */
  accent: string;
  /** glass envelope tint */
  glass: string;
  nodes: number;
  /** links per node */
  degree: number;
  /** radial breathing amplitude */
  breath: number;
  spin: number;
  /** additive rim strength of the glass shell */
  rim: number;
  /** draw the glass envelope at all (off for most orbs) */
  shell?: boolean;
  rays?: boolean;
  satellites?: number;
  coreSize?: number;
  /** number of electric arcs crackling inside the orb */
  bolts?: number;
  /** static tilt of the whole structure, in radians */
  tilt?: number;
}

const NODE_VERT = /* glsl */ `
attribute float aSeed;
attribute float aTint;
attribute float aScale;
attribute float aOrder;
uniform float uTime;
uniform float uActivity;
uniform float uNode;
uniform float uBreath;
uniform float uSize;
uniform float uBuild;
varying float vI;
varying float vTint;

void main() {
  vec3 dir = normalize(position + 1e-5);
  float r = length(position);
  // the structure assembles from the core outwards as uBuild rises
  float rev = smoothstep(aOrder - 0.42, aOrder + 0.05, uBuild);
  float wob = sin(uTime * (0.6 + aSeed * 0.9) + aSeed * 31.0);
  vec3 p = dir * (r * mix(0.9, 1.0, rev) + wob * uBreath * (0.35 + uActivity * 0.9) * rev);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float fire = 0.5 + 0.5 * sin(uTime * (1.1 + aSeed * 3.4) + aSeed * 40.0);
  // at rest the orb glows low; hovering makes every node blaze
  vI = mix(0.30, 1.0, fire * (0.35 + uNode * 0.85)) * rev
     * (0.62 + smoothstep(0.78, 1.0, uBuild) * 0.75);
  vTint = aTint;
  gl_PointSize = uSize * aScale * (0.8 + 0.55 * uActivity) * (26.0 / -mv.z) * rev;
}
`;

const NODE_FRAG = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uMain;
uniform vec3 uHot;
varying float vI;
varying float vTint;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  // tight bright core + soft halo, like a real glowing node
  float core = smoothstep(0.16, 0.0, d);
  float halo = pow(smoothstep(0.5, 0.0, d), 2.4);
  vec3 col = mix(uDeep, uMain, smoothstep(0.0, 0.6, vTint));
  col = mix(col, uHot, smoothstep(0.62, 1.0, vTint) * vI);
  float a = (halo * 0.22 + core * 0.9) * (0.45 + vI * 0.55);
  gl_FragColor = vec4(col * (0.9 + vI * 1.5) + core * 0.45, clamp(a * 1.5, 0.0, 1.0));
}
`;

const LINK_VERT = /* glsl */ `
attribute float aSeed;
attribute float aEnd;
attribute float aTint;
attribute float aOrder;
uniform float uTime;
uniform float uActivity;
uniform float uDensity;
uniform float uBreath;
uniform float uBuild;
varying float vI;
varying float vTint;
varying float vEnd;
void main() {
  vec3 dir = normalize(position + 1e-5);
  float r = length(position);
  float rev = smoothstep(aOrder - 0.42, aOrder + 0.05, uBuild);
  float wob = sin(uTime * (0.6 + aSeed * 0.9) + aSeed * 31.0);
  vec3 p = dir * (r * mix(0.9, 1.0, rev) + wob * uBreath * (0.35 + uActivity * 0.9) * rev);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // travelling impulse along the link
  float phase = fract(uTime * (0.16 + uActivity * 0.6) + aSeed);
  float pulse = smoothstep(0.35, 0.0, abs(phase - aEnd));
  float on = max(0.45, step(1.0 - uDensity * 0.95, aSeed));
  vI = ((0.55 + 0.45 * uActivity) * on + pulse * (0.5 + uActivity * 0.9)) * rev
     * (0.6 + smoothstep(0.78, 1.0, uBuild) * 0.85);
  vTint = aTint;
  vEnd = aEnd;
}
`;

const LINK_FRAG = /* glsl */ `
uniform vec3 uMain;
uniform vec3 uAccent;
varying float vI;
varying float vTint;
void main() {
  vec3 col = mix(uMain, uAccent, smoothstep(0.7, 1.0, vTint));
  // additive: brightness comes from rgb * alpha, so keep both meaningful
  col = mix(col, vec3(1.0), 0.18);
  gl_FragColor = vec4(col * (0.9 + vI * 1.7), clamp(0.3 + vI * 0.9, 0.0, 1.0));
}
`;

const GLASS_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const GLASS_FRAG = /* glsl */ `
uniform vec3 uGlass;
uniform vec3 uAccent;
uniform float uRim;
uniform float uActivity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float rim = pow(f, 3.2);
  float sheen = pow(max(dot(normalize(vN), normalize(vec3(0.55, 0.75, 0.45))), 0.0), 26.0);
  float band = 0.04 * sin(vN.y * 26.0 + uTime * 0.5);
  vec3 col = uGlass * (rim * uRim * (0.8 + uActivity * 0.4) + band) + uAccent * sheen * 0.7;
  float a = rim * 0.24 * uRim + sheen * 0.28 + 0.012;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.5));
}
`;

const CORE_VERT = GLASS_VERT;
const CORE_FRAG = /* glsl */ `
uniform vec3 uMain;
uniform vec3 uHot;
uniform float uActivity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float body = pow(1.0 - f, 1.4);
  float flicker = 0.85 + 0.15 * sin(uTime * 2.1);
  vec3 col = mix(uMain, uHot, 0.35 + uActivity * 0.5) * (0.5 + body * 1.6) * flicker;
  gl_FragColor = vec4(col * 0.55, (0.02 + body * 0.09) * (0.4 + uActivity * 0.6));
}
`;

/** crackling electric arcs: each bolt flashes on its own rhythm */
const BOLT_VERT = /* glsl */ `
attribute float aSeed;
attribute float aAlong;
uniform float uTime;
uniform float uActivity;
uniform float uBuild;
varying float vI;
void main() {
  vec3 p = position;
  // jitter the arc a little every flash so it never looks static
  float j = sin(uTime * 9.0 + aSeed * 53.0 + aAlong * 17.0);
  p += normalize(vec3(
    sin(aSeed * 11.0), cos(aSeed * 7.0), sin(aSeed * 5.0)
  )) * j * 0.018 * (0.4 + uActivity);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float phase = fract(uTime * (0.28 + uActivity * 0.9) + aSeed);
  float flash = pow(smoothstep(0.16, 0.0, phase), 1.5);
  float travel = smoothstep(0.28, 0.0, abs(phase * 3.4 - aAlong));
  vI = (flash * (0.55 + uActivity) + travel * 0.55 * (0.3 + uActivity))
     * smoothstep(0.86, 1.0, uBuild);
}
`;

const BOLT_FRAG = /* glsl */ `
uniform vec3 uHot;
uniform vec3 uAccent;
varying float vI;
void main() {
  vec3 col = mix(uAccent, uHot, 0.5) + vI * 0.5;
  gl_FragColor = vec4(col * (0.5 + vI * 1.4), clamp(vI, 0.0, 1.0) * 0.85);
}
`;

function fib(i: number, n: number) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = i * 2.399963229728653;
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
}

function buildNodes(v: OrbVariant, count: number) {
  const pts: THREE.Vector3[] = [];
  const tint: number[] = [];
  const scale: number[] = [];
  const rnd = mulberry(count * 7 + v.topology.length * 31);

  for (let i = 0; i < count; i++) {
    const u = fib(i, count);
    let p = u.clone();
    let t = rnd();
    switch (v.topology) {
      case "spiral": {
        // spherical spiral arms: nodes gather along two swept bands
        const arm = i % 2;
        const s = i / count;
        const theta = s * Math.PI * 7.2 + arm * Math.PI;
        const phi = Math.acos(1 - 2 * s);
        const jitter = 0.09 + rnd() * 0.16;
        p = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        )
          .multiplyScalar(0.62 + s * 0.36)
          .add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(jitter));
        t = 0.25 + s * 0.7;
        break;
      }
      case "disc": {
        // real galactic disc: flat sweeping arms + dense bulge, clearly not a shell
        const arm = i % 3;
        const s = Math.pow(rnd(), 0.65);
        const radius = 0.14 + s * 0.86;
        const theta = radius * 5.6 + (arm * Math.PI * 2) / 3 + (rnd() - 0.5) * 0.5;
        const thick = (0.16 - radius * 0.11) * (rnd() - 0.5) * 2;
        p = new THREE.Vector3(
          Math.cos(theta) * radius,
          thick + (rnd() - 0.5) * 0.03,
          Math.sin(theta) * radius,
        );
        if (rnd() > 0.86) {
          // sparse halo stars above and below the disc
          p = fib(i, count).multiplyScalar(0.55 + rnd() * 0.45);
        }
        t = 1 - s * 0.85;
        break;
      }
      case "membrane": {
        const shell = 0.82 + Math.pow(rnd(), 2.2) * 0.16;
        p.multiplyScalar(shell);
        break;
      }
      case "dendrite": {
        // radial trunks with dense terminal tufts
        const trunk = fib(i % 26, 26);
        const along = Math.pow(rnd(), 0.55);
        p = trunk
          .clone()
          .multiplyScalar(0.24 + along * 0.72)
          .add(
            new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(
              0.05 + along * 0.2,
            ),
          );
        t = along;
        break;
      }
      case "ring": {
        const band = Math.abs(u.y) < 0.24;
        if (band) {
          const a = rnd() * Math.PI * 2;
          const r = 0.72 + Math.pow(rnd(), 1.6) * 0.28;
          p = new THREE.Vector3(Math.cos(a) * r, (rnd() - 0.5) * 0.07, Math.sin(a) * r);
          t = 0.75 + rnd() * 0.25;
        } else {
          p.multiplyScalar(0.9 + rnd() * 0.08);
          t = rnd() * 0.4;
        }
        break;
      }
      case "facet": {
        // snap nodes to the vertices/edges of a fine polyhedral cage
        const cage = fib(i % 42, 42);
        const blend = Math.pow(rnd(), 1.4);
        p = cage.clone().lerp(u, blend).normalize().multiplyScalar(0.84 + rnd() * 0.14);
        t = 1 - blend;
        break;
      }
      case "filament": {
        // long great-circle filaments
        const strand = i % 18;
        const axis = fib(strand, 18);
        const q = new THREE.Quaternion().setFromAxisAngle(axis, (i / count) * Math.PI * 12);
        p = new THREE.Vector3(1, 0, 0)
          .applyQuaternion(q)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), strand * 0.7)
          .multiplyScalar(0.8 + rnd() * 0.16)
          .add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.04));
        t = 0.4 + rnd() * 0.6;
        break;
      }
      case "ribbon": {
        const strand = i % 3;
        const s = i / count;
        const a = s * Math.PI * 6 + strand * 2.1;
        const y = Math.sin(a * 0.5 + strand) * 0.8;
        const r = Math.sqrt(Math.max(0.05, 1 - y * y)) * (0.86 + strand * 0.05);
        p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).add(
          new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.06),
        );
        t = 0.2 + strand * 0.3 + rnd() * 0.2;
        break;
      }
    }
    pts.push(p);
    tint.push(t);
    scale.push(0.55 + Math.pow(rnd(), 2.6) * 1.9);
  }
  return { pts, tint, scale };
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** cheap k-nearest link web */
function buildLinks(pts: THREE.Vector3[], degree: number) {
  const a: number[] = [];
  // sample enough sources for a dense web while keeping the cost bounded
  const stride = Math.max(1, Math.floor(pts.length / 1600));
  const dists: number[] = [];
  for (let i = 0; i < pts.length; i += stride) {
    const best: { j: number; d: number }[] = [];
    for (let j = 0; j < pts.length; j += stride) {
      if (i === j) continue;
      const d = pts[i]!.distanceToSquared(pts[j]!);
      if (best.length < degree) best.push({ j, d });
      else {
        let worst = 0;
        for (let k = 1; k < best.length; k++) if (best[k]!.d > best[worst]!.d) worst = k;
        if (d < best[worst]!.d) best[worst] = { j, d };
      }
    }
    for (const b of best) {
      if (b.j <= i) continue;
      a.push(i, b.j);
      dists.push(b.d);
    }
  }
  // drop the longest 12% so the web stays local instead of drawing random polygons
  if (dists.length > 20) {
    const sorted = [...dists].sort((x, y) => x - y);
    const cut = sorted[Math.floor(sorted.length * 0.88)]!;
    const filtered: number[] = [];
    for (let k = 0; k < dists.length; k++) {
      if (dists[k]! <= cut) filtered.push(a[k * 2]!, a[k * 2 + 1]!);
    }
    return filtered;
  }
  return a;
}

export function NeuralGlassOrb({
  variant,
  engineRef,
  detail = 1,
  energy = 0,
}: OrbViewProps & { variant: OrbVariant }) {
  const engine = useOrbEngine(engineRef, 12);
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const build = useRef(0);
  const extras = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const count = Math.max(320, Math.round(variant.nodes * (0.5 + detail * 0.5)));
    const { pts, tint, scale } = buildNodes(variant, count);
    const nodePos = new Float32Array(count * 3);
    const nodeSeed = new Float32Array(count);
    const nodeTint = new Float32Array(count);
    const nodeScale = new Float32Array(count);
    const nodeOrder = new Float32Array(count);
    const rnd = mulberry(count + 11);
    pts.forEach((p, i) => {
      nodePos[i * 3] = p.x;
      nodePos[i * 3 + 1] = p.y;
      nodePos[i * 3 + 2] = p.z;
      nodeSeed[i] = rnd();
      nodeTint[i] = tint[i]!;
      nodeScale[i] = scale[i]!;
      // build order: core first, outer shell last, with a little scatter
      nodeOrder[i] = Math.min(1, p.length() * 0.62 + rnd() * 0.38);
    });

    const pairs = buildLinks(pts, Math.max(2, Math.round(variant.degree * (0.6 + detail * 0.4))));
    const lp = new Float32Array(pairs.length * 3);
    const ls = new Float32Array(pairs.length);
    const le = new Float32Array(pairs.length);
    const lt = new Float32Array(pairs.length);
    const lo = new Float32Array(pairs.length);
    for (let k = 0; k < pairs.length; k++) {
      const p = pts[pairs[k]!]!;
      lp[k * 3] = p.x;
      lp[k * 3 + 1] = p.y;
      lp[k * 3 + 2] = p.z;
      const seg = Math.floor(k / 2);
      ls[k] = ((seg * 9301 + 49297) % 233280) / 233280;
      le[k] = k % 2;
      lt[k] = ls[k]! > 0.86 ? 1 : nodeTint[pairs[k]!]! * 0.8;
      // a link only shows once both of its nodes exist
      lo[k] = Math.min(1, Math.max(nodeOrder[pairs[k]!]!, nodeOrder[pairs[k + (k % 2 ? -1 : 1)]!]!) + 0.05);
    }
    // electric arcs: jagged polylines hopping between distant nodes
    const boltCount = variant.bolts ?? 0;
    let bp: Float32Array | null = null;
    let bs: Float32Array | null = null;
    let ba: Float32Array | null = null;
    if (boltCount > 0 && pts.length > 8) {
      const SEG = 9;
      const verts = boltCount * SEG * 2;
      bp = new Float32Array(verts * 3);
      bs = new Float32Array(verts);
      ba = new Float32Array(verts);
      const br = mulberry(boltCount * 977 + count);
      let w = 0;
      for (let b = 0; b < boltCount; b++) {
        const a = pts[Math.floor(br() * pts.length)]!;
        // hop to a *nearby* node so the arc stays a short local crackle
        let z = a;
        let bestD = Infinity;
        for (let tryI = 0; tryI < 24; tryI++) {
          const cand = pts[Math.floor(br() * pts.length)]!;
          const d = cand.distanceToSquared(a);
          if (d > 0.004 && d < 0.05 && d < bestD) {
            bestD = d;
            z = cand;
          }
        }
        const seed = br();
        const off = new THREE.Vector3(br() - 0.5, br() - 0.5, br() - 0.5).normalize();
        const path: THREE.Vector3[] = [];
        for (let s = 0; s <= SEG; s++) {
          const k = s / SEG;
          const base = a.clone().lerp(z, k);
          const bow = Math.sin(k * Math.PI);
          base.addScaledVector(off, bow * 0.06 * (0.4 + seed));
          base.add(
            new THREE.Vector3(br() - 0.5, br() - 0.5, br() - 0.5).multiplyScalar(bow * 0.035),
          );
          path.push(base);
        }
        for (let s = 0; s < SEG; s++) {
          for (const [pt, k] of [
            [path[s]!, s / SEG] as const,
            [path[s + 1]!, (s + 1) / SEG] as const,
          ]) {
            bp[w * 3] = pt.x;
            bp[w * 3 + 1] = pt.y;
            bp[w * 3 + 2] = pt.z;
            bs[w] = seed;
            ba[w] = k;
            w++;
          }
        }
      }
    }

    return { count, nodePos, nodeSeed, nodeTint, nodeScale, nodeOrder, lp, ls, le, lt, lo, bp, bs, ba };
  }, [variant, detail]);

  const rays = useMemo(() => {
    if (!variant.rays) return null;
    const n = 90;
    const pos = new Float32Array(n * 6);
    const rnd = mulberry(n);
    for (let i = 0; i < n; i++) {
      const d = fib(i, n);
      const inner = 0.86 + rnd() * 0.1;
      const outer = inner + 0.05 + rnd() * 0.11;
      pos.set([d.x * inner, d.y * inner, d.z * inner, d.x * outer, d.y * outer, d.z * outer], i * 6);
    }
    return pos;
  }, [variant.rays]);

  const satellites = useMemo(() => {
    const n = variant.satellites ?? 0;
    if (!n) return null;
    const rnd = mulberry(n * 5 + 3);
    return Array.from({ length: n }, (_, i) => {
      const d = fib(i, n);
      const r = 1.18 + rnd() * 0.22;
      return {
        p: [d.x * r, d.y * r * 0.7, d.z * r] as [number, number, number],
        s: 0.006 + rnd() * 0.009,
      };
    });
  }, [variant.satellites]);

  const col = useMemo(
    () => ({
      deep: new THREE.Color(variant.palette[0]),
      main: new THREE.Color(variant.palette[1]),
      hot: new THREE.Color(variant.palette[2]),
      accent: new THREE.Color(variant.accent),
      glass: new THREE.Color(variant.glass),
    }),
    [variant],
  );

  const nodeU = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uNode: { value: 0 },
      uBreath: { value: variant.breath },
      uSize: { value: 2.15 },
      uBuild: { value: 0 },
      uDeep: { value: col.deep },
      uMain: { value: col.main },
      uHot: { value: col.hot },
    }),
    [col, variant.breath],
  );

  const linkU = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uDensity: { value: 0.3 },
      uBuild: { value: 0 },
      uBreath: { value: variant.breath },
      uMain: { value: col.main },
      uAccent: { value: col.accent },
    }),
    [col, variant.breath],
  );

  const glassU = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uRim: { value: variant.rim },
      uGlass: { value: col.glass },
      uAccent: { value: col.accent },
    }),
    [col, variant.rim],
  );

  const coreU = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uMain: { value: col.main },
      uHot: { value: col.hot },
    }),
    [col],
  );

  const boltU = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uBuild: { value: 0 },
      uHot: { value: col.hot },
      uAccent: { value: col.accent },
    }),
    [col],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    engine.update(dt);
    const p = engine.params;
    const t = clock.current;

    // hovering ignites the orb: it assembles, brightens and starts arcing
    const target = 0.8 + Math.min(1, Math.max(0, energy)) * 0.2;
    build.current += (target - build.current) * (1 - Math.exp(-3.2 * dt));
    const b = build.current;
    nodeU.uBuild.value = b;
    linkU.uBuild.value = b;
    boltU.uBuild.value = b;

    nodeU.uTime.value = t;
    nodeU.uActivity.value = p.activityLevel;
    nodeU.uNode.value = p.nodeActivation;
    linkU.uTime.value = t;
    linkU.uActivity.value = p.activityLevel;
    linkU.uDensity.value = p.connectionDensity;
    glassU.uTime.value = t;
    glassU.uActivity.value = p.activityLevel;
    coreU.uTime.value = t;
    coreU.uActivity.value = p.activityLevel;
    boltU.uTime.value = t;
    boltU.uActivity.value = p.activityLevel;

    if (extras.current) {
      const k = Math.max(0, Math.min(1, (b - 0.78) / 0.22));
      extras.current.scale.setScalar(0.86 + k * 0.14);
    }

    if (group.current) {
      group.current.rotation.y += dt * (variant.spin + p.rotationSpeed * 0.5);
      group.current.rotation.x = (variant.tilt ?? 0) + Math.sin(t * 0.14) * 0.06;
      group.current.rotation.z = (variant.tilt ?? 0) * 0.35;
    }
  });

  const coreSize = variant.coreSize ?? 0.3;

  return (
    <group ref={group}>
      {/* glass envelope — only on orbs whose identity is a shell */}
      {variant.shell ? (
        <mesh>
          <sphereGeometry args={[1.03, 64, 64]} />
          <shaderMaterial
            vertexShader={GLASS_VERT}
            fragmentShader={GLASS_FRAG}
            uniforms={glassU}
            transparent
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      ) : null}
      {/* inner luminous core */}
      <mesh>
        <sphereGeometry args={[coreSize, 32, 32]} />
        <shaderMaterial
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
          uniforms={coreU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* link web */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.lp, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[geo.ls, 1]} />
          <bufferAttribute attach="attributes-aEnd" args={[geo.le, 1]} />
          <bufferAttribute attach="attributes-aTint" args={[geo.lt, 1]} />
            <bufferAttribute attach="attributes-aOrder" args={[geo.lo, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={LINK_VERT}
          fragmentShader={LINK_FRAG}
          uniforms={linkU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* nodes */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.nodePos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[geo.nodeSeed, 1]} />
          <bufferAttribute attach="attributes-aTint" args={[geo.nodeTint, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[geo.nodeScale, 1]} />
            <bufferAttribute attach="attributes-aOrder" args={[geo.nodeOrder, 1]} />
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

      {/* electric arcs */}
      {geo.bp && geo.bs && geo.ba ? (
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[geo.bp, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[geo.bs, 1]} />
            <bufferAttribute attach="attributes-aAlong" args={[geo.ba, 1]} />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={BOLT_VERT}
            fragmentShader={BOLT_FRAG}
            uniforms={boltU}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      ) : null}

      {/* outward rays + satellites appear with the structure */}
      <group ref={extras}>
      {rays ? (
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rays, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={variant.accent}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      ) : null}

      {/* floating satellites */}
      {satellites?.map((s, i) => (
        <mesh key={i} position={s.p} scale={s.s}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? variant.accent : variant.palette[1]}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      </group>
    </group>
  );
}
