import type { ActivityEventType, AgentActivityEvent } from "../types";

/**
 * Host-agnostic provider layer.
 *
 * AI / Agent -> Host / Provider -> Provider Adapter -> Local Activity Bridge
 * -> Event Bus -> NeuralEngine -> Neural Sphere
 *
 * A provider knows about one source of activity (a mock simulator, an MCP
 * host, a local HTTP bridge, a future SDK hook). It never knows about the
 * NeuralEngine, and the engine never knows which provider produced an event.
 */

/** Loose, forgiving input any integration may emit. */
export interface RawActivitySignal {
  /** normalised type, or any alias the bridge can resolve (e.g. "STREAMING") */
  type: ActivityEventType | string;
  intensity?: number;
  duration?: number;
  durationMs?: number;
  parallelTasks?: number;
  concurrency?: number;
  complexity?: number;
  /** optional payload size in bytes — used to infer complexity */
  size?: number;
  timestamp?: number;
}

export type ActivityEmit = (signal: RawActivitySignal) => void;

export type ProviderState = "idle" | "connecting" | "live" | "unavailable";

export interface ActivityProvider {
  /** stable id, e.g. "mock", "mcp", "local-bridge" */
  readonly id: string;
  /** higher wins when several providers are live and only one should drive */
  readonly priority: number;
  /** false when the environment can't support it (no SSE, no Tauri, ...) */
  isAvailable(): boolean;
  start(emit: ActivityEmit): void | Promise<void>;
  stop(): void;
  getState(): ProviderState;
}

/** What the bridge hands to the event bus — already normalised. */
export type NormalizedEvent = AgentActivityEvent;
