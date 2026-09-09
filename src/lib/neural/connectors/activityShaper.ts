import { activityBridge } from "../bridge";
import type { RawActivitySignal } from "../providers/types";

/**
 * Smart fallback for basic (level 1) sources.
 *
 * A browser AI only tells us: the user asked, it started answering, it is still
 * answering, it finished, it failed. That is enough for a living sphere, as long
 * as we *extrapolate honestly*: we generate generic thinking / result texture
 * that follows the real rhythm, and never invent observable inner operations
 * (no fake web searches, no fake tool calls, no fake database work).
 */
export class ActivityShaper {
  private timer: ReturnType<typeof setInterval> | null = null;
  private untap: (() => void) | null = null;
  private streamingUntil = 0;
  private startedAt = 0;
  private phase: "idle" | "thinking" | "streaming" = "idle";

  start() {
    if (this.untap) return;
    this.untap = activityBridge.tap((s) => this.observe(s));
    this.timer = setInterval(() => this.tick(), 420);
  }

  stop() {
    this.untap?.();
    this.untap = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.phase = "idle";
  }

  private observe(signal: RawActivitySignal) {
    if (this.isShaped(signal)) return;
    const type = String(signal.type).toUpperCase();
    const now = Date.now();
    if (type === "AI_STARTED" || type === "THINKING") {
      this.phase = "thinking";
      this.startedAt = now;
      this.streamingUntil = now + 9_000;
    } else if (type === "STREAMING" || type === "RESULT_GENERATION") {
      this.phase = "streaming";
      this.streamingUntil = now + 6_000;
    } else if (type === "AI_COMPLETED" || type === "ERROR" || type === "IDLE") {
      this.phase = "idle";
      this.streamingUntil = 0;
    }
  }

  private isShaped(signal: RawActivitySignal) {
    return (signal as { source?: string }).source === "shaper";
  }

  private tick() {
    if (this.phase === "idle") return;
    const now = Date.now();
    if (now > this.streamingUntil) {
      this.phase = "idle";
      activityBridge.ingest({ type: "AI_COMPLETED", intensity: 0.6, source: "shaper" });
      return;
    }
    const elapsed = (now - this.startedAt) / 1000;
    // longer answers = denser, deeper texture; still organic, never uniform
    const depth = Math.min(1, 0.35 + elapsed / 22);
    if (this.phase === "thinking") {
      activityBridge.ingest({
        type: "ANALYSIS",
        intensity: 0.35 + Math.random() * 0.45 * depth,
        complexity: depth,
        source: "shaper",
      });
    } else {
      activityBridge.ingest({
        type: "RESULT_GENERATION",
        intensity: 0.45 + Math.random() * 0.5 * depth,
        complexity: depth * 0.8,
        source: "shaper",
      });
    }
  }
}

export const activityShaper = new ActivityShaper();
