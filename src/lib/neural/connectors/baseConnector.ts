import { activityBridge } from "../bridge";
import type { ActivityProvider, RawActivitySignal } from "../providers/types";
import type {
  ActivityLevel,
  Connector,
  ConnectorId,
  ConnectorState,
  ConnectorStatus,
} from "./types";

/**
 * Shared plumbing: register a provider on the internal bridge, watch the raw
 * signal tap to know whether anything is actually alive, and expose a tiny
 * normalised status the settings UI can render as one word.
 */
export abstract class BaseConnector implements Connector {
  abstract readonly id: ConnectorId;
  abstract readonly level: ActivityLevel;
  /** signals whose `source` starts with one of these belong to this connector */
  protected abstract readonly sources: string[];
  /** how long without a signal before we consider the link asleep */
  protected readonly timeoutMs = 120_000;

  private state: ConnectorState = "unknown";
  private lastSeen = 0;
  private listeners = new Set<(s: ConnectorStatus) => void>();
  private untap: (() => void) | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private provider: ActivityProvider | null = null;

  protected abstract createProvider(): ActivityProvider;

  isAvailable() {
    return typeof window !== "undefined";
  }

  connect() {
    if (!this.provider) {
      this.provider = this.createProvider();
      activityBridge.register(this.provider);
    }
    if (!this.untap) {
      this.untap = activityBridge.tap((s) => this.onSignal(s));
    }
    if (!this.watchdog) {
      this.watchdog = setInterval(() => this.check(), 15_000);
    }
    this.set(this.lastSeen ? "connected" : "waiting");
  }

  disconnect() {
    if (this.provider) {
      activityBridge.unregister(this.provider.id);
      this.provider = null;
    }
    this.untap?.();
    this.untap = null;
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
    this.lastSeen = 0;
    this.set("missing");
  }

  getStatus(): ConnectorStatus {
    return { id: this.id, state: this.state, level: this.level, lastSeen: this.lastSeen };
  }

  subscribe(cb: (s: ConnectorStatus) => void) {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  protected owns(signal: RawActivitySignal) {
    const source = (signal as { source?: string }).source ?? "";
    return this.sources.some((s) => source.startsWith(s));
  }

  private onSignal(signal: RawActivitySignal) {
    if (!this.owns(signal)) return;
    this.lastSeen = Date.now();
    if (this.state !== "connected") this.set("connected");
  }

  private check() {
    if (!this.lastSeen) return;
    if (Date.now() - this.lastSeen > this.timeoutMs && this.state === "connected") {
      // asleep, not broken: the browser or the agent will come back on its own
      this.set("waiting");
    }
  }

  protected set(state: ConnectorState) {
    if (this.state === state) return;
    this.state = state;
    const status = this.getStatus();
    for (const cb of this.listeners) cb(status);
  }
}
