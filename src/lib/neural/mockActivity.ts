import type { ActivityAdapter, EventBus } from "./eventBus";
import type { ActivityEventType } from "./types";

/**
 * Development-only simulator. Produces realistic agent sessions of varying
 * complexity so every visual behaviour can be observed. It renders nothing.
 */
export class MockActivityAdapter implements ActivityAdapter {
  name = "mock";
  private timers: ReturnType<typeof setTimeout>[] = [];
  private stopped = false;

  start(bus: EventBus) {
    this.stopped = false;
    const at = (ms: number, fn: () => void) => {
      this.timers.push(setTimeout(fn, ms));
    };

    const session = () => {
      if (this.stopped) return;
      const complexity = Math.random();
      const steps = 2 + Math.round(complexity * 9);
      const parallelPeak = 1 + Math.round(complexity * 4);
      let t = 0;

      bus.push("USER_INPUT", { intensity: 0.6 + complexity * 0.4, complexity });
      at((t += 260), () => bus.push("AI_STARTED", { intensity: 0.4 + complexity * 0.3, complexity }));

      const pool: ActivityEventType[] = [
        "ANALYSIS",
        "MEMORY_ACCESS",
        "WEB_SEARCH",
        "TOOL_CALL",
        "API_CALL",
        "DATABASE_QUERY",
        "FILE_PROCESSING",
        "CODE_EXECUTION",
      ];

      for (let i = 0; i < steps; i++) {
        const type = pool[Math.floor(Math.random() * pool.length)];
        const dur = 900 + Math.random() * 2600 * (0.4 + complexity);
        const step = 280 + Math.random() * 900;
        at((t += step), () =>
          bus.push(type, {
            intensity: 0.35 + Math.random() * 0.5 * (0.5 + complexity),
            complexity,
            duration: dur,
          }),
        );
        if (complexity > 0.45 && Math.random() < 0.45) {
          at(t + 120, () =>
            bus.push("PARALLEL_TASK", {
              intensity: 0.4 + complexity * 0.4,
              parallelTasks: parallelPeak,
              complexity,
              duration: dur,
            }),
          );
        }
      }

      if (complexity > 0.8 && Math.random() < 0.25) {
        at((t += 500), () => bus.push("ERROR", { intensity: 0.5, complexity }));
      }

      at((t += 900), () =>
        bus.push("RESULT_GENERATION", {
          intensity: 0.5 + complexity * 0.4,
          complexity,
          duration: 1400 + complexity * 2200,
          parallelTasks: Math.max(2, parallelPeak),
        }),
      );
      at((t += 1600 + complexity * 2000), () => bus.push("AI_COMPLETED", { intensity: 0.7, complexity }));
      at((t += 1200), () => bus.push("IDLE"));

      // rest, then another session
      at(t + 4000 + Math.random() * 9000, session);
    };

    at(2200, session);
  }

  stop() {
    this.stopped = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
