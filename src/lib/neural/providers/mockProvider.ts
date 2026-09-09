import { EventBus } from "../eventBus";
import { MockActivityAdapter } from "../mockActivity";
import type { ActivityEmit, ActivityProvider, ProviderState } from "./types";

/**
 * Development / demo provider. Wraps the existing simulator and routes its
 * events through the bridge like any other integration.
 */
export class MockActivityProvider implements ActivityProvider {
  readonly id = "mock";
  readonly priority = 0;

  private adapter = new MockActivityAdapter();
  private inner = new EventBus();
  private unsubscribe: (() => void) | null = null;
  private state: ProviderState = "idle";

  isAvailable() {
    return true;
  }

  start(emit: ActivityEmit) {
    this.unsubscribe = this.inner.subscribe((event) => emit(event));
    this.adapter.start(this.inner);
    this.state = "live";
  }

  stop() {
    this.adapter.stop();
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.state = "idle";
  }

  getState() {
    return this.state;
  }
}
