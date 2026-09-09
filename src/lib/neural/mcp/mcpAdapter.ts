import type { ActivityAdapter, EventBus } from "../eventBus";
import { mcpToActivityEvent, type McpSignal } from "./mapping";

/**
 * MCP activity adapter.
 *
 * Two ingestion paths, both invisible to the user:
 *  1. Local injection — an MCP host running in the same process (Tauri sidecar,
 *     browser client) calls `window.neuralMCP.report(signal)`.
 *  2. Remote stream — any MCP host POSTs signals to
 *     `/api/public/mcp-activity`, and this adapter consumes the SSE stream at
 *     `/api/public/mcp-activity?stream=1`.
 */

declare global {
  interface Window {
    neuralMCP?: {
      report: (signal: McpSignal) => void;
      inFlight: () => number;
    };
  }
}

export class McpActivityAdapter implements ActivityAdapter {
  name = "mcp";

  private bus: EventBus | null = null;
  private source: EventSource | null = null;
  private inFlight = 0;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(private readonly streamUrl = "/api/public/mcp-activity?stream=1") {}

  start(bus: EventBus) {
    this.bus = bus;
    this.stopped = false;

    if (typeof window !== "undefined") {
      window.neuralMCP = {
        report: (signal) => this.handle(signal),
        inFlight: () => this.inFlight,
      };
      this.connect();
    }
  }

  stop() {
    this.stopped = true;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.source?.close();
    this.source = null;
    if (typeof window !== "undefined") delete window.neuralMCP;
    this.bus = null;
  }

  private connect() {
    if (this.stopped || typeof EventSource === "undefined") return;
    try {
      const source = new EventSource(this.streamUrl);
      this.source = source;
      source.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as McpSignal | { signals?: McpSignal[] };
          const signals = "signals" in payload && payload.signals ? payload.signals : [payload as McpSignal];
          for (const s of signals) this.handle(s);
        } catch {
          /* malformed frame — ignore, the sphere must never break */
        }
      };
      source.onerror = () => {
        source.close();
        this.source = null;
        if (!this.stopped) this.retry = setTimeout(() => this.connect(), 4000);
      };
    } catch {
      this.retry = setTimeout(() => this.connect(), 8000);
    }
  }

  private handle(signal: McpSignal) {
    if (!this.bus) return;

    if (signal.phase === "request") this.inFlight += 1;
    else if (signal.phase === "result" || signal.phase === "error") {
      this.inFlight = Math.max(0, this.inFlight - 1);
    }

    const event = mcpToActivityEvent({
      ...signal,
      concurrency: signal.concurrency ?? Math.max(1, this.inFlight),
    });

    this.bus.emit(event);

    // A finished burst with nothing left in flight reads as a completion.
    if ((signal.phase === "result" || signal.phase === "error") && this.inFlight === 0) {
      this.bus.push("AI_COMPLETED", { intensity: 0.7 });
    }
  }
}
