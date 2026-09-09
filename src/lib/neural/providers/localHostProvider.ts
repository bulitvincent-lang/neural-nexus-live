import type { McpSignal } from "../mcp/mapping";
import type { ActivityEmit, ActivityProvider, ProviderState, RawActivitySignal } from "./types";

declare global {
  interface Window {
    /** Generic in-process hook: any AI runtime in the same page/webview. */
    neuralActivity?: {
      report: (signal: RawActivitySignal) => void;
    };
    /** MCP-shaped in-process hook, used by the MCP provider. */
    neuralMCP?: {
      report: (signal: McpSignal) => void;
      inFlight: () => number;
    };
  }
}

/**
 * Generic local host provider — the app's own bridge, no third-party product.
 *
 * Accepts already-normalised-ish signals from:
 *  - window.neuralActivity.report({ type: "STREAMING" })
 *  - the local HTTP endpoint /api/public/mcp-activity (POST), streamed back
 *    over SSE by the MCP provider, which also forwards plain `type` signals
 *
 * This is the channel a Tauri sidecar or a user's own script should use when it
 * doesn't speak MCP.
 */
export class LocalHostProvider implements ActivityProvider {
  readonly id = "local-bridge";
  readonly priority = 5;

  private emit: ActivityEmit | null = null;
  private state: ProviderState = "idle";

  isAvailable() {
    return typeof window !== "undefined";
  }

  start(emit: ActivityEmit) {
    this.emit = emit;
    window.neuralActivity = { report: (signal) => this.emit?.(signal) };
    this.state = "live";
  }

  stop() {
    if (typeof window !== "undefined") delete window.neuralActivity;
    this.emit = null;
    this.state = "idle";
  }

  getState() {
    return this.state;
  }
}
