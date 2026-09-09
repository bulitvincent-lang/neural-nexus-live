import type { ActivityEventType } from "../types";
import type { NormalizedEvent, RawActivitySignal } from "./types";

const CANONICAL = new Set<ActivityEventType>([
  "USER_INPUT",
  "AI_STARTED",
  "ANALYSIS",
  "MEMORY_ACCESS",
  "WEB_SEARCH",
  "TOOL_CALL",
  "API_CALL",
  "DATABASE_QUERY",
  "FILE_PROCESSING",
  "CODE_EXECUTION",
  "PARALLEL_TASK",
  "RESULT_GENERATION",
  "AI_COMPLETED",
  "ERROR",
  "IDLE",
]);

/**
 * Aliases so any integration can speak its own dialect without the engine
 * ever changing. Add rows here, never in the engine.
 */
const ALIASES: Record<string, ActivityEventType> = {
  PROMPT: "USER_INPUT",
  INPUT: "USER_INPUT",
  MESSAGE_SENT: "USER_INPUT",
  START: "AI_STARTED",
  STARTED: "AI_STARTED",
  RUN_STARTED: "AI_STARTED",
  THINKING: "ANALYSIS",
  REASONING: "ANALYSIS",
  PLANNING: "ANALYSIS",
  STREAMING: "RESULT_GENERATION",
  TOKEN: "RESULT_GENERATION",
  DELTA: "RESULT_GENERATION",
  GENERATING: "RESULT_GENERATION",
  TOOL_RESULT: "RESULT_GENERATION",
  RETRIEVAL: "MEMORY_ACCESS",
  EMBEDDING: "MEMORY_ACCESS",
  VECTOR_SEARCH: "MEMORY_ACCESS",
  SEARCH: "WEB_SEARCH",
  BROWSE: "WEB_SEARCH",
  FETCH: "API_CALL",
  HTTP_REQUEST: "API_CALL",
  SQL: "DATABASE_QUERY",
  FILE_READ: "FILE_PROCESSING",
  FILE_WRITE: "FILE_PROCESSING",
  SHELL: "CODE_EXECUTION",
  SANDBOX: "CODE_EXECUTION",
  SUBAGENT: "PARALLEL_TASK",
  FANOUT: "PARALLEL_TASK",
  COMPLETED: "AI_COMPLETED",
  DONE: "AI_COMPLETED",
  RUN_FINISHED: "AI_COMPLETED",
  FAILED: "ERROR",
  ABORTED: "ERROR",
  CANCELLED: "ERROR",
  IDLE_STATE: "IDLE",
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function resolveType(type: string): ActivityEventType {
  const key = type.trim().toUpperCase().replace(/[\s\-./]+/g, "_");
  if (CANONICAL.has(key as ActivityEventType)) return key as ActivityEventType;
  return ALIASES[key] ?? "TOOL_CALL";
}

/** Loose signal -> strict event the NeuralEngine understands. */
export function normalizeSignal(signal: RawActivitySignal): NormalizedEvent {
  const size = typeof signal.size === "number" ? Math.max(0, signal.size) : 0;
  const inferred = size > 0 ? clamp(0.25 + Math.log10(1 + size / 256) / 3, 0, 1) : undefined;

  const complexity =
    typeof signal.complexity === "number" ? clamp(signal.complexity, 0, 1) : inferred ?? 0.45;

  const parallelTasks = clamp(
    Math.round(signal.parallelTasks ?? signal.concurrency ?? 1),
    1,
    12,
  );

  const intensity =
    typeof signal.intensity === "number"
      ? clamp(signal.intensity, 0, 1)
      : clamp(0.35 + complexity * 0.45 + (parallelTasks - 1) * 0.05, 0, 1);

  const duration = clamp(signal.duration ?? signal.durationMs ?? 1200, 0, 120_000);

  return {
    timestamp: signal.timestamp ?? Date.now(),
    type: resolveType(String(signal.type)),
    intensity,
    complexity,
    parallelTasks,
    duration,
  };
}
