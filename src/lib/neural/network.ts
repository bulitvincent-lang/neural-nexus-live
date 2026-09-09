/**
 * Persistent neural architecture.
 *
 * Built once from a fixed seed so the network keeps its own recognisable
 * anatomy: the user recognises "their" AI. Temporary dynamic edges are layered
 * on top at runtime by the renderer.
 */

export interface NeuralNode {
  x: number;
  y: number;
  z: number;
  radius: number;
  cluster: number;
  /** indices into edges array */
  out: number[];
}

export interface NeuralEdge {
  a: number;
  b: number;
  length: number;
  cluster: number;
  /** 0 = core scaffolding (always faintly present), 1 = long dynamic link */
  dynamic: number;
}

export interface NeuralNetwork {
  nodes: NeuralNode[];
  edges: NeuralEdge[];
  clusters: { x: number; y: number; z: number; radius: number }[];
  clusterCount: number;
}

function mulberry(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildNetwork(nodeCount: number, neighbors: number, clusterCount = 14): NeuralNetwork {
  const rand = mulberry(20260909);
  const gauss = () => {
    const u = Math.max(1e-6, rand());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };

  // Cluster seeds on a fibonacci-ish shell, at varied depths.
  const clusters: NeuralNetwork["clusters"] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < clusterCount; i++) {
    const y = 1 - (i / (clusterCount - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    // deep clusters (memory regions) sit closer to the core
    const depth = 0.42 + 0.58 * ((i * 0.37) % 1);
    clusters.push({ x: Math.cos(th) * r * depth, y: y * depth, z: Math.sin(th) * r * depth, radius: depth });
  }

  const nodes: NeuralNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const c = Math.floor(rand() * clusterCount);
    const seed = clusters[c];
    const dl = Math.hypot(seed.x, seed.y, seed.z) || 1;
    // dense blob around the cluster direction, biased towards the shell
    const spread = 0.2 + rand() * 0.12;
    let dx = seed.x / dl + gauss() * spread;
    let dy = seed.y / dl + gauss() * spread;
    let dz = seed.z / dl + gauss() * spread;
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l;
    dy /= l;
    dz /= l;
    const shell = rand() < 0.78;
    const radius = shell ? 0.82 + rand() * 0.18 : 0.3 + Math.pow(rand(), 0.7) * 0.5;
    nodes.push({ x: dx * radius, y: dy * radius, z: dz * radius, radius, cluster: c, out: [] });
  }

  // k-nearest-neighbour scaffolding
  const key = new Set<number>();
  const edges: NeuralEdge[] = [];
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const k = a < b ? a * nodeCount + b : b * nodeCount + a;
    if (key.has(k)) return;
    key.add(k);
    const na = nodes[a];
    const nb = nodes[b];
    const length = Math.hypot(na.x - nb.x, na.y - nb.y, na.z - nb.z);
    const dynamic = na.cluster === nb.cluster ? (length > 0.5 ? 0.6 : 0) : 1;
    const idx = edges.length;
    edges.push({ a, b, length, cluster: na.cluster, dynamic });
    na.out.push(idx);
    nb.out.push(idx);
  };

  const dist2 = (i: number, j: number) => {
    const a = nodes[i];
    const b = nodes[j];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  };

  for (let i = 0; i < nodeCount; i++) {
    const best: { j: number; d: number }[] = [];
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue;
      const d = dist2(i, j);
      if (best.length < neighbors) {
        best.push({ j, d });
        best.sort((p, q) => p.d - q.d);
      } else if (d < best[best.length - 1].d) {
        best[best.length - 1] = { j, d };
        best.sort((p, q) => p.d - q.d);
      }
    }
    for (const b of best) {
      if (Math.sqrt(b.d) > 0.38) continue;
      addEdge(i, b.j);
    }
  }

  // long-range association tracts between clusters (temporary pathways use these)
  const tracts = Math.round(nodeCount * 0.09);
  for (let t = 0; t < tracts; t++) {
    const a = Math.floor(rand() * nodeCount);
    const b = Math.floor(rand() * nodeCount);
    if (nodes[a].cluster !== nodes[b].cluster) addEdge(a, b);
  }

  return { nodes, edges, clusters, clusterCount };
}
