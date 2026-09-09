import { mcpEventType, type McpSignal } from "../mcp/mapping";
import type { ActivityEmit, ActivityProvider, ProviderState } from "./types";

/**
 * MCP provider — host-agnostic on purpose.
 *
 * It does not know or care whether the MCP traffic comes from a desktop chat
 * client, an IDE, a CLI agent or the app's own Tauri-side local host. It only
 * consumes MCP-shaped signals arriving through one of three generic channels:
 *
 *  1. in-process:  window.neuralMCP.report(signal)
 *  2. Tauri event: "ai-activity" emitted by the local Rust bridge
 *  3. HTTP/SSE:    the app's own local bridge endpoint
 *
 * Any future host plugs into one of these; nothing here is hardcoded to a
 * product.
 */
export class MCPActivityProvider implements ActivityProvider {
  readonly id = "mcp";
  readonly priority = 10;

  private emit: ActivityEmit | null = null;
  private source: EventSource | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private unlistenTauri: (() => void) | null = null;
  private inFlight = 0;
  private state: ProviderState = "idle";
  private stopped = false;

  constructor(private readonly streamUrl = "/api/public/mcp-activity?stream=1") {}

  isAvailable() {
    return typeof window !== "undefined";
  }

  async start(emit: ActivityEmit) {
    this.emit = emit;
    this.stopped = false;
    this.state = "connecting";

    // 1. in-process channel
    window.neuralMCP = {
      report: (signal: McpSignal) => this.handle(signal),
      inFlight: () => this.inFlight,
    };

    // 2. Tauri local bridge (present only when packaged as a desktop app)
    await this.attachTauri();

    // 3. HTTP/SSE local bridge
    this.connectStream();
  }

  stop() {
    this.stopped = true;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.source?.close();
    this.source = null;
    this.unlistenTauri?.();
    this.unlistenTauri = null;
    if (typeof window !== "undefined") delete window.neuralMCP;
    this.emit = null;
    this.state = "idle";
  }

  getState() {
    return this.state;
  }

  private async attachTauri() {
    const hasTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!hasTauri) return;
    try {
      const mod = (await import(/* @vite-ignore */ "@tauri-apps/api/event")) as {
        listen: (name: string, cb: (e: { payload: unknown }) => void) => Promise<() => void>;
      };
      this.unlistenTauri = await mod.listen("ai-activity", (e) => {
        const p = e.payload as McpSignal | { signals?: McpSignal[] } | null;
        if (!p) return;
        const list = "signals" in p && p.signals ? p.signals : [p as McpSignal];
        for (const s of list) this.handle(s);
      });
      this.state = "live";
    } catch {
      /* desktop bridge not present — the other channels still work */
    }
  }

  private connectStream() {
    if (this.stopped || typeof EventSource === "undefined") {
      this.state = this.state === "live" ? "live" : "unavailable";
      return;
    }
    try {
      const source = new EventSource(this.streamUrl);
      this.source = source;
      source.onopen = () => {
        this.state = "live";
      };
      source.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as McpSignal | { signals?: McpSignal[] };
          const list =
            "signals" in payload && payload.signals ? payload.signals : [payload as McpSignal];
          for (const s of list) this.handle(s);
        } catch {
          /* malformed frame — the sphere must never break */
        }
      };
      source.onerror = () => {
        source.close();
        this.source = null;
        this.state = "connecting";
        if (!this.stopped) this.retry = setTimeout(() => this.connectStream(), 4000);
      };
    } catch {
      this.state = "unavailable";
      this.retry = setTimeout(() => this.connectStream(), 8000);
    }
  }

  private handle(signal: McpSignal) {
    if (!this.emit) return;

    if (signal.phase === "request") this.inFlight += 1;
    else if (signal.phase === "result" || signal.phase === "error") {
      this.inFlight = Math.max(0, this.inFlight - 1);
    }

    this.emit({
      type: mcpEventType(signal),
      concurrency: signal.concurrency ?? Math.max(1, this.inFlight),
      size: signal.size,
      durationMs: signal.durationMs ?? (signal.phase === "request" ? 1600 : 700),
    });

    if ((signal.phase === "result" || signal.phase === "error") && this.inFlight === 0) {
      this.emit({ type: "AI_COMPLETED", intensity: 0.7 });
    }
  }
}
