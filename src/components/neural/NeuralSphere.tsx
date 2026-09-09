import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { buildNetwork } from "@/lib/neural/network";
import { NeuralEngine } from "@/lib/neural/neuralEngine";
import type { QualityProfile } from "@/lib/neural/types";
import { PALETTE, PALETTE_FLAT } from "./palette";
import {
  ATMO_FRAG,
  ATMO_VERT,
  DUST_FRAG,
  DUST_VERT,
  EDGE_FRAG,
  EDGE_VERT,
  NODE_FRAG,
  NODE_VERT,
  PULSE_FRAG,
  PULSE_VERT,
} from "./shaders";


/** Cluster -> palette index: cold hues dominate, amber only once. */
const TONE_BY_CLUSTER = [0, 1, 2, 4, 1, 0, 2, 4, 1, 2, 0, 4, 1, 5];

/** CPU mirror of the GLSL displace() so pulses ride exactly on the edges. */
function displace(
  out: THREE.Vector3,
  x: number,
  y: number,
  z: number,
  seed: number,
  time: number,
  activity: number,
) {
  const s = seed * 6.2831853;
  const pulse = 1 + (0.014 + 0.012 * activity) * Math.sin(time * 0.35 + s);
  const k = pulse * (1 + 0.02 * activity);
  const amp = 0.01 + 0.016 * activity;
  out.set(
    x * k + Math.sin(time * 0.31 + s * 3.1) * amp,
    y * k + Math.cos(time * 0.27 + s * 2.3) * amp,
    z * k + Math.sin(time * 0.23 + s * 1.7) * amp,
  );
  return out;
}

export function NeuralSphere({
  quality,
  engineRef,
}: {
  quality: QualityProfile;
  engineRef: React.MutableRefObject<NeuralEngine | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  const data = useMemo(() => {
    const net = buildNetwork(quality.nodes, quality.neighbors);
    const N = net.nodes.length;
    const E = net.edges.length;

    const nodePos = new Float32Array(N * 3);
    const nodeSeed = new Float32Array(N);
    const nodeCluster = new Float32Array(N);
    const nodeAct = new Float32Array(N);
    const nodeRadius = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const n = net.nodes[i];
      nodePos[i * 3] = n.x;
      nodePos[i * 3 + 1] = n.y;
      nodePos[i * 3 + 2] = n.z;
      nodeSeed[i] = (i * 0.6180339887) % 1;
      nodeCluster[i] = TONE_BY_CLUSTER[n.cluster % TONE_BY_CLUSTER.length];
      nodeRadius[i] = n.radius;
      nodeAct[i] = 0.03;
    }

    const edgePos = new Float32Array(E * 6);
    const edgeSeed = new Float32Array(E * 2);
    const edgeCluster = new Float32Array(E * 2);
    const edgeAlpha = new Float32Array(E * 2);
    const edgeCurrent = new Float32Array(E);
    const edgeGate = new Float32Array(E);
    const edgePhase = new Float32Array(E);
    for (let e = 0; e < E; e++) {
      const { a, b, dynamic } = net.edges[e];
      edgePos[e * 6] = nodePos[a * 3];
      edgePos[e * 6 + 1] = nodePos[a * 3 + 1];
      edgePos[e * 6 + 2] = nodePos[a * 3 + 2];
      edgePos[e * 6 + 3] = nodePos[b * 3];
      edgePos[e * 6 + 4] = nodePos[b * 3 + 1];
      edgePos[e * 6 + 5] = nodePos[b * 3 + 2];
      edgeSeed[e * 2] = nodeSeed[a];
      edgeSeed[e * 2 + 1] = nodeSeed[b];
      edgeCluster[e * 2] = nodeCluster[a];
      edgeCluster[e * 2 + 1] = nodeCluster[b];
      edgeGate[e] = dynamic === 0 ? 0 : 0.12 + Math.random() * 0.95;
      edgePhase[e] = Math.random() * Math.PI * 2;
    }

    // fine dust particles at several depths
    const D = Math.round(quality.nodes * 2.4);
    const dustPos = new Float32Array(D * 3);
    const dustSeed = new Float32Array(D);
    for (let i = 0; i < D; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const rad = 0.25 + Math.pow(Math.random(), 0.6) * 0.95;
      dustPos[i * 3] = Math.cos(th) * r * rad;
      dustPos[i * 3 + 1] = u * rad;
      dustPos[i * 3 + 2] = Math.sin(th) * r * rad;
      dustSeed[i] = Math.random();
    }

    const P = quality.maxPulses;
    const pulses = {
      edge: new Int32Array(P),
      t: new Float32Array(P),
      dir: new Int8Array(P),
      speed: new Float32Array(P),
      energy: new Float32Array(P),
      tone: new Float32Array(P),
      pos: new Float32Array(P * 3),
      energyAttr: new Float32Array(P),
      toneAttr: new Float32Array(P),
      count: P,
    };

    return {
      net,
      N,
      E,
      D,
      nodePos,
      nodeSeed,
      nodeCluster,
      nodeAct,
      nodeRadius,
      edgePos,
      edgeSeed,
      edgeCluster,
      edgeAlpha,
      edgeCurrent,
      edgeGate,
      edgePhase,
      dustPos,
      dustSeed,
      pulses,
    };
  }, [quality]);

  const engine = useMemo(() => new NeuralEngine(data.net), [data]);
  useEffect(() => {
    engineRef.current = engine;
    return () => {
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [engine, engineRef]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uSize: { value: 1 },
      uPalette: { value: PALETTE_FLAT.reduce<THREE.Vector3[]>((acc, _, i, arr) => {
        if (i % 3 === 0) acc.push(new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2]));
        return acc;
      }, []) },
    }),
    [],
  );

  const nodeUniforms = useMemo(
    () => ({ ...uniforms, uSize: { value: 2.6 } }),
    [uniforms],
  );
  const edgeUniforms = useMemo(() => ({ ...uniforms }), [uniforms]);
  const pulseUniforms = useMemo(
    () => ({ uSize: { value: 3.4 }, uPalette: uniforms.uPalette }),
    [uniforms],
  );
  const dustUniforms = useMemo(() => ({ ...uniforms, uSize: { value: 1.1 } }), [uniforms]);

  const nodeGeo = useRef<THREE.BufferGeometry>(null);
  const edgeGeo = useRef<THREE.BufferGeometry>(null);
  const pulseGeo = useRef<THREE.BufferGeometry>(null);

  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  const clock = useRef(0);

  const spawn = (edgeIdx: number, dir: 1 | -1, energy: number, tone: number, speed: number) => {
    const p = data.pulses;
    for (let i = 0; i < p.count; i++) {
      if (p.energy[i] <= 0.001) {
        p.edge[i] = edgeIdx;
        p.t[i] = dir === 1 ? 0 : 1;
        p.dir[i] = dir;
        p.energy[i] = energy;
        p.tone[i] = tone;
        p.speed[i] = speed;
        return true;
      }
    }
    return false;
  };

  const pickActiveNode = (params: ReturnType<() => NeuralEngine["params"]>) => {
    const { N, net } = data;
    for (let attempt = 0; attempt < 8; attempt++) {
      const i = (Math.random() * N) | 0;
      const act = params.clusterActivation[net.nodes[i].cluster];
      if (Math.random() < 0.15 + act) return i;
    }
    return (Math.random() * N) | 0;
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const time = clock.current;
    engine.update(dt);
    const p = engine.params;
    const { net, N, E, nodeAct, nodeRadius, edgeCurrent, edgeGate, edgePhase, edgeAlpha, pulses } = data;

    // ---- node activation relaxation, spontaneous sparks, wave front ----
    const decay = Math.exp(-dt * (1.1 + 1.4 * p.activityLevel));
    for (let i = 0; i < N; i++) {
      nodeAct[i] *= decay;
      const base = 0.05 + 0.6 * p.nodeActivation * p.clusterActivation[net.nodes[i].cluster];
      if (nodeAct[i] < base) nodeAct[i] += (base - nodeAct[i]) * Math.min(1, dt * 2.2);
      if (p.waveStrength > 0.01 && Math.abs(nodeRadius[i] - p.waveRadius) < 0.14) {
        nodeAct[i] = Math.min(1, nodeAct[i] + p.waveStrength * 0.9);
      }
    }
    const sparks = Math.max(1, Math.round((1 + p.activityLevel * 22) * dt * 8));
    for (let s = 0; s < sparks; s++) {
      const i = pickActiveNode(p);
      nodeAct[i] = Math.min(1, nodeAct[i] + 0.35 + Math.random() * 0.5 * p.activityLevel);
    }

    // ---- pulse spawning ----
    const rate = 3 + p.pulseCount * (pulses.count * 0.55);
    let toSpawn = rate * dt;
    while (toSpawn > 0) {
      if (toSpawn < 1 && Math.random() > toSpawn) break;
      toSpawn -= 1;
      const i = pickActiveNode(p);
      const node = net.nodes[i];
      if (!node.out.length) continue;
      const e = node.out[(Math.random() * node.out.length) | 0];
      const edge = net.edges[e];
      const dir: 1 | -1 = edge.a === i ? 1 : -1;
      spawn(
        e,
        dir,
        0.35 + Math.random() * 0.55 * (0.4 + p.activityLevel),
        node.cluster,
        (0.55 + p.pulseSpeed * 1.5) * (0.7 + Math.random() * 0.6),
      );
    }
    if (p.waveStrength > 0.35 && Math.random() < 0.6) {
      for (let k = 0; k < 3; k++) {
        const i = (Math.random() * N) | 0;
        const node = net.nodes[i];
        if (!node.out.length) continue;
        const e = node.out[(Math.random() * node.out.length) | 0];
        spawn(e, net.edges[e].a === i ? 1 : -1, 0.9, 3, 1.4);
      }
    }

    // ---- pulse advance / propagation / bifurcation ----
    const bias = engine.flowBias;
    for (let i = 0; i < pulses.count; i++) {
      if (pulses.energy[i] <= 0.001) {
        pulses.energyAttr[i] = 0;
        continue;
      }
      const e = pulses.edge[i];
      const edge = net.edges[e];
      const len = Math.max(0.02, edge.length);
      pulses.t[i] += ((pulses.speed[i] * dt) / len) * pulses.dir[i];
      edgeCurrent[e] = Math.min(1, edgeCurrent[e] + 0.5 * pulses.energy[i]);

      const done = pulses.dir[i] === 1 ? pulses.t[i] >= 1 : pulses.t[i] <= 0;
      if (done) {
        const arrived = pulses.dir[i] === 1 ? edge.b : edge.a;
        nodeAct[arrived] = Math.min(1, nodeAct[arrived] + pulses.energy[i] * 0.8);
        const energy = pulses.energy[i] * (0.72 + 0.2 * p.activityLevel);
        pulses.energy[i] = 0;
        pulses.energyAttr[i] = 0;

        const carryOn = Math.random() < 0.45 + 0.45 * p.activityLevel;
        if (energy > 0.12 && carryOn) {
          const node = net.nodes[arrived];
          // route with a bias: inward on convergence, outward while exploring
          let bestEdge = -1;
          let bestScore = -Infinity;
          for (let k = 0; k < node.out.length; k++) {
            const cand = node.out[(Math.random() * node.out.length) | 0];
            if (cand === e) continue;
            const ce = net.edges[cand];
            const other = ce.a === arrived ? ce.b : ce.a;
            const dr = nodeRadius[other] - nodeRadius[arrived];
            const score =
              bias * -dr * 3 +
              p.clusterActivation[net.nodes[other].cluster] * 2 +
              Math.random() * (0.6 + p.networkEntropy);
            if (score > bestScore) {
              bestScore = score;
              bestEdge = cand;
            }
          }
          if (bestEdge >= 0) {
            const ne = net.edges[bestEdge];
            spawn(
              bestEdge,
              ne.a === arrived ? 1 : -1,
              energy,
              net.nodes[arrived].cluster,
              (0.55 + p.pulseSpeed * 1.5) * (0.8 + Math.random() * 0.5),
            );
            // bifurcation
            if (Math.random() < 0.1 + 0.25 * p.networkEntropy && node.out.length > 2) {
              const alt = node.out[(Math.random() * node.out.length) | 0];
              if (alt !== bestEdge && alt !== e) {
                const ae = net.edges[alt];
                spawn(
                  alt,
                  ae.a === arrived ? 1 : -1,
                  energy * 0.7,
                  net.nodes[arrived].cluster,
                  0.5 + p.pulseSpeed * 1.4,
                );
              }
            }
          }
        }
        continue;
      }

      // position along the (displaced) edge
      const a = edge.a;
      const b = edge.b;
      displace(tmp.a, data.nodePos[a * 3], data.nodePos[a * 3 + 1], data.nodePos[a * 3 + 2], data.nodeSeed[a], time, p.activityLevel);
      displace(tmp.b, data.nodePos[b * 3], data.nodePos[b * 3 + 1], data.nodePos[b * 3 + 2], data.nodeSeed[b], time, p.activityLevel);
      const t = pulses.t[i];
      pulses.pos[i * 3] = tmp.a.x + (tmp.b.x - tmp.a.x) * t;
      pulses.pos[i * 3 + 1] = tmp.a.y + (tmp.b.y - tmp.a.y) * t;
      pulses.pos[i * 3 + 2] = tmp.a.z + (tmp.b.z - tmp.a.z) * t;
      pulses.energyAttr[i] = Math.min(1, pulses.energy[i] * (0.6 + 0.7 * p.glowIntensity));
      pulses.toneAttr[i] = pulses.tone[i];
    }

    // ---- edge visibility: progressive appearance / disappearance ----
    for (let e = 0; e < E; e++) {
      const edge = net.edges[e];
      const gate = edgeGate[e];
      const open = gate === 0 ? 1 : p.connectionDensity * 1.25 > gate ? 1 : 0;
      const clusterAct = p.clusterActivation[edge.cluster];
      const endpoints = (nodeAct[edge.a] + nodeAct[edge.b]) * 0.5;
      const breathe = 0.75 + 0.25 * Math.sin(time * (0.8 + 1.6 * p.pulseSpeed) + edgePhase[e]);
      let target =
        open *
        breathe *
        (edge.dynamic === 0 ? 0.05 : (edge.dynamic > 0.9 ? 0.02 : 0.03) * p.connectionDensity) *
        1.0;
      target += open * (0.045 * clusterAct + 0.42 * endpoints * (0.3 + 0.7 * p.glowIntensity)) * breathe;
      if (p.disturbance > 0.02 && Math.random() < 0.02 * p.disturbance) target *= 0.15;
      target = Math.min(0.85, target + edgeCurrent[e] * 0.35);
      edgeCurrent[e] *= Math.exp(-dt * 3.2);
      const k = 1 - Math.exp(-dt / (target > edgeCurrent[e] ? 0.22 : 0.9));
      const cur = edgeAlpha[e * 2] + (target - edgeAlpha[e * 2]) * k;
      edgeAlpha[e * 2] = cur;
      edgeAlpha[e * 2 + 1] = cur;
    }

    // ---- upload ----
    if (nodeGeo.current) {
      const attr = nodeGeo.current.getAttribute("aAct") as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
    if (edgeGeo.current) {
      (edgeGeo.current.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    }
    if (pulseGeo.current) {
      (pulseGeo.current.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      (pulseGeo.current.getAttribute("aEnergy") as THREE.BufferAttribute).needsUpdate = true;
      (pulseGeo.current.getAttribute("aTone") as THREE.BufferAttribute).needsUpdate = true;
    }

    uniforms.uTime.value = time;
    uniforms.uActivity.value = p.activityLevel;
    nodeUniforms.uSize.value = 3.2 + p.glowIntensity * 2.0;
    pulseUniforms.uSize.value = 3.0 + p.glowIntensity * 2.2;

    // ---- natural rotation + the faintest cursor parallax ----
    if (group.current) {
      group.current.rotation.y += dt * p.rotationSpeed;
      group.current.rotation.x = Math.sin(time * 0.07) * 0.12 + pointer.y * 0.05;
      group.current.rotation.z = Math.sin(time * 0.045) * 0.05 - pointer.x * 0.02;
    }
    void state;
  });

  return (
    <group ref={group}>
      {/* inner light: gives the network a lit core */}
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color="#0d2647" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={edgeGeo}>
          <bufferAttribute attach="attributes-position" args={[data.edgePos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.edgeSeed, 1]} />
          <bufferAttribute attach="attributes-aCluster" args={[data.edgeCluster, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[data.edgeAlpha, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={EDGE_VERT}
          fragmentShader={EDGE_FRAG}
          uniforms={edgeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points frustumCulled={false}>
        <bufferGeometry ref={nodeGeo}>
          <bufferAttribute attach="attributes-position" args={[data.nodePos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.nodeSeed, 1]} />
          <bufferAttribute attach="attributes-aCluster" args={[data.nodeCluster, 1]} />
          <bufferAttribute attach="attributes-aAct" args={[data.nodeAct, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points frustumCulled={false}>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[data.pulses.pos, 3]} />
          <bufferAttribute attach="attributes-aEnergy" args={[data.pulses.energyAttr, 1]} />
          <bufferAttribute attach="attributes-aTone" args={[data.pulses.toneAttr, 1]} />
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

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.dustPos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.dustSeed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={DUST_VERT}
          fragmentShader={DUST_FRAG}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
