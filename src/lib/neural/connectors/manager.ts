import { activityBridge } from "../bridge";
import { MockActivityProvider } from "../providers/mockProvider";
import { activityShaper } from "./activityShaper";
import { BrowserConnector } from "./browserConnector";
import { DeepConnector } from "./deepConnector";
import { LocalAgentConnector } from "./localAgentConnector";
import { aiOption, type AiId, type Connector, type ConnectorId, type ConnectorStatus } from "./types";

export interface AiLink {
  ai: AiId;
  connector: ConnectorId;
  /** connected at least once — used for silent auto-reconnect at every launch */
  established: boolean;
}

export interface ManagerSnapshot {
  links: AiLink[];
  statuses: Record<ConnectorId, ConnectorStatus>;
  /** any AI currently alive */
  live: boolean;
}

const STORE_KEY = "neural-sphere.links.v1";

/**
 * ConnectorManager — detection, connection, disconnection, reconnection,
 * health check. Several AIs can be linked at the same time; the engine just
 * receives one activity protocol and never knows who produced it.
 */
export class ConnectorManager {
  private connectors = new Map<ConnectorId, Connector>();
  private links: AiLink[] = [];
  private listeners = new Set<(s: ManagerSnapshot) => void>();
  private statuses = new Map<ConnectorId, ConnectorStatus>();
  private unsubs: Array<() => void> = [];
  private started = false;

  constructor() {
    this.add(new BrowserConnector());
    this.add(new LocalAgentConnector());
    this.add(new DeepConnector());
  }

  private add(c: Connector) {
    this.connectors.set(c.id, c);
    this.statuses.set(c.id, c.getStatus());
  }

  /** Called once at launch: restores every link silently (auto-reconnect). */
  start() {
    if (this.started) return () => this.stop();
    this.started = true;
    this.links = this.load();

    activityBridge.start();
    activityShaper.start();
    if (import.meta.env.DEV) activityBridge.register(new MockActivityProvider());

    for (const c of this.connectors.values()) {
      this.unsubs.push(
        c.subscribe((status) => {
          this.statuses.set(status.id, status);
          this.notify();
        }),
      );
    }
    for (const link of this.links) {
      if (link.established) void this.connectors.get(link.connector)?.connect();
    }
    this.notify();
    return () => this.stop();
  }

  stop() {
    this.started = false;
    for (const u of this.unsubs) u();
    this.unsubs = [];
    activityShaper.stop();
    activityBridge.stop();
  }

  /** The user only picks an AI — we choose the best available way to reach it. */
  async connect(ai: AiId) {
    const connectorId = this.detect(ai);
    const connector = this.connectors.get(connectorId);
    if (!connector) return;
    await connector.connect();
    const existing = this.links.find((l) => l.ai === ai);
    if (existing) {
      existing.connector = connectorId;
      existing.established = true;
    } else {
      this.links.push({ ai, connector: connectorId, established: true });
    }
    this.save();
    this.notify();
  }

  disconnect(ai: AiId) {
    const link = this.links.find((l) => l.ai === ai);
    this.links = this.links.filter((l) => l.ai !== ai);
    if (link && !this.links.some((l) => l.connector === link.connector)) {
      this.connectors.get(link.connector)?.disconnect();
    }
    this.save();
    this.notify();
  }

  /** Best available route for that AI. Invisible to the user. */
  detect(ai: AiId): ConnectorId {
    const preferred = aiOption(ai).channel;
    const candidate = this.connectors.get(preferred);
    if (candidate?.isAvailable()) return preferred;
    for (const c of this.connectors.values()) if (c.isAvailable()) return c.id;
    return preferred;
  }

  isConnected(ai: AiId) {
    const link = this.links.find((l) => l.ai === ai);
    if (!link) return false;
    const state = this.statuses.get(link.connector)?.state;
    return link.established && (state === "connected" || state === "waiting");
  }

  isLive(ai: AiId) {
    const link = this.links.find((l) => l.ai === ai);
    return !!link && this.statuses.get(link.connector)?.state === "connected";
  }

  hasAnyLink() {
    return this.links.length > 0;
  }

  snapshot(): ManagerSnapshot {
    return {
      links: [...this.links],
      statuses: Object.fromEntries(this.statuses) as Record<ConnectorId, ConnectorStatus>,
      live: [...this.statuses.values()].some((s) => s.state === "connected"),
    };
  }

  subscribe(cb: (s: ManagerSnapshot) => void) {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const snap = this.snapshot();
    for (const cb of this.listeners) cb(snap);
  }

  private load(): AiLink[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? (JSON.parse(raw) as AiLink[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.links));
    } catch {
      /* nothing the user should ever hear about */
    }
  }
}

export const connectorManager = new ConnectorManager();
