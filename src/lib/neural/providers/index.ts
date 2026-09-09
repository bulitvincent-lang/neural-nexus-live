import { activityBridge } from "../bridge";
import { LocalHostProvider } from "./localHostProvider";
import { MCPActivityProvider } from "./mcpProvider";
import { MockActivityProvider } from "./mockProvider";

export * from "./types";
export { normalizeSignal, resolveType } from "./normalize";
export { MCPActivityProvider } from "./mcpProvider";
export { MockActivityProvider } from "./mockProvider";
export { LocalHostProvider } from "./localHostProvider";

/**
 * V1 wiring: the generic local host bridge and the MCP adapter are always
 * registered (they stay silent until something speaks to them), and the mock
 * simulator runs in development so the sphere is always alive to look at.
 *
 * New integrations = one more `register(...)` call. The NeuralEngine is untouched.
 */
export function startDefaultProviders() {
  activityBridge.register(new LocalHostProvider());
  activityBridge.register(new MCPActivityProvider());
  if (import.meta.env.DEV) activityBridge.register(new MockActivityProvider());
  activityBridge.start();
  return () => activityBridge.stop();
}
