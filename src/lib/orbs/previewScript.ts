import type { NeuralEngine } from "@/lib/neural/neuralEngine";
import type { AgentActivityEvent } from "@/lib/neural/types";

/** ~26 s scripted demonstration: idle -> analysis -> work -> parallel -> result. */
const SCRIPT: { at: number; event: Omit<AgentActivityEvent, "timestamp"> }[] = [
  { at: 0, event: { type: "IDLE" } },
  { at: 2200, event: { type: "USER_INPUT", intensity: 0.8 } },
  { at: 2600, event: { type: "AI_STARTED", intensity: 0.5, duration: 2200 } },
  { at: 3400, event: { type: "ANALYSIS", intensity: 0.7, complexity: 0.7, duration: 4200 } },
  { at: 6200, event: { type: "MEMORY_ACCESS", intensity: 0.6, duration: 2200 } },
  { at: 8000, event: { type: "TOOL_CALL", intensity: 0.75, duration: 2600 } },
  { at: 10200, event: { type: "WEB_SEARCH", intensity: 0.7, duration: 3000 } },
  {
    at: 12500,
    event: { type: "PARALLEL_TASK", intensity: 0.8, parallelTasks: 5, complexity: 0.8, duration: 4200 },
  },
  { at: 15000, event: { type: "CODE_EXECUTION", intensity: 0.85, duration: 2800 } },
  { at: 18000, event: { type: "RESULT_GENERATION", intensity: 0.9, parallelTasks: 3, duration: 3600 } },
  { at: 21500, event: { type: "AI_COMPLETED", intensity: 1 } },
  { at: 23500, event: { type: "IDLE" } },
];

export const PREVIEW_DURATION_MS = 26000;

/** Feeds an engine directly — nothing is written to the real activity bus. */
export function runPreviewScript(getEngine: () => NeuralEngine | null): () => void {
  const timers = SCRIPT.map(({ at, event }) =>
    window.setTimeout(() => {
      getEngine()?.handle({ ...event, timestamp: Date.now() });
    }, at),
  );
  return () => timers.forEach((t) => window.clearTimeout(t));
}
