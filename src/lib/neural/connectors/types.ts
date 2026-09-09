/**
 * Connector layer.
 *
 * Connector -> internal bridge -> activity protocol -> NeuralEngine -> Sphere
 *
 * A connector is a *user-facing* idea ("ChatGPT", "Claude") on the outside and
 * a plain transport on the inside. Nothing technical ever reaches the UI: no
 * ports, no endpoints, no tokens.
 */

export type AiId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "copilot"
  | "codex"
  | "claude-code"
  | "other";

export interface AiOption {
  id: AiId;
  /** shown to the user, nothing else */
  label: string;
  /** short human hint, never technical */
  hint: string;
  /** two-letter mark used for the visual chip */
  mark: string;
  accent: string;
  /** how this AI is reached — internal only */
  channel: ConnectorId;
}

export type ConnectorId = "browser" | "local-agent" | "deep";

/** LEVEL 1 = basic activity, LEVEL 2 = deep activity. Internal only. */
export type ActivityLevel = 1 | 2;

export type ConnectorState =
  | "unknown"
  | "missing"
  | "waiting"
  | "connected"
  | "error";

export interface ConnectorStatus {
  id: ConnectorId;
  state: ConnectorState;
  level: ActivityLevel;
  /** timestamp of the last signal seen through this connector */
  lastSeen: number;
}

export interface Connector {
  readonly id: ConnectorId;
  readonly level: ActivityLevel;
  /** can this machine use it at all */
  isAvailable(): boolean;
  connect(): void | Promise<void>;
  disconnect(): void;
  getStatus(): ConnectorStatus;
  subscribe(cb: (status: ConnectorStatus) => void): () => void;
}

export const AI_OPTIONS: AiOption[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    hint: "Dans votre navigateur",
    mark: "GP",
    accent: "#38d6f0",
    channel: "browser",
  },
  {
    id: "claude",
    label: "Claude",
    hint: "Dans votre navigateur",
    mark: "CL",
    accent: "#f0b46a",
    channel: "browser",
  },
  {
    id: "gemini",
    label: "Gemini",
    hint: "Dans votre navigateur",
    mark: "GE",
    accent: "#4aa8ff",
    channel: "browser",
  },
  {
    id: "copilot",
    label: "Microsoft Copilot",
    hint: "Dans votre navigateur",
    mark: "CO",
    accent: "#7b5cf0",
    channel: "browser",
  },
  {
    id: "codex",
    label: "Codex",
    hint: "Sur votre ordinateur",
    mark: "CX",
    accent: "#2e6bff",
    channel: "local-agent",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    hint: "Sur votre ordinateur",
    mark: "CC",
    accent: "#cfe4ff",
    channel: "local-agent",
  },
  {
    id: "other",
    label: "Une autre IA",
    hint: "Nous cherchons automatiquement",
    mark: "··",
    accent: "#9fb6d8",
    channel: "deep",
  },
];

export function aiOption(id: AiId): AiOption {
  return AI_OPTIONS.find((o) => o.id === id) ?? AI_OPTIONS[AI_OPTIONS.length - 1];
}
