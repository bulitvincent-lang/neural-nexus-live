import type { AgentActivityEvent, ActivityEventType, NeuralParams } from "./types";
import type { EventBus } from "./eventBus";
import type { NeuralNetwork } from "./network";

interface Operation {
  type: ActivityEventType;
  intensity: number;
  complexity: number;
  /** remaining lifetime in seconds */
  life: number;
  total: number;
  clusters: number[];
  /** -1 inward (memory / convergence), +1 outward (search), 0 local */
  direction: -1 | 0 | 1;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** asymmetric approach: rises quickly, calms down slowly */
function approach(current: number, target: number, dt: number, riseTau: number, fallTau: number) {
  const tau = target > current ? riseTau : fallTau;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

export class NeuralEngine {
  readonly params: NeuralParams;
  private ops: Operation[] = [];
  private clusterTarget: number[];
  private clusterCount: number;
  private unsubscribe?: () => void;
  private rand = Math.random;

  constructor(network: NeuralNetwork) {
    this.clusterCount = network.clusterCount;
    this.clusterTarget = new Array(this.clusterCount).fill(0);
    this.params = {
      activityLevel: 0.06,
      nodeActivation: 0.08,
      connectionDensity: 0.1,
      pulseSpeed: 0.22,
      pulseCount: 0.08,
      clusterCount: 1,
      networkEntropy: 0.1,
      convergenceLevel: 0,
      rotationSpeed: 0.035,
      glowIntensity: 0.35,
      waveRadius: 2,
      waveStrength: 0,
      clusterActivation: new Array(this.clusterCount).fill(0.05),
      disturbance: 0,
    };
  }

  connect(bus: EventBus) {
    this.unsubscribe?.();
    this.unsubscribe = bus.subscribe((e) => this.handle(e));
  }

  dispose() {
    this.unsubscribe?.();
  }

  private pickClusters(count: number, mode: "deep" | "peripheral" | "any"): number[] {
    const order = [...Array(this.clusterCount).keys()];
    if (mode === "deep") order.sort((a, b) => (a % 3) - (b % 3));
    if (mode === "peripheral") order.reverse();
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      const pool = mode === "any" ? order : order.slice(0, Math.max(3, Math.ceil(this.clusterCount / 2)));
      out.push(pool[Math.floor(this.rand() * pool.length)]);
    }
    return out;
  }

  handle(event: AgentActivityEvent) {
    const intensity = event.intensity ?? 0.5;
    const complexity = event.complexity ?? 0.4;
    const parallel = Math.max(1, event.parallelTasks ?? 1);
    const seconds = (event.duration ?? 1600) / 1000;
    const p = this.params;

    const push = (o: Partial<Operation> & { clusters: number[] }) => {
      this.ops.push({
        type: event.type,
        intensity,
        complexity,
        life: seconds,
        total: seconds,
        direction: 0,
        ...o,
      } as Operation);
    };

    switch (event.type) {
      case "USER_INPUT":
        p.waveRadius = 0;
        p.waveStrength = 1;
        push({ clusters: this.pickClusters(2, "any"), life: 1.1, total: 1.1, direction: 1 });
        break;
      case "AI_STARTED":
        push({ clusters: this.pickClusters(2, "any") });
        break;
      case "ANALYSIS":
        push({ clusters: this.pickClusters(2 + Math.round(complexity * 3), "any") });
        break;
      case "MEMORY_ACCESS":
        push({ clusters: this.pickClusters(1, "deep"), direction: -1 });
        break;
      case "WEB_SEARCH":
      case "API_CALL":
        push({ clusters: this.pickClusters(2, "peripheral"), direction: 1 });
        break;
      case "TOOL_CALL":
      case "CODE_EXECUTION":
      case "FILE_PROCESSING":
      case "DATABASE_QUERY":
        push({ clusters: this.pickClusters(1, "any"), intensity: Math.min(1, intensity + 0.25) });
        break;
      case "PARALLEL_TASK":
        for (let i = 0; i < parallel; i++) push({ clusters: this.pickClusters(1, "any") });
        break;
      case "RESULT_GENERATION":
        push({ clusters: this.pickClusters(Math.max(2, parallel), "any"), direction: -1 });
        break;
      case "AI_COMPLETED":
        p.waveRadius = 0;
        p.waveStrength = 0.85;
        this.ops = this.ops.filter((o) => o.type === "RESULT_GENERATION").map((o) => ({ ...o, life: Math.min(o.life, 0.5) }));
        break;
      case "ERROR":
        p.disturbance = 1;
        push({ clusters: this.pickClusters(1, "any"), life: 0.9, total: 0.9 });
        break;
      case "IDLE":
        this.ops = [];
        break;
    }
  }

  update(dt: number) {
    const p = this.params;
    const d = Math.min(dt, 0.1);

    // retire finished operations
    this.ops = this.ops.filter((o) => (o.life -= d) > 0);

    let load = 0;
    let complexity = 0;
    let inward = 0;
    let outward = 0;
    this.clusterTarget.fill(0);

    for (const o of this.ops) {
      // gentle in/out envelope so nothing ever snaps
      const t = 1 - o.life / o.total;
      const env = Math.min(1, Math.min(t / 0.18, o.life / (o.total * 0.35) + 0.35));
      const w = o.intensity * env;
      load += w;
      complexity = Math.max(complexity, o.complexity);
      if (o.direction < 0) inward += w;
      if (o.direction > 0) outward += w;
      for (const c of o.clusters) {
        this.clusterTarget[c] = Math.min(1, this.clusterTarget[c] + w * 0.9);
      }
    }

    const activeCount = this.ops.length;
    const activityTarget = clamp01(0.05 + load * 0.5 + complexity * 0.2);

    p.activityLevel = approach(p.activityLevel, activityTarget, d, 0.35, 2.6);
    p.nodeActivation = approach(p.nodeActivation, clamp01(0.06 + p.activityLevel * 0.95), d, 0.3, 2.2);
    p.connectionDensity = approach(
      p.connectionDensity,
      clamp01(0.08 + activityTarget * 0.85 + complexity * 0.1),
      d,
      0.5,
      3.4,
    );
    p.pulseSpeed = approach(p.pulseSpeed, 0.2 + activityTarget * 0.85, d, 0.4, 2.0);
    p.pulseCount = approach(p.pulseCount, clamp01(0.05 + activityTarget * 0.95), d, 0.45, 2.8);
    p.networkEntropy = approach(
      p.networkEntropy,
      clamp01(0.08 + Math.min(1, activeCount / 5) * 0.7 - inward * 0.3),
      d,
      0.6,
      2.4,
    );
    p.convergenceLevel = approach(p.convergenceLevel, clamp01(inward * 0.9 - outward * 0.4), d, 0.6, 1.8);
    p.rotationSpeed = approach(p.rotationSpeed, 0.03 + p.activityLevel * 0.12, d, 0.8, 3.0);
    p.glowIntensity = approach(p.glowIntensity, 0.32 + p.activityLevel * 0.85, d, 0.4, 2.6);
    p.clusterCount = Math.max(1, activeCount);
    p.disturbance = approach(p.disturbance, 0, d, 0.1, 0.7);

    for (let i = 0; i < this.clusterCount; i++) {
      const base = 0.04 + 0.03 * Math.sin(performance.now() * 0.0004 + i * 1.7);
      p.clusterActivation[i] = approach(
        p.clusterActivation[i],
        Math.max(base, this.clusterTarget[i]),
        d,
        0.28,
        2.4,
      );
    }

    // travelling wave
    if (p.waveStrength > 0.001) {
      p.waveRadius += d * 1.35;
      if (p.waveRadius > 1.8) p.waveStrength = approach(p.waveStrength, 0, d, 0.5, 0.5);
      if (p.waveStrength < 0.01) p.waveStrength = 0;
    }
  }

  /** direction bias for pulse routing: -1 inward, +1 outward */
  get flowBias() {
    return this.params.convergenceLevel > 0.15 ? -1 : this.params.networkEntropy > 0.55 ? 1 : 0;
  }
}
