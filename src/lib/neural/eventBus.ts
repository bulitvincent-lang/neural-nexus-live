import type { AgentActivityEvent, ActivityEventType } from "./types";

type Listener = (event: AgentActivityEvent) => void;

/**
 * Tiny internal event bus. Any AI provider adapter (OpenAI, Anthropic, Gemini,
 * MCP, local models, custom agents) pushes normalised events in here.
 */
export class EventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: AgentActivityEvent) {
    for (const l of this.listeners) l(event);
  }

  push(type: ActivityEventType, partial: Partial<AgentActivityEvent> = {}) {
    this.emit({ timestamp: Date.now(), type, ...partial });
  }
}

export const activityBus = new EventBus();

/** Adapter contract: every provider integration implements this. */
export interface ActivityAdapter {
  name: string;
  start(bus: EventBus): void;
  stop(): void;
}
