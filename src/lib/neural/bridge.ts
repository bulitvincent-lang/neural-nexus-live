import { activityBus, type EventBus } from "./eventBus";
import { normalizeSignal } from "./providers/normalize";
import type { ActivityProvider, RawActivitySignal } from "./providers/types";

/**
 * Local Activity Bridge.
 *
 * The only thing that talks to the event bus. Providers push loose signals in;
 * the bridge normalises, rate-limits and forwards strict events out. Adding an
 * integration means registering a provider — the NeuralEngine never changes.
 */
export class LocalActivityBridge {
  private providers = new Map<string, ActivityProvider>();
  private running = false;
  private lastEmit = 0;
  private queue: RawActivitySignal[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private taps = new Set<(s: RawActivitySignal) => void>();

  /** max normalised events per second (visual budget, not a hard limit) */
  constructor(
    private readonly bus: EventBus = activityBus,
    private readonly maxEventsPerSecond = 24,
  ) {}

  register(provider: ActivityProvider) {
    this.providers.set(provider.id, provider);
    if (this.running && provider.isAvailable()) {
      void provider.start((s) => this.ingest(s));
    }
    return this;
  }

  unregister(id: string) {
    this.providers.get(id)?.stop();
    this.providers.delete(id);
  }

  start() {
    if (this.running) return;
    this.running = true;
    for (const p of this.providers.values()) {
      if (p.isAvailable()) void p.start((s) => this.ingest(s));
    }
    this.flushTimer = setInterval(() => this.flush(), 1000 / this.maxEventsPerSecond);
  }

  stop() {
    this.running = false;
    for (const p of this.providers.values()) p.stop();
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    this.queue = [];
  }

  /** Observe raw signals (used by connectors to know what is alive). */
  tap(cb: (s: RawActivitySignal) => void) {
    this.taps.add(cb);
    return () => this.taps.delete(cb);
  }

  /** Entry point for any provider (and for external code, e.g. a Tauri hook). */
  ingest(signal: RawActivitySignal) {
    if (!this.running) return;
    for (const cb of this.taps) cb(signal);
    // Keep the queue short: bursts should feel dense, not laggy.
    if (this.queue.length > 96) this.queue.splice(0, this.queue.length - 96);
    this.queue.push(signal);
  }

  /** Provider states, for diagnostics only — never rendered. */
  status() {
    return [...this.providers.values()].map((p) => ({ id: p.id, state: p.getState() }));
  }

  private flush() {
    const signal = this.queue.shift();
    if (!signal) return;
    const now = Date.now();
    this.lastEmit = now;
    this.bus.emit(normalizeSignal(signal));
  }

  /** ms since the last forwarded event (0 = never) */
  lastActivityAt() {
    return this.lastEmit;
  }
}

export const activityBridge = new LocalActivityBridge();
