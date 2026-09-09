import { createFileRoute } from "@tanstack/react-router";

/**
 * MCP activity bridge.
 *
 * POST /api/public/mcp-activity        -> ingest one signal or { signals: [...] }
 * GET  /api/public/mcp-activity?stream=1 -> SSE stream consumed by the sphere
 *
 * Only numeric/enum activity metadata is accepted; no prompt or result content
 * is stored or forwarded.
 */

type Subscriber = (chunk: string) => void;

const subscribers = new Set<Subscriber>();

const PHASES = new Set(["request", "result", "error", "notification"]);

function sanitize(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : undefined;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 120) : undefined);

  return {
    // MCP-shaped fields
    method: str(r["method"]),
    name: str(r["name"]),
    phase: PHASES.has(String(r["phase"])) ? (r["phase"] as string) : undefined,
    // generic normalised fields (any non-MCP host)
    type: str(r["type"]),
    intensity: num(r["intensity"], 1),
    complexity: num(r["complexity"], 1),
    parallelTasks: num(r["parallelTasks"], 12),
    concurrency: num(r["concurrency"], 64),
    size: num(r["size"], 50_000_000),
    durationMs: num(r["durationMs"], 600_000),
    // routing hint only: letters, digits, dashes (no content can ride here)
    source: (str(r["source"]) ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || undefined,
  };
}


export const Route = createFileRoute("/api/public/mcp-activity")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("stream") !== "1") {
          return new Response(JSON.stringify({ ok: true, listeners: subscribers.size }), {
            headers: { "content-type": "application/json" },
          });
        }

        const encoder = new TextEncoder();
        let push: Subscriber;

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            push = (chunk) => {
              try {
                controller.enqueue(encoder.encode(chunk));
              } catch {
                subscribers.delete(push);
              }
            };
            subscribers.add(push);
            push(": connected\n\n");
          },
          cancel() {
            subscribers.delete(push);
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
          },
        });
      },

      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const list = Array.isArray((body as { signals?: unknown[] })?.signals)
          ? (body as { signals: unknown[] }).signals
          : [body];

        const signals = list.slice(0, 64).map(sanitize).filter(Boolean);
        if (signals.length === 0) return new Response("No signals", { status: 400 });

        const frame = `data: ${JSON.stringify({ signals })}\n\n`;
        for (const push of subscribers) push(frame);

        return new Response(JSON.stringify({ accepted: signals.length }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
