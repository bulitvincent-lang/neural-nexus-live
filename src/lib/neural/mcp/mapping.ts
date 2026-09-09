import type { ActivityEventType, AgentActivityEvent } from "../types";

/**
 * MCP (Model Context Protocol) traffic -> visual activity vocabulary.
 * Nothing here is ever displayed; it only shapes the sphere's behaviour.
 */

export interface McpSignal {
  /** JSON-RPC method, e.g. "tools/call", "resources/read", "prompts/get" */
  method?: string;
  /** tool / resource / prompt name when known */
  name?: string;
  /** "request" | "result" | "error" | "notification" */
  phase?: "request" | "result" | "error" | "notification";
  /** number of simultaneous MCP operations in flight */
  concurrency?: number;
  /** rough payload size in bytes — drives intensity/complexity */
  size?: number;
  durationMs?: number;
}

const TOOL_HINTS: Array<[RegExp, ActivityEventType]> = [
  [/search|web|browse|fetch|http|crawl/i, "WEB_SEARCH"],
  [/sql|db|database|query|table|postgres|supabase/i, "DATABASE_QUERY"],
  [/file|fs|read_file|write|document|pdf|blob/i, "FILE_PROCESSING"],
  [/exec|run|shell|bash|code|sandbox|eval/i, "CODE_EXECUTION"],
  [/memory|vector|embed|recall|note/i, "MEMORY_ACCESS"],
  [/api|webhook|request|send|email|slack|notion|linear|jira/i, "API_CALL"],
];

export function mcpEventType(signal: McpSignal): ActivityEventType {
  const { method = "", name = "", phase } = signal;

  if (phase === "error") return "ERROR";

  if (/^initialize|^ping|^tools\/list|^resources\/list|^prompts\/list/.test(method)) {
    return "ANALYSIS";
  }
  if (/^resources\/(read|subscribe)/.test(method)) return "MEMORY_ACCESS";
  if (/^prompts\/get/.test(method)) return "ANALYSIS";
  if (/^completion\//.test(method)) return "RESULT_GENERATION";
  if (/^sampling\//.test(method)) return "RESULT_GENERATION";
  if (/^logging\//.test(method)) return "ANALYSIS";

  if (/^tools\/call/.test(method)) {
    if (phase === "result") return "RESULT_GENERATION";
    for (const [re, type] of TOOL_HINTS) if (re.test(name)) return type;
    return "TOOL_CALL";
  }

  for (const [re, type] of TOOL_HINTS) if (re.test(name || method)) return type;
  return phase === "result" ? "RESULT_GENERATION" : "TOOL_CALL";
}

/** Turn one MCP signal into a bus-ready event (no text, only numbers). */
export function mcpToActivityEvent(signal: McpSignal): AgentActivityEvent {
  const size = signal.size ?? 0;
  const complexity = Math.min(1, 0.25 + Math.log10(1 + size / 256) / 3);
  const parallel = Math.max(1, Math.min(8, signal.concurrency ?? 1));
  const intensity = Math.min(
    1,
    0.35 + complexity * 0.4 + (parallel - 1) * 0.06 + (signal.phase === "error" ? 0.2 : 0),
  );

  return {
    timestamp: Date.now(),
    type: mcpEventType(signal),
    intensity,
    complexity,
    parallelTasks: parallel,
    duration: signal.durationMs ?? (signal.phase === "request" ? 1600 : 700),
  };
}
