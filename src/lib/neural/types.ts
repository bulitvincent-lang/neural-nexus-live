/**
 * Provider-agnostic activity vocabulary.
 * NOTHING here is ever rendered as text — these types only drive the visuals.
 */

export type ActivityEventType =
  | "USER_INPUT"
  | "AI_STARTED"
  | "ANALYSIS"
  | "MEMORY_ACCESS"
  | "WEB_SEARCH"
  | "TOOL_CALL"
  | "API_CALL"
  | "DATABASE_QUERY"
  | "FILE_PROCESSING"
  | "CODE_EXECUTION"
  | "PARALLEL_TASK"
  | "RESULT_GENERATION"
  | "AI_COMPLETED"
  | "ERROR"
  | "IDLE";

export interface AgentActivityEvent {
  timestamp: number;
  type: ActivityEventType;
  /** 0..1 — how strong this operation is */
  intensity?: number;
  /** ms — how long the operation is expected to last */
  duration?: number;
  /** how many things happen at once */
  parallelTasks?: number;
  /** 0..1 — task complexity */
  complexity?: number;
}

/** Graphics parameters produced by the NeuralEngine. */
export interface NeuralParams {
  activityLevel: number;
  nodeActivation: number;
  connectionDensity: number;
  pulseSpeed: number;
  pulseCount: number;
  clusterCount: number;
  networkEntropy: number;
  convergenceLevel: number;
  rotationSpeed: number;
  glowIntensity: number;
  /** transient wave travelling outward (USER_INPUT) or through the whole net (COMPLETED) */
  waveRadius: number;
  waveStrength: number;
  /** 0..1 per persistent cluster */
  clusterActivation: number[];
  /** subtle, never alarming */
  disturbance: number;
}

export type QualityLevel = "ULTRA" | "HIGH" | BALANCED_T | "LOW_POWER";
type BALANCED_T = "BALANCED";

export interface QualityProfile {
  level: QualityLevel;
  nodes: number;
  neighbors: number;
  maxPulses: number;
  bloom: number;
  dpr: [number, number];
}

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  ULTRA: { level: "ULTRA", nodes: 780, neighbors: 4, maxPulses: 520, bloom: 1.15, dpr: [1, 2] },
  HIGH: { level: "HIGH", nodes: 560, neighbors: 3, maxPulses: 380, bloom: 1.0, dpr: [1, 1.75] },
  BALANCED: { level: "BALANCED", nodes: 380, neighbors: 3, maxPulses: 240, bloom: 0.85, dpr: [1, 1.5] },
  LOW_POWER: { level: "LOW_POWER", nodes: 220, neighbors: 2, maxPulses: 120, bloom: 0.6, dpr: [1, 1] },
};
